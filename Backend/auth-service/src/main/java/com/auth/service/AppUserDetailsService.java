package com.auth.service;

import com.auth.entity.AppUser;
import com.auth.repository.AppUserRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final AppUserRepository appUserRepository;

    public AppUserDetailsService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        AppUser user = appUserRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("No user with email: " + email));

        boolean isEnabled = Boolean.TRUE.equals(user.getAccountEnabled())
                && (user.getProfile() == null || user.getProfile().getStatus() != com.auth.entity.UserStatus.DELETED);

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())
                .disabled(!isEnabled)
                .authorities(user.getRole().name())
                .build();
    }
}
