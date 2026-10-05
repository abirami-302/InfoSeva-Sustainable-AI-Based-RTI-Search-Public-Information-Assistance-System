package com.auth.dto.response;

import java.time.LocalDateTime;

public class AdminAuditLogDTO {
    private Long id;
    private String userEmail;
    private String actorRole;
    private String action;
    private String target;
    private String details;
    private LocalDateTime createdAt;

    public AdminAuditLogDTO() {
    }

    public AdminAuditLogDTO(Long id, String userEmail, String actorRole, String action, String target, String details, LocalDateTime createdAt) {
        this.id = id;
        this.userEmail = userEmail;
        this.actorRole = actorRole;
        this.action = action;
        this.target = target;
        this.details = details;
        this.createdAt = createdAt;
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
