package com.auth.service;

import com.auth.dto.request.AdminUpdateUserRequest;
import com.auth.dto.response.AdminUserDTO;
import com.auth.dto.response.UserStatsDTO;
import com.auth.entity.*;
import com.auth.exception.ResourceNotFoundException;
import com.auth.repository.AppUserRepository;
import com.auth.repository.AppUserSpecifications;
import com.auth.repository.UserProfileRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.ArrayList;

@Service
public class AdminUserServiceImpl implements AdminUserService {

    private final AppUserRepository appUserRepository;
    private final UserProfileRepository userProfileRepository;
    private final com.auth.repository.RefreshTokenRepository refreshTokenRepository;
    private final com.auth.repository.AuditLogRepository auditLogRepository;

    public AdminUserServiceImpl(AppUserRepository appUserRepository,
                                UserProfileRepository userProfileRepository,
                                com.auth.repository.RefreshTokenRepository refreshTokenRepository,
                                com.auth.repository.AuditLogRepository auditLogRepository) {
        this.appUserRepository = appUserRepository;
        this.userProfileRepository = userProfileRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserDTO> getAdminUsers(String search, String roleStr, String status, Pageable pageable) {
        Role role = null;
        if (roleStr != null && !roleStr.trim().isEmpty() && !roleStr.equalsIgnoreCase("ALL")) {
            String cleanRole = roleStr.trim();
            if (!cleanRole.startsWith("ROLE_")) {
                cleanRole = "ROLE_" + cleanRole;
            }
            try {
                role = Role.valueOf(cleanRole.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid role filter: " + roleStr);
            }
        }

        Specification<AppUser> spec = AppUserSpecifications.withFilters(search, role, status);
        Page<AppUser> userPage = appUserRepository.findAll(spec, pageable);

        return userPage.map(this::mapToAdminUserDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserDTO getAdminUserById(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        return mapToAdminUserDTO(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserStatsDTO getUserStats() {
        // Exclude DELETED users from stats
        Specification<AppUser> allNotDeleted = AppUserSpecifications.withFilters(null, null, null);
        long total = appUserRepository.count(allNotDeleted);

        Specification<AppUser> activeSpec = AppUserSpecifications.withFilters(null, null, "ACTIVE");
        long active = appUserRepository.count(activeSpec);

        Specification<AppUser> suspendedSpec = AppUserSpecifications.withFilters(null, null, "SUSPENDED");
        long suspended = appUserRepository.count(suspendedSpec);

        Specification<AppUser> pendingSpec = AppUserSpecifications.withFilters(null, null, "PENDING");
        long pending = appUserRepository.count(pendingSpec);

        return new UserStatsDTO(total, active, suspended, pending);
    }

    @Override
    @Transactional(readOnly = true)
    public com.auth.dto.response.AdminDashboardDTO getAdminDashboardStats() {
        Specification<AppUser> allNotDeleted = AppUserSpecifications.withFilters(null, null, null);
        List<AppUser> allUsers = appUserRepository.findAll(allNotDeleted);

        long totalUsers = allUsers.size();
        long citizens = allUsers.stream().filter(u -> u.getRole() == Role.ROLE_CITIZEN).count();
        long dataManagers = allUsers.stream().filter(u -> u.getRole() == Role.ROLE_DATA_MANAGER).count();
        long admins = allUsers.stream().filter(u -> u.getRole() == Role.ROLE_ADMIN).count();

        long activeUsers = allUsers.stream()
                .filter(u -> Boolean.TRUE.equals(u.getAccountEnabled()) && (u.getProfile() == null || u.getProfile().getStatus() != UserStatus.SUSPENDED))
                .count();

        long suspendedUsers = allUsers.stream()
                .filter(u -> !Boolean.TRUE.equals(u.getAccountEnabled()) || (u.getProfile() != null && u.getProfile().getStatus() == UserStatus.SUSPENDED))
                .count();

        long pendingUsers = allUsers.stream()
                .filter(u -> u.getProfile() == null || !Boolean.TRUE.equals(u.getProfile().getProfileCompleted()))
                .count();

        long pendingDataManagers = allUsers.stream()
                .filter(u -> u.getRole() == Role.ROLE_DATA_MANAGER && (u.getProfile() == null || !Boolean.TRUE.equals(u.getProfile().getProfileCompleted())))
                .count();

        // Calculate actual user registrations by date/month from database createdAt timestamps
        java.util.Map<String, Long> monthCounts = new java.util.LinkedHashMap<>();
        java.time.format.DateTimeFormatter monthFmt = java.time.format.DateTimeFormatter.ofPattern("MMM yyyy");

        for (AppUser u : allUsers) {
            java.time.LocalDateTime created = u.getCreatedAt() != null ? u.getCreatedAt() : java.time.LocalDateTime.now();
            String mKey = created.format(monthFmt);
            monthCounts.put(mKey, monthCounts.getOrDefault(mKey, 0L) + 1L);
        }

        java.util.List<com.auth.dto.response.AdminDashboardDTO.MonthlyCountDTO> monthlyCounts = new java.util.ArrayList<>();
        for (java.util.Map.Entry<String, Long> entry : monthCounts.entrySet()) {
            monthlyCounts.add(new com.auth.dto.response.AdminDashboardDTO.MonthlyCountDTO(entry.getKey(), entry.getValue()));
        }

        return new com.auth.dto.response.AdminDashboardDTO(
                totalUsers,
                citizens,
                dataManagers,
                admins,
                activeUsers,
                suspendedUsers,
                pendingUsers,
                pendingDataManagers,
                monthlyCounts
        );
    }

    @Override
    @Transactional
    public void softDeleteUser(Long targetUserId, String currentAdminEmail) {
        AppUser targetUser = appUserRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + targetUserId));

        if (targetUser.getRole() == Role.ROLE_ADMIN) {
            throw new AccessDeniedException("Prohibited operation: System Administrators are protected and cannot be deleted.");
        }

        if (targetUser.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new IllegalArgumentException("Invalid operation: You cannot delete your own administrator account.");
        }

        targetUser.setAccountEnabled(false);
        appUserRepository.save(targetUser);

        // Revoke active sessions / refresh tokens
        refreshTokenRepository.deleteByUser(targetUser);

        UserProfile profile = userProfileRepository.findByUserId(targetUserId).orElse(null);
        if (profile != null) {
            profile.setStatus(UserStatus.DELETED);
            userProfileRepository.save(profile);
        } else {
            UserProfile newProfile = new UserProfile();
            newProfile.setUser(targetUser);
            newProfile.setStatus(UserStatus.DELETED);
            newProfile.setProfileCompleted(false);
            userProfileRepository.save(newProfile);
        }

        // Record Audit Log: USER_DELETED
        recordAuditLog(
                currentAdminEmail,
                "Admin",
                "USER_DELETED",
                "User: " + targetUser.getName() + " (" + targetUser.getEmail() + ")",
                "Account soft-deleted and access revoked."
        );
    }

    @Override
    @Transactional
    public AdminUserDTO toggleUserStatus(Long targetUserId, String currentAdminEmail) {
        AppUser targetUser = appUserRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + targetUserId));

        if (targetUser.getRole() == Role.ROLE_ADMIN && !targetUser.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new AccessDeniedException("Prohibited operation: System Administrator account statuses cannot be modified by another admin.");
        }

        boolean newEnabled = !Boolean.TRUE.equals(targetUser.getAccountEnabled());
        targetUser.setAccountEnabled(newEnabled);
        appUserRepository.save(targetUser);

        UserProfile profile = userProfileRepository.findByUserId(targetUserId).orElse(null);
        if (profile != null) {
            profile.setStatus(newEnabled ? UserStatus.ACTIVE : UserStatus.SUSPENDED);
            userProfileRepository.save(profile);
        }

        // If suspended, invalidate all refresh tokens
        if (!newEnabled) {
            refreshTokenRepository.deleteByUser(targetUser);
        }

        // Record Audit Log: USER_ACTIVATED / USER_SUSPENDED
        String action = newEnabled ? "USER_ACTIVATED" : "USER_SUSPENDED";
        String statusChange = newEnabled ? "SUSPENDED → ACTIVE" : "ACTIVE → SUSPENDED";
        recordAuditLog(
                currentAdminEmail,
                "Admin",
                action,
                "User: " + targetUser.getName() + " (" + targetUser.getEmail() + ")",
                "Status changed: " + statusChange
        );

        return mapToAdminUserDTO(targetUser);
    }

    @Override
    @Transactional
    public AdminUserDTO toggleDataManagerRole(Long targetUserId, String currentAdminEmail) {
        AppUser targetUser = appUserRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + targetUserId));

        if (targetUser.getRole() == Role.ROLE_ADMIN) {
            throw new AccessDeniedException("Prohibited operation: System Administrators cannot be modified.");
        }

        Role newRole = (targetUser.getRole() == Role.ROLE_DATA_MANAGER) ? Role.ROLE_CITIZEN : Role.ROLE_DATA_MANAGER;
        targetUser.setRole(newRole);
        appUserRepository.save(targetUser);

        UserProfile profile = userProfileRepository.findByUserId(targetUserId).orElse(null);
        if (profile != null && newRole == Role.ROLE_DATA_MANAGER) {
            if (profile.getProfession() == null || profile.getProfession() == Profession.OTHER) {
                profile.setProfession(Profession.GOVERNMENT_EMPLOYEE);
            }
            userProfileRepository.save(profile);
        }

        String actionName = (newRole == Role.ROLE_DATA_MANAGER) ? "ROLE_PROMOTED_DATA_MANAGER" : "ROLE_REVERTED_CITIZEN";
        recordAuditLog(
                currentAdminEmail,
                "Admin",
                actionName,
                "User: " + targetUser.getName() + " (" + targetUser.getEmail() + ")",
                "User role updated to " + newRole.name() + " by " + currentAdminEmail
        );

        return mapToAdminUserDTO(targetUser);
    }

