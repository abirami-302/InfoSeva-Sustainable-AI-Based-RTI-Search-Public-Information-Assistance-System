package com.auth.service;

import com.auth.dto.request.ForgotPasswordRequest;
import com.auth.dto.request.ResetPasswordRequest;
import com.auth.dto.request.SendOtpRequest;
import com.auth.dto.request.VerifyOtpRequest;
import com.auth.entity.AppUser;
import com.auth.entity.OTPVerification;
import com.auth.exception.ResourceNotFoundException;
import com.auth.repository.AppUserRepository;
import com.auth.repository.OTPVerificationRepository;
import com.auth.repository.RefreshTokenRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@Service
public class OTPServiceImpl implements OTPService {

    @Value("${twofactor.api-key:}")
    private String twoFactorApiKey;

    private final OTPVerificationRepository otpVerificationRepository;
    private final AppUserRepository appUserRepository;
    private final com.auth.repository.UserProfileRepository userProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final RestTemplate restTemplate = new RestTemplate();
    private final SecureRandom random = new SecureRandom();

    public OTPServiceImpl(OTPVerificationRepository otpVerificationRepository,
                          AppUserRepository appUserRepository,
                          com.auth.repository.UserProfileRepository userProfileRepository,
                          RefreshTokenRepository refreshTokenRepository,
                          PasswordEncoder passwordEncoder,
                          ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.otpVerificationRepository = otpVerificationRepository;
        this.appUserRepository = appUserRepository;
        this.userProfileRepository = userProfileRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSenderProvider = mailSenderProvider;
    }

    private String hashOtp(String otpCode) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(otpCode.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    @Override
    @Transactional
    public void sendOTP(SendOtpRequest request) {
        String normalizedTarget = request.getTarget().trim().toLowerCase();

        // 1. Strict Server-Side Pre-Validation for Registration OTPs
        if ("EMAIL_VERIFICATION".equalsIgnoreCase(request.getType())) {
            if (appUserRepository.existsByEmailIgnoreCase(normalizedTarget)) {
                throw new com.auth.exception.UserAlreadyExistsException("An account with this email already exists. Please sign in instead.");
            }
        } else if ("PHONE_VERIFICATION".equalsIgnoreCase(request.getType())) {
            String cleanPhone = normalizedTarget.replaceAll("[^0-9]", "");
            if (cleanPhone.length() >= 10) {
                cleanPhone = cleanPhone.substring(cleanPhone.length() - 10);
            }
            if (userProfileRepository.existsByPhoneNumber(cleanPhone)) {
                throw new com.auth.exception.UserAlreadyExistsException("Mobile phone number is already registered with another account.");
            }
        }

        Optional<OTPVerification> existingOpt = otpVerificationRepository
                .findTopByTargetAndVerificationTypeOrderByCreatedAtDesc(normalizedTarget, request.getType());

        if (existingOpt.isPresent()) {
            OTPVerification existing = existingOpt.get();
            if (existing.getLockedUntil() != null && existing.getLockedUntil().isAfter(LocalDateTime.now())) {
                throw new IllegalStateException("Account temporarily locked due to too many OTP attempts. Please try again after 15 minutes.");
            }
            if (existing.getCreatedAt().plusSeconds(60).isAfter(LocalDateTime.now())) {
                throw new IllegalStateException("Please wait 60 seconds before requesting another OTP.");
            }
            if (existing.getSendCount() >= 5 && existing.getCreatedAt().toLocalDate().isEqual(LocalDateTime.now().toLocalDate())) {
                throw new IllegalStateException("Maximum daily OTP send limit reached for this contact.");
            }
        }

        // Clean up previous OTPs for this target & type
        otpVerificationRepository.deleteByTargetAndVerificationType(normalizedTarget, request.getType());

        // Generate 6-digit OTP code & SHA-256 hash
        String rawOtpCode = String.format("%06d", random.nextInt(1000000));
        String hashedOtp = hashOtp(rawOtpCode);
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(5); // Strict 5 minute expiry

        OTPVerification otpVerification = new OTPVerification(normalizedTarget, hashedOtp, request.getType(), expiryTime);
        if (existingOpt.isPresent()) {
            otpVerification.setSendCount(existingOpt.get().getSendCount() + 1);
        }
        otpVerificationRepository.save(otpVerification);

        // ── DEV CONSOLE LOG ────────────────────────────────────────────────────────
        // Always print the raw OTP to Spring logs so it's accessible even when
        // email/SMS delivery is unavailable. Remove this line before production.
        System.out.println("[INFOSEVA DEV OTP] target=" + normalizedTarget + "  code=" + rawOtpCode + "  type=" + request.getType());
        // ──────────────────────────────────────────────────────────────────────────

        // Dispatch OTP delivery ASYNC — never block the HTTP response thread.
        // The OTP is already saved to DB; delivery is best-effort.
        final String finalTarget  = normalizedTarget;
        final String finalOtpCode = rawOtpCode;

        if (finalTarget.contains("@")) {
            // ── EMAIL via SMTP ────────────────────────────────────────────────────
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender != null) {
                final JavaMailSender sender = mailSender;
                java.util.concurrent.CompletableFuture.runAsync(() -> {
                    try {
                        SimpleMailMessage message = new SimpleMailMessage();
                        message.setTo(finalTarget);
                        message.setSubject("InfoSeva Portal - Verification OTP Code");
                        message.setText("Dear Citizen,\n\nYour 6-digit InfoSeva verification OTP code is: " + finalOtpCode
                                + "\n\nThis code will expire in 5 minutes."
                                + "\nIf you did not request this OTP, please ignore this email."
                                + "\n\nRegards,\nInfoSeva Public Assistance Portal");
                        sender.send(message);
                        System.out.println("[INFOSEVA OTP SERVICE] Email sent successfully to: " + finalTarget);
                    } catch (Exception ex) {
                        System.err.println("[INFOSEVA OTP SERVICE WARNING] Failed to send SMTP email to " + finalTarget + ": " + ex.getMessage());
                    }
                });
            } else {
                System.err.println("[INFOSEVA OTP SERVICE WARNING] JavaMailSender bean not available — email not sent.");
            }
        } else {
            // ── SMS via 2Factor API ───────────────────────────────────────────────
            if (twoFactorApiKey != null && !twoFactorApiKey.isBlank()) {
                java.util.concurrent.CompletableFuture.runAsync(() -> {
                    try {
                        String cleanPhone = finalTarget.replaceAll("[^0-9]", "");
                        if (cleanPhone.length() >= 10) {
                            cleanPhone = cleanPhone.substring(cleanPhone.length() - 10);
                        }
                        String url = "https://2factor.in/API/V1/" + twoFactorApiKey.trim() + "/SMS/" + cleanPhone + "/" + finalOtpCode + "/OTP";
                        String response = restTemplate.getForObject(url, String.class);
                        System.out.println("[INFOSEVA OTP SERVICE] 2Factor SMS response for " + finalTarget + ": " + response);
                    } catch (Exception ex) {
                        System.err.println("[INFOSEVA OTP SERVICE WARNING] Failed to dispatch 2Factor SMS to " + finalTarget + ": " + ex.getMessage());
                    }
                });
            } else {
                System.err.println("[INFOSEVA OTP SERVICE WARNING] 2Factor API key not configured — SMS not sent.");
            }
        }
    }

