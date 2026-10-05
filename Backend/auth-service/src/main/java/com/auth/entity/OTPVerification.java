package com.auth.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verifications")
public class OTPVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Target cannot be null")
    @Column(nullable = false, length = 150)
    private String target; // Email or Phone number

    @NotNull(message = "OTP hash cannot be null")
    @Column(name = "otp_hash", nullable = false, length = 255)
    private String otpHash; // SHA-256 Hashed OTP Code

    @Column(name = "verification_type", nullable = false, length = 30)
    private String verificationType; // EMAIL_VERIFICATION, PHONE_VERIFICATION, PASSWORD_RESET, EMAIL_CHANGE, PHONE_CHANGE, LOGIN_VERIFICATION

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    @Column(name = "expiry_time", nullable = false)
    private LocalDateTime expiryTime;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 0;

    @Column(name = "send_count", nullable = false)
    private Integer sendCount = 1;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public OTPVerification() {
    }

    public OTPVerification(String target, String otpHash, String verificationType, LocalDateTime expiryTime) {
        this.target = target;
        this.otpHash = otpHash;
        this.verificationType = verificationType;
        this.expiryTime = expiryTime;
        this.isVerified = false;
        this.attemptCount = 0;
        this.sendCount = 1;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public String getOtpHash() {
        return otpHash;
    }

    public void setOtpHash(String otpHash) {
        this.otpHash = otpHash;
    }

    public String getVerificationType() {
        return verificationType;
    }

    public void setVerificationType(String verificationType) {
        this.verificationType = verificationType;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }

    public LocalDateTime getExpiryTime() {
        return expiryTime;
    }

    public void setExpiryTime(LocalDateTime expiryTime) {
        this.expiryTime = expiryTime;
    }

    public Integer getAttemptCount() {
        return attemptCount;
    }

    public void setAttemptCount(Integer attemptCount) {
        this.attemptCount = attemptCount;
    }

    public Integer getSendCount() {
        return sendCount;
    }

    public void setSendCount(Integer sendCount) {
        this.sendCount = sendCount;
    }

    public LocalDateTime getLockedUntil() {
        return lockedUntil;
    }

    public void setLockedUntil(LocalDateTime lockedUntil) {
        this.lockedUntil = lockedUntil;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
