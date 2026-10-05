package com.auth.service;

import com.auth.dto.request.AdminUpdateUserRequest;
import com.auth.dto.response.AdminDashboardDTO;
import com.auth.dto.response.AdminUserDTO;
import com.auth.dto.response.UserStatsDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminUserService {

    Page<AdminUserDTO> getAdminUsers(String search, String roleStr, String status, Pageable pageable);

    AdminUserDTO getAdminUserById(Long userId);

    UserStatsDTO getUserStats();

    void softDeleteUser(Long targetUserId, String currentAdminEmail);

    AdminUserDTO toggleUserStatus(Long targetUserId, String currentAdminEmail);

    AdminUserDTO toggleDataManagerRole(Long targetUserId, String currentAdminEmail);

    AdminUserDTO updateAdminUser(Long targetUserId, AdminUpdateUserRequest request, String currentAdminEmail);

    AdminDashboardDTO getAdminDashboardStats();

    java.util.List<com.auth.dto.response.AdminAuditLogDTO> getAuditLogs();

    void recordAuditLog(String actorEmail, String actorRole, String action, String target, String details);
}