    @Override
    @Transactional
    public boolean verifyOTP(VerifyOtpRequest request) {
        String normalizedTarget = request.getTarget().trim().toLowerCase();

        Optional<OTPVerification> otpOpt = otpVerificationRepository
                .findTopByTargetAndVerificationTypeOrderByCreatedAtDesc(normalizedTarget, request.getType());

        if (otpOpt.isEmpty()) {
            throw new IllegalArgumentException("No active OTP request found for target: " + normalizedTarget);
        }

        OTPVerification otp = otpOpt.get();

        if (otp.getLockedUntil() != null && otp.getLockedUntil().isAfter(LocalDateTime.now())) {
            throw new IllegalStateException("Account temporarily locked due to too many failed attempts. Please try again later.");
        }

        if (otp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP code has expired. Please request a new OTP.");
        }

        if (otp.getAttemptCount() >= 5) {
            otp.setLockedUntil(LocalDateTime.now().plusMinutes(15));
            otpVerificationRepository.save(otp);
            throw new IllegalStateException("Maximum 5 OTP verification attempts exceeded. Locked for 15 minutes.");
        }

        otp.setAttemptCount(otp.getAttemptCount() + 1);

        String inputHashed = hashOtp(request.getOtpCode());
        if (!otp.getOtpHash().equals(inputHashed)) {
            otpVerificationRepository.save(otp);
            throw new IllegalArgumentException("Invalid OTP code provided.");
        }

        otp.setIsVerified(true);
        otpVerificationRepository.save(otp);
        return true;
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String normalizedTarget = request.getTarget().trim().toLowerCase();

        AppUser user = appUserRepository.findByEmailIgnoreCase(normalizedTarget)
                .orElseThrow(() -> new ResourceNotFoundException("No account registered with: " + normalizedTarget));

        SendOtpRequest sendReq = new SendOtpRequest(user.getEmail(), "PASSWORD_RESET");
        sendOTP(sendReq);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String normalizedTarget = request.getTarget().trim().toLowerCase();

        VerifyOtpRequest verifyReq = new VerifyOtpRequest(normalizedTarget, request.getOtpCode(), "PASSWORD_RESET");
        verifyOTP(verifyReq);

        AppUser user = appUserRepository.findByEmailIgnoreCase(normalizedTarget)
                .orElseThrow(() -> new ResourceNotFoundException("No account registered with: " + normalizedTarget));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        appUserRepository.save(user);

        // Security Requirement: Revoke ALL Refresh Tokens upon password reset to force relogin across all sessions
        refreshTokenRepository.deleteByUser(user);

        // Clean up verified OTP
        otpVerificationRepository.deleteByTargetAndVerificationType(normalizedTarget, "PASSWORD_RESET");
    }
}
