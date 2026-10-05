package com.auth.repository;

import com.auth.entity.AppUser;
import com.auth.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, Long>, JpaSpecificationExecutor<AppUser> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<AppUser> findByRole(Role role);

    long countByRole(Role role);

    long countByAccountEnabled(Boolean accountEnabled);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM AppUser u WHERE u.profile IS NULL OR u.profile.status <> com.auth.entity.UserStatus.DELETED ORDER BY u.createdAt DESC")
    List<AppUser> findRecentActiveUsers(org.springframework.data.domain.Pageable pageable);
}
