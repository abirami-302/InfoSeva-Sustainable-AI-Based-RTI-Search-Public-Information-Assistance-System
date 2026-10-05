package com.auth.repository;

import com.auth.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    List<AuditLog> findAllByOrderByCreatedAtDesc();

    List<AuditLog> findTop200ByOrderByCreatedAtDesc();
}
