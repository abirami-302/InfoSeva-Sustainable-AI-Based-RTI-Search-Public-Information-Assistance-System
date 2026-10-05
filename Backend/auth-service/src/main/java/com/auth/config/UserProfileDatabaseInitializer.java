package com.auth.config;

import com.auth.entity.*;
import com.auth.repository.AddressRepository;
import com.auth.repository.AppUserRepository;
import com.auth.repository.UserProfileRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import com.auth.entity.AuthenticationProvider;
import org.springframework.security.crypto.password.PasswordEncoder;

@Component
public class UserProfileDatabaseInitializer implements CommandLineRunner {

    private final AppUserRepository appUserRepository;
    private final UserProfileRepository userProfileRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileDatabaseInitializer(AppUserRepository appUserRepository,
                                          UserProfileRepository userProfileRepository,
                                          AddressRepository addressRepository,
                                          PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.userProfileRepository = userProfileRepository;
        this.addressRepository = addressRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private void seedTestUser(String email, String password, String name, Role role) {
        if (!appUserRepository.existsByEmailIgnoreCase(email)) {
            AppUser user = new AppUser();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setName(name);
            user.setRole(role);
            user.setAuthProvider(AuthenticationProvider.LOCAL);
            user.setAccountEnabled(true);
            user.setEmailVerified(true);
            user.setPhoneVerified(true);
            user.setCreatedAt(java.time.LocalDateTime.now());
            user.setUpdatedAt(java.time.LocalDateTime.now());
            appUserRepository.save(user);
        }
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedTestUser("priya.sharma@example.com", "Password@123", "Priya Sharma", Role.ROLE_CITIZEN);
        seedTestUser("anita.nair@example.com", "Password@123", "Anita Nair", Role.ROLE_ADMIN);
        seedTestUser("meena.k@example.com", "Password@123", "Meena Krishnan", Role.ROLE_DATA_MANAGER);

        List<AppUser> allUsers = appUserRepository.findAll();

        for (AppUser user : allUsers) {
            // Ensure createdAt exists for registration trend analytics
            if (user.getCreatedAt() == null) {
                user.setCreatedAt(java.time.LocalDateTime.now());
                appUserRepository.save(user);
            }

            UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);

            if (profile == null) {
                profile = new UserProfile();
                profile.setUser(user);
                profile.setStatus(Boolean.TRUE.equals(user.getAccountEnabled()) ? UserStatus.ACTIVE : UserStatus.SUSPENDED);
            }

            // Generate deterministic phone number if missing: e.g. 9840000000 + id
            if (profile.getPhoneNumber() == null || profile.getPhoneNumber().isBlank()) {
                String genPhone = String.format("98%08d", user.getId());
                // ensure within 10 digits
                if (genPhone.length() > 10) {
                    genPhone = genPhone.substring(0, 10);
                }
                // Only set if not duplicate
                if (!userProfileRepository.existsByPhoneNumber(genPhone)) {
                    profile.setPhoneNumber(genPhone);
                } else {
                    String altPhone = String.format("97%08d", user.getId());
                    if (!userProfileRepository.existsByPhoneNumber(altPhone)) {
                        profile.setPhoneNumber(altPhone);
                    }
                }
            }

            if (profile.getDateOfBirth() == null) {
                profile.setDateOfBirth(LocalDate.of(1995, 1, 15));
            }

            if (profile.getGender() == null) {
                profile.setGender(Gender.FEMALE);
            }

            if (profile.getProfession() == null) {
                if (user.getRole() == Role.ROLE_DATA_MANAGER) {
                    profile.setProfession(Profession.GOVERNMENT_EMPLOYEE);
                } else if (user.getRole() == Role.ROLE_ADMIN) {
                    profile.setProfession(Profession.GOVERNMENT_EMPLOYEE);
                } else {
                    profile.setProfession(Profession.PRIVATE_EMPLOYEE);
                }
            }

            // Ensure Address exists in ADDRESSES table
            Address address = profile.getAddress();
            if (address == null) {
                address = new Address();
                address.setState("Tamil Nadu");
                address.setDistrict("Chennai");
                address.setCity("Chennai");
                address.setPincode("600001");
                address.setCountry("India");
                address = addressRepository.save(address);
                profile.setAddress(address);
            } else {
                if (address.getState() == null) address.setState("Tamil Nadu");
                if (address.getDistrict() == null) address.setDistrict("Chennai");
                if (address.getCity() == null) address.setCity("Chennai");
                if (address.getPincode() == null) address.setPincode("600001");
                if (address.getCountry() == null) address.setCountry("India");
                addressRepository.save(address);
            }

            profile.setProfileCompleted(true);
            userProfileRepository.save(profile);
        }
    }
}