    @Override
    @Transactional
    public AdminUserDTO updateAdminUser(Long targetUserId, AdminUpdateUserRequest request, String currentAdminEmail) {
        AppUser user = appUserRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + targetUserId));

        if (user.getRole() == Role.ROLE_ADMIN && !user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new AccessDeniedException("Prohibited operation: Another System Administrator's profile cannot be edited.");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
            appUserRepository.save(user);
        }

        UserProfile profile = userProfileRepository.findByUserId(targetUserId).orElse(null);
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
            profile.setStatus(UserStatus.ACTIVE);
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            profile.setPhoneNumber(request.getPhone().trim());
        }

        if (request.getDob() != null && !request.getDob().isBlank()) {
            try {
                profile.setDateOfBirth(LocalDate.parse(request.getDob().trim()));
            } catch (Exception ignored) {}
        }

        if (request.getGender() != null && !request.getGender().isBlank()) {
            try {
                profile.setGender(Gender.valueOf(request.getGender().trim().toUpperCase()));
            } catch (Exception ignored) {}
        }

        if (request.getProfession() != null && !request.getProfession().isBlank()) {
            try {
                String prof = request.getProfession().trim().toUpperCase().replace(" ", "_");
                profile.setProfession(Profession.valueOf(prof));
            } catch (Exception ignored) {}
        }

        Address address = profile.getAddress();
        if (address == null) {
            address = new Address();
            address.setCountry("India");
        }

        if (request.getState() != null) address.setState(request.getState().trim());
        if (request.getDistrict() != null) address.setDistrict(request.getDistrict().trim());
        if (request.getCity() != null) address.setCity(request.getCity().trim());
        if (request.getPincode() != null) address.setPincode(request.getPincode().trim());

        profile.setAddress(address);

        boolean hasAddress = address.getState() != null || address.getCity() != null || profile.getPhoneNumber() != null;
        profile.setProfileCompleted(hasAddress);
        userProfileRepository.save(profile);

        // Record Audit Log: USER_UPDATED / DATA_MANAGER_UPDATED
        String actionType = user.getRole() == Role.ROLE_DATA_MANAGER ? "DATA_MANAGER_UPDATED" : "USER_UPDATED";
        recordAuditLog(
                currentAdminEmail,
                "Admin",
                actionType,
                (user.getRole() == Role.ROLE_DATA_MANAGER ? "Data Manager: " : "User: ") + user.getName() + " (" + user.getEmail() + ")",
                "Profile and demographic details updated by Administrator."
        );

        return mapToAdminUserDTO(user);
    }

    public AdminUserDTO mapToAdminUserDTO(AppUser user) {
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);

        boolean isProtected = user.getRole() == Role.ROLE_ADMIN;
        boolean isAccountEnabled = Boolean.TRUE.equals(user.getAccountEnabled());

        String phone = null;
        LocalDate dob = null;
        String gender = null;
        String profession = null;
        String state = null;
        String district = null;
        String city = null;
        String pincode = null;

        if (profile != null) {
            phone = profile.getPhoneNumber();
            dob = profile.getDateOfBirth();
            gender = profile.getGender() != null ? profile.getGender().name() : null;
            profession = profile.getProfession() != null ? profile.getProfession().name() : null;

            Address address = profile.getAddress();
            if (address != null) {
                state = address.getState();
                district = address.getDistrict();
                city = address.getCity();
                pincode = address.getPincode();
            }
        }

        // Profile is considered complete if explicitly marked complete, or has phone/state/city populated, or is Admin
        boolean isProfileComplete = user.getRole() == Role.ROLE_ADMIN ||
                (profile != null && (Boolean.TRUE.equals(profile.getProfileCompleted())
                        || profile.getPhoneNumber() != null
                        || (profile.getAddress() != null && (profile.getAddress().getState() != null || profile.getAddress().getCity() != null))));

        // Status Priority: DELETED -> SUSPENDED -> PENDING -> ACTIVE
        String status;
        if (profile != null && profile.getStatus() == UserStatus.DELETED) {
            status = "Deleted";
        } else if (!isAccountEnabled || (profile != null && profile.getStatus() == UserStatus.SUSPENDED)) {
            status = "Suspended";
        } else if (!isProfileComplete) {
            status = "Pending";
        } else {
            status = "Active";
        }

        return new AdminUserDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                status,
                isAccountEnabled,
                phone,
                dob,
                gender,
                profession,
                state,
                district,
                city,
                pincode,
                isProfileComplete,
                user.getCreatedAt(),
                isProtected
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.auth.dto.response.AdminAuditLogDTO> getAuditLogs() {
        List<AuditLog> logs = auditLogRepository.findTop200ByOrderByCreatedAtDesc();
        List<com.auth.dto.response.AdminAuditLogDTO> dtoList = new ArrayList<>();
        for (AuditLog l : logs) {
            dtoList.add(new com.auth.dto.response.AdminAuditLogDTO(
                    l.getId(),
                    l.getUserEmail(),
                    l.getActorRole() != null ? l.getActorRole() : "User",
                    l.getAction(),
                    l.getTarget(),
                    l.getDetails(),
                    l.getCreatedAt()
            ));
        }
        return dtoList;
    }

    @Override
    @Transactional
    public void recordAuditLog(String actorEmail, String actorRole, String action, String target, String details) {
        try {
            AuditLog log = new AuditLog(actorEmail, actorRole, action, target, details);
            auditLogRepository.save(log);
        } catch (Exception e) {
            // Log failure gracefully without disrupting primary transaction
        }
    }
}
