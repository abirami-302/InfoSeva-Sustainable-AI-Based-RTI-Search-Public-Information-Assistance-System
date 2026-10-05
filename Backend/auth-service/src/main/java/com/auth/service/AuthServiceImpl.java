package com.auth.service;

import com.auth.config.JwtProperties;
import com.auth.dto.LoginRequest;
import com.auth.dto.RegisterRequest;
import com.auth.dto.request.LogoutRequest;
import com.auth.dto.response.AuthResponseData;
import com.auth.dto.response.TestUserDto;
import com.auth.dto.response.UserDto;
import com.auth.entity.*;
import java.util.List;
import java.util.ArrayList;
import com.auth.exception.UserAlreadyExistsException;
import com.auth.repository.AppUserRepository;
import com.auth.repository.OAuthAccountRepository;
import com.auth.security.JwtUtil;
import com.auth.repository.OTPVerificationRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final AppUserRepository appUserRepository;
    private final com.auth.repository.UserProfileRepository userProfileRepository;
    private final OAuthAccountRepository oAuthAccountRepository;
    private final OTPVerificationRepository otpVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final JwtProperties jwtProperties;
    private final com.auth.repository.AuditLogRepository auditLogRepository;

    public AuthServiceImpl(AppUserRepository appUserRepository,
                           com.auth.repository.UserProfileRepository userProfileRepository,
                           OAuthAccountRepository oAuthAccountRepository,
                           OTPVerificationRepository otpVerificationRepository,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           JwtUtil jwtUtil,
                           RefreshTokenService refreshTokenService,
                           JwtProperties jwtProperties,
                           com.auth.repository.AuditLogRepository auditLogRepository) {
        this.appUserRepository = appUserRepository;
        this.userProfileRepository = userProfileRepository;
        this.oAuthAccountRepository = oAuthAccountRepository;
        this.otpVerificationRepository = otpVerificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
        this.jwtProperties = jwtProperties;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional
    public UserDto register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String phoneNumber = request.getPhoneNumber().trim();
        String trimmedName = request.getName().trim();

        if (appUserRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new UserAlreadyExistsException("Email address is already registered.");
        }

        if (phoneNumber == null || phoneNumber.isBlank()) {
            throw new IllegalArgumentException("Mobile phone number is required for registration.");
        }
        if (userProfileRepository.existsByPhoneNumber(phoneNumber)) {
            throw new UserAlreadyExistsException("Mobile phone number is already registered with another account.");
        }

        // Mandatory Backend Email OTP Verification check
        Optional<OTPVerification> emailOtpOpt = otpVerificationRepository
                .findTopByTargetAndVerificationTypeOrderByCreatedAtDesc(normalizedEmail, "EMAIL_VERIFICATION");
        if (emailOtpOpt.isEmpty() || !Boolean.TRUE.equals(emailOtpOpt.get().getIsVerified())) {
            throw new IllegalStateException("Email verification required before registration. Please verify email OTP.");
        }

        // Optional Backend Phone OTP Verification check (mobile verification is optional)
        Optional<OTPVerification> phoneOtpOpt = otpVerificationRepository
                .findTopByTargetAndVerificationTypeOrderByCreatedAtDesc(phoneNumber, "PHONE_VERIFICATION");
        boolean isPhoneVerified = phoneOtpOpt.isPresent() && Boolean.TRUE.equals(phoneOtpOpt.get().getIsVerified());

        // 1. Create AppUser
        AppUser user = new AppUser();
        user.setName(trimmedName);
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.ROLE_CITIZEN);
        user.setAuthProvider(AuthenticationProvider.LOCAL);
        user.setEmailVerified(true);
        user.setPhoneVerified(isPhoneVerified);
        user.setAccountEnabled(true);

        // 2. Automatically instantiate UserProfile, Address, UserPreference (1:1 Aggregate Root)
        UserProfile profile = new UserProfile();
        profile.setPhoneNumber(phoneNumber);
        profile.setStatus(UserStatus.ACTIVE);

        if (request.getDob() != null && !request.getDob().isBlank()) {
            try {
                profile.setDateOfBirth(java.time.LocalDate.parse(request.getDob()));
            } catch (Exception ignored) {}
        }
        if (request.getGender() != null && !request.getGender().isBlank()) {
            try {
                profile.setGender(Gender.valueOf(request.getGender().toUpperCase()));
            } catch (Exception ignored) {}
        }
        if (request.getProfession() != null && !request.getProfession().isBlank()) {
            try {
                String profStr = request.getProfession().toUpperCase().replace(" ", "_");
                profile.setProfession(Profession.valueOf(profStr));
            } catch (Exception ignored) {}
        }

        Address address = new Address();
        address.setCountry("India");
        if (request.getState() != null) address.setState(request.getState().trim());
        if (request.getDistrict() != null) address.setDistrict(request.getDistrict().trim());
        if (request.getCity() != null) address.setCity(request.getCity().trim());
        if (request.getPincode() != null) address.setPincode(request.getPincode().trim());

        boolean hasAddress = address.getState() != null || address.getCity() != null;
        profile.setProfileCompleted(hasAddress);

        UserPreference preference = new UserPreference();
        preference.setPreferredLanguage(Language.ENGLISH);
        preference.setEmailNotifications(true);
        preference.setSmsNotifications(false);
        preference.setPushNotifications(true);
        preference.setDarkMode(false);

        profile.setAddress(address);
        profile.setUserPreference(preference);
        user.setProfile(profile);

        // 3. Save atomic aggregate commit
        AppUser savedUser = appUserRepository.save(user);

        String prof = (profile != null && profile.getProfession() != null) ? profile.getProfession().name() : null;
        String photoUrl = (profile != null) ? profile.getProfilePhotoUrl() : null;
        String phone = (profile != null) ? profile.getPhoneNumber() : null;
        String state = (address != null) ? address.getState() : null;
        String city = (address != null) ? address.getCity() : null;

        UserDto userDto = new UserDto(savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getRole().name(),
                profile.getStatus().name(), profile.getProfileCompleted(), savedUser.getAuthProvider().name(), prof, photoUrl);
        userDto.setPhoneNumber(phone);
        userDto.setState(state);
        userDto.setCity(city);
        return userDto;
    }

    @Override
    @Transactional
    public AuthResponseData login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword()));
        } catch (BadCredentialsException ex) {
            try {
                auditLogRepository.save(new AuditLog(normalizedEmail, "Guest", "FAILED_LOGIN", "Account: " + normalizedEmail, "Invalid credentials provided."));
            } catch (Exception ignored) {}
            throw new BadCredentialsException("Invalid email or password.");
        }

        AppUser user = appUserRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        // Mandatory Security Verification Rules before JWT issuing
        if (!Boolean.TRUE.equals(user.getAccountEnabled())) {
            throw new IllegalStateException("Your account has been disabled. Please contact support.");
        }
        if (user.getProfile() != null && user.getProfile().getStatus() != UserStatus.ACTIVE) {
            throw new IllegalStateException("Your account status is " + user.getProfile().getStatus() + ". Login rejected.");
        }
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new IllegalStateException("Please verify your email address before logging in.");
        }

        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        }
        String status = (profile != null && profile.getStatus() != null) ? profile.getStatus().name() : "ACTIVE";
        boolean completed = (profile != null && profile.getProfileCompleted() != null) ? profile.getProfileCompleted() : false;

        String prof = (profile != null && profile.getProfession() != null) ? profile.getProfession().name() : null;
        String photoUrl = (profile != null) ? profile.getProfilePhotoUrl() : null;
        String phone = (profile != null) ? profile.getPhoneNumber() : null;
        String state = (profile != null && profile.getAddress() != null) ? profile.getAddress().getState() : null;
        String city = (profile != null && profile.getAddress() != null) ? profile.getAddress().getCity() : null;

        UserDto userDto = new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole().name(),
                status, completed, user.getAuthProvider().name(), prof, photoUrl);
        userDto.setPhoneNumber(phone);
        userDto.setState(state);
        userDto.setCity(city);

        long expiresInSeconds = jwtProperties.getAccessTokenExpiration() / 1000;

        // Record Audit Log: USER_LOGIN
        try {
            String roleLabel = user.getRole() == Role.ROLE_ADMIN ? "Admin" : (user.getRole() == Role.ROLE_DATA_MANAGER ? "Data Manager" : "Citizen");
            auditLogRepository.save(new AuditLog(user.getEmail(), roleLabel, "USER_LOGIN", "Session: " + user.getName(), "User successfully authenticated."));
        } catch (Exception ignored) {}

        return new AuthResponseData(accessToken, refreshToken.getToken(), "Bearer", expiresInSeconds, userDto);
    }

    @Override
    @Transactional
    public AuthResponseData loginWithGoogle(String email, String googleSubject, String name) {
        String normalizedEmail = email.trim().toLowerCase();

        // 1. Primary Security Lookup: Query by Google Provider and unique Google Subject ID (sub)
        Optional<OAuthAccount> oauthOpt = oAuthAccountRepository
                .findByProviderAndProviderUserId(AuthenticationProvider.GOOGLE, googleSubject);

        AppUser user;

        if (oauthOpt.isPresent()) {
            OAuthAccount oauth = oauthOpt.get();
            user = oauth.getUser();
            oauth.setLastLogin(LocalDateTime.now());
            oAuthAccountRepository.save(oauth);
        } else {
            // Check if account already exists with local email
            Optional<AppUser> userOpt = appUserRepository.findByEmailIgnoreCase(normalizedEmail);
            if (userOpt.isPresent()) {
                user = userOpt.get();
            } else {
                // Auto-provision Google-authenticated citizen account
                user = new AppUser();
                user.setEmail(normalizedEmail);
                user.setName(name != null ? name : "Google User");
                user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString())); // Non-usable random password
                user.setRole(Role.ROLE_CITIZEN);
                user.setEmailVerified(true);
                user.setPhoneVerified(false);
                user.setAuthProvider(AuthenticationProvider.GOOGLE);

                UserProfile profile = new UserProfile();
                profile.setUser(user);
                profile.setStatus(UserStatus.ACTIVE);
                profile.setProfileCompleted(false);

                UserPreference preference = new UserPreference();
                preference.setPreferredLanguage(Language.ENGLISH);
                preference.setEmailNotifications(true);
                preference.setPushNotifications(true);
                preference.setDarkMode(false);

                profile.setUserPreference(preference);
                user.setProfile(profile);

                user = appUserRepository.save(user);
            }

            OAuthAccount newOAuth = new OAuthAccount(AuthenticationProvider.GOOGLE, googleSubject, normalizedEmail, user);
            oAuthAccountRepository.save(newOAuth);
        }

        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        }
        String status = (profile != null && profile.getStatus() != null) ? profile.getStatus().name() : "ACTIVE";
        boolean completed = (profile != null && profile.getProfileCompleted() != null) ? profile.getProfileCompleted() : false;
        String prof = (profile != null && profile.getProfession() != null) ? profile.getProfession().name() : null;
        String photoUrl = (profile != null) ? profile.getProfilePhotoUrl() : null;
        String phone = (profile != null) ? profile.getPhoneNumber() : null;
        String state = (profile != null && profile.getAddress() != null) ? profile.getAddress().getState() : null;
        String city = (profile != null && profile.getAddress() != null) ? profile.getAddress().getCity() : null;

        UserDto userDto = new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole().name(),
                status, completed, user.getAuthProvider().name(), prof, photoUrl);
        userDto.setPhoneNumber(phone);
        userDto.setState(state);
        userDto.setCity(city);

        long expiresInSeconds = jwtProperties.getAccessTokenExpiration() / 1000;

        return new AuthResponseData(accessToken, refreshToken.getToken(), "Bearer", expiresInSeconds, userDto);
    }

    @Override
    @Transactional
    public void logout(LogoutRequest request) {
        refreshTokenService.revokeRefreshToken(request.getRefreshToken());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TestUserDto> getTestUsers() {
        List<String> emails = List.of(
                "priya.sharma@example.com",
                "anita.nair@example.com",
                "meena.k@example.com"
        );
        List<TestUserDto> result = new ArrayList<>();
        for (String em : emails) {
            appUserRepository.findByEmailIgnoreCase(em).ifPresent(u -> {
                String role = u.getRole() == Role.ROLE_ADMIN ? "admin" : (u.getRole() == Role.ROLE_DATA_MANAGER ? "datamanager" : "user");
                String label = u.getRole() == Role.ROLE_ADMIN ? "Platform Admin" : (u.getRole() == Role.ROLE_DATA_MANAGER ? "Data Manager" : "Citizen User");
                UserProfile prof = u.getProfile();
                if (prof == null) {
                    prof = userProfileRepository.findByUserId(u.getId()).orElse(null);
                }
                String photo = (prof != null) ? prof.getProfilePhotoUrl() : null;
                result.add(new TestUserDto(u.getEmail(), "Password@123", u.getName(), role, label, photo));
            });
        }
        return result;
    }
}
