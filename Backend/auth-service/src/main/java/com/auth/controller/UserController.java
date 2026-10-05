package com.auth.controller;

import com.auth.dto.request.AddressUpdateRequest;
import com.auth.dto.request.PreferencesUpdateRequest;
import com.auth.dto.request.ProfileUpdateRequest;
import com.auth.dto.response.ApiResponse;
import com.auth.entity.Address;
import com.auth.entity.AppUser;
import com.auth.entity.UserPreference;
import com.auth.entity.UserProfile;
import com.auth.repository.AppUserRepository;
import com.auth.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Profile Management", description = "Endpoints for retrieving and updating user demographics, physical addresses, and portal preferences")
public class UserController {

    private final UserProfileService userProfileService;
    private final AppUserRepository appUserRepository;
    private final com.auth.service.AdminUserService adminUserService;

    public UserController(UserProfileService userProfileService, AppUserRepository appUserRepository, com.auth.service.AdminUserService adminUserService) {
        this.userProfileService = userProfileService;
        this.appUserRepository = appUserRepository;
        this.adminUserService = adminUserService;
    }

    private Long getUserIdFromPrincipal(UserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalStateException("Unauthenticated user principal.");
        }
        AppUser user = appUserRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException("User not found: " + userDetails.getUsername()));
        return user.getId();
    }

    @GetMapping("/profile")
    @Operation(summary = "Get User Profile", description = "Retrieves profile demographic details for the authenticated user.")
    public ResponseEntity<ApiResponse<UserProfile>> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromPrincipal(userDetails);
        UserProfile profile = userProfileService.getUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully.", profile));
    }

    @PatchMapping("/profile")
    @Operation(summary = "Update User Profile", description = "Updates profile demographic details for the authenticated user.")
    public ResponseEntity<ApiResponse<UserProfile>> updateProfile(@AuthenticationPrincipal UserDetails userDetails,
                                                                   @Valid @RequestBody ProfileUpdateRequest request) {
        Long userId = getUserIdFromPrincipal(userDetails);
        UserProfile updatedProfile = userProfileService.updateUserProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully.", updatedProfile));
    }

    @GetMapping("/address")
    @Operation(summary = "Get User Address", description = "Retrieves physical mailing address details for the authenticated user.")
    public ResponseEntity<ApiResponse<Address>> getAddress(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromPrincipal(userDetails);
        Address address = userProfileService.getUserAddress(userId);
        return ResponseEntity.ok(ApiResponse.success("Address retrieved successfully.", address));
    }

    @PatchMapping("/address")
    @Operation(summary = "Update User Address", description = "Updates physical mailing address details for the authenticated user.")
    public ResponseEntity<ApiResponse<Address>> updateAddress(@AuthenticationPrincipal UserDetails userDetails,
                                                               @Valid @RequestBody AddressUpdateRequest request) {
        Long userId = getUserIdFromPrincipal(userDetails);
        Address updatedAddress = userProfileService.updateUserAddress(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Address updated successfully.", updatedAddress));
    }

    @GetMapping("/preferences")
    @Operation(summary = "Get User Preferences", description = "Retrieves notification and theme preferences for the authenticated user.")
    public ResponseEntity<ApiResponse<UserPreference>> getPreferences(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserIdFromPrincipal(userDetails);
        UserPreference preferences = userProfileService.getUserPreferences(userId);
        return ResponseEntity.ok(ApiResponse.success("Preferences retrieved successfully.", preferences));
    }

    @PatchMapping("/preferences")
    @Operation(summary = "Update User Preferences", description = "Updates notification and theme preferences for the authenticated user.")
    public ResponseEntity<ApiResponse<UserPreference>> updatePreferences(@AuthenticationPrincipal UserDetails userDetails,
                                                                           @Valid @RequestBody PreferencesUpdateRequest request) {
        Long userId = getUserIdFromPrincipal(userDetails);
        UserPreference updatedPreferences = userProfileService.updateUserPreferences(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Preferences updated successfully.", updatedPreferences));
    }
    @GetMapping("/role/{roleName}")
    @Operation(summary = "Get Users by Role", description = "Retrieves users by their role (used for internal service communication).")
    public ResponseEntity<java.util.List<com.auth.dto.response.UserSummaryDTO>> getUsersByRole(@PathVariable String roleName) {
        // Find users by role. We need to handle ROLE_ prefix.
        String fullRoleName = roleName;
        if (!fullRoleName.startsWith("ROLE_")) {
            fullRoleName = "ROLE_" + fullRoleName;
        }
        com.auth.entity.Role role;
        try {
            role = com.auth.entity.Role.valueOf(fullRoleName);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        
        java.util.List<com.auth.entity.AppUser> users = appUserRepository.findByRole(role);
        java.util.List<com.auth.dto.response.UserSummaryDTO> summaries = users.stream()
            .map(u -> {
                com.auth.dto.response.UserSummaryDTO dto = new com.auth.dto.response.UserSummaryDTO();
                dto.setId(u.getId());
                dto.setName(u.getName());
                dto.setEmail(u.getEmail());
                if (u.getProfile() != null && u.getProfile().getProfession() != null) {
                    dto.setProfession(u.getProfile().getProfession().name());
                }
                return dto;
            })
            .collect(java.util.stream.Collectors.toList());
            
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/by-profession")
    @Operation(summary = "Get Users by Profession", description = "Retrieves users matching a specific profession or domain.")
    public ResponseEntity<java.util.List<com.auth.dto.response.UserSummaryDTO>> getUsersByProfession(@RequestParam("profession") String profession) {
        java.util.List<com.auth.entity.AppUser> users = appUserRepository.findAll();
        String targetProf = profession.toUpperCase().replace(" ", "_");
        java.util.List<com.auth.dto.response.UserSummaryDTO> summaries = users.stream()
            .filter(u -> {
                if (u.getProfile() == null || u.getProfile().getProfession() == null) return false;
                return u.getProfile().getProfession().name().equalsIgnoreCase(targetProf);
            })
            .map(u -> {
                com.auth.dto.response.UserSummaryDTO dto = new com.auth.dto.response.UserSummaryDTO();
                dto.setId(u.getId());
                dto.setName(u.getName());
                dto.setEmail(u.getEmail());
                dto.setProfession(u.getProfile().getProfession().name());
                return dto;
            })
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/by-email")
    @Operation(summary = "Get User by Email", description = "Retrieves user summary by email (used for internal service communication).")
    public ResponseEntity<com.auth.dto.response.UserSummaryDTO> getUserByEmail(@RequestParam("email") String email) {
        return appUserRepository.findByEmailIgnoreCase(email)
                .map(u -> {
                    com.auth.dto.response.UserSummaryDTO dto = new com.auth.dto.response.UserSummaryDTO();
                    dto.setId(u.getId());
                    dto.setName(u.getName());
                    dto.setEmail(u.getEmail());
                    if (u.getProfile() != null && u.getProfile().getProfession() != null) {
                        dto.setProfession(u.getProfile().getProfession().name());
                    }
                    return ResponseEntity.ok(dto);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/admin/list")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Admin User Listing", description = "Retrieves paginated, filtered, and searchable user list for admin dashboard.")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<com.auth.dto.response.AdminUserDTO>>> getAdminUsers(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "direction", defaultValue = "DESC") String direction) {

        org.springframework.data.domain.Sort sort = "ASC".equalsIgnoreCase(direction)
                ? org.springframework.data.domain.Sort.by(sortBy).ascending()
                : org.springframework.data.domain.Sort.by(sortBy).descending();

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);
        org.springframework.data.domain.Page<com.auth.dto.response.AdminUserDTO> result = adminUserService.getAdminUsers(search, role, status, pageable);

        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully.", result));
    }

    @GetMapping("/admin/stats")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Admin User Statistics", description = "Retrieves overall user counts (total, active, suspended, pending) from database.")
    public ResponseEntity<ApiResponse<com.auth.dto.response.UserStatsDTO>> getUserStats() {
        com.auth.dto.response.UserStatsDTO stats = adminUserService.getUserStats();
        return ResponseEntity.ok(ApiResponse.success("User statistics retrieved successfully.", stats));
    }

    @GetMapping("/admin/dashboard-summary")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Admin User Dashboard Summary", description = "Retrieves user and role aggregated counts for admin dashboard.")
    public ResponseEntity<ApiResponse<com.auth.dto.response.AdminDashboardDTO>> getAdminDashboardStats() {
        com.auth.dto.response.AdminDashboardDTO summary = adminUserService.getAdminDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard statistics retrieved successfully.", summary));
    }

    @GetMapping("/admin/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Admin Get User By ID", description = "Retrieves complete Oracle profile information for a user.")
    public ResponseEntity<ApiResponse<com.auth.dto.response.AdminUserDTO>> getAdminUserById(
            @PathVariable("id") Long id) {
        com.auth.dto.response.AdminUserDTO user = adminUserService.getAdminUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully.", user));
    }

    @PutMapping("/admin/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Admin Update User", description = "Updates real Oracle user profile and address details.")
    public ResponseEntity<ApiResponse<com.auth.dto.response.AdminUserDTO>> updateAdminUser(
            @PathVariable("id") Long id,
            @Valid @RequestBody com.auth.dto.request.AdminUpdateUserRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : "";
        com.auth.dto.response.AdminUserDTO updated = adminUserService.updateAdminUser(id, request, adminEmail);
        return ResponseEntity.ok(ApiResponse.success("User profile updated successfully.", updated));
    }

    @DeleteMapping("/admin/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Admin Delete User", description = "Soft deletes a citizen or data manager account. Rejects deletion of System Admins.")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : "";
        adminUserService.softDeleteUser(id, adminEmail);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully.", null));
    }

    @RequestMapping(value = "/admin/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Admin Toggle User Status", description = "Toggles account enabled status between Active and Suspended.")
    public ResponseEntity<ApiResponse<com.auth.dto.response.AdminUserDTO>> toggleUserStatus(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : "";
        com.auth.dto.response.AdminUserDTO updated = adminUserService.toggleUserStatus(id, adminEmail);
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully.", updated));
    }

    @RequestMapping(value = "/admin/{id}/toggle-data-manager", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Admin Toggle Data Manager Role", description = "Toggles user role between DATA_MANAGER and CITIZEN.")
    public ResponseEntity<ApiResponse<com.auth.dto.response.AdminUserDTO>> toggleDataManagerRole(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : "";
        com.auth.dto.response.AdminUserDTO updated = adminUserService.toggleDataManagerRole(id, adminEmail);
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully.", updated));
    }

    @GetMapping("/admin/activity-logs")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Admin Audit Logs", description = "Retrieves real platform administrative audit trail.")
    public ResponseEntity<ApiResponse<java.util.List<com.auth.dto.response.AdminAuditLogDTO>>> getAdminAuditLogs() {
        java.util.List<com.auth.dto.response.AdminAuditLogDTO> logs = adminUserService.getAuditLogs();
        return ResponseEntity.ok(ApiResponse.success("Activity audit logs retrieved successfully.", logs));
    }
}
