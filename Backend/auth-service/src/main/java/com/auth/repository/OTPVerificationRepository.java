package com.auth.repository;

import com.auth.entity.OTPVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OTPVerificationRepository extends JpaRepository<OTPVerification, Long> {

    Optional<OTPVerification> findTopByTargetAndVerificationTypeOrderByCreatedAtDesc(String target, String verificationType);

    void deleteByTargetAndVerificationType(String target, String verificationType);
}
