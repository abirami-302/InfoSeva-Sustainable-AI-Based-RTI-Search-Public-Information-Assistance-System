package com.auth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", length = 150)
    private String userEmail;

    @Column(name = "actor_role", length = 50)
    private String actorRole;

    @Column(name = "action", nullable = false, length = 100)
    private String action; // e.g. USER_LOGIN, FAILED_LOGIN, USER_SUSPENDED, USER_ACTIVATED, USER_DELETED, USER_UPDATED, DATA_MANAGER_UPDATED, DOCUMENT_UPLOADED, DOCUMENT_APPROVED, DOCUMENT_REJECTED

    @Column(name = "target", length = 150)
    private String target;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "SUCCESS"; // SUCCESS, FAILURE

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "user_agent", length = 300)
    private String userAgent;

    @Column(name = "details", length = 500)
    private String details;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AuditLog() {
    }

    public AuditLog(String userEmail, String actorRole, String action, String target, String details) {
        this.userEmail = userEmail;
        this.actorRole = actorRole;
        this.action = action;
        this.target = target;
        this.details = details;
        this.status = "SUCCESS";
    }

    public AuditLog(String userEmail, String action, String status, String ipAddress, String userAgent, String details) {
        this.userEmail = userEmail;
        this.action = action;
        this.status = status;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.details = details;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
