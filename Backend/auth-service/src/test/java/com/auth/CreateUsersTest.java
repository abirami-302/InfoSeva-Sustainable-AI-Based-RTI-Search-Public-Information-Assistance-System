package com.auth;

import com.auth.entity.AppUser;
import com.auth.entity.Role;
import com.auth.entity.AuthenticationProvider;
import com.auth.repository.AppUserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest
public class CreateUsersTest {

    @Autowired
    private AppUserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Helper: create or update a user. Skips insert if email already exists.
    private void seed(String name, String email, String encodedPassword, Role role) {
        AppUser user;
        if (userRepository.findByEmailIgnoreCase(email).isEmpty()) {
            user = new AppUser();
            user.setAuthProvider(AuthenticationProvider.LOCAL);
        } else {
            user = userRepository.findByEmailIgnoreCase(email).get();
            System.out.println("EXISTS (password synced): " + email);
        }
        user.setName(name);
        user.setEmail(email);
        user.setPassword(encodedPassword);
        user.setRole(role);
        user.setEmailVerified(true);
        user.setPhoneVerified(true);
        userRepository.save(user);
        System.out.println("SEEDED [" + role.name() + "]: " + email);
    }

    @Test
    public void createUsers() {
        String pw = passwordEncoder.encode("admin123");

        // ── Admins ──────────────────────────────────────────────────────────
        seed("Abirami Kondaiyan",      "abiramikondaiyan@gmail.com",   pw, Role.ROLE_ADMIN);
        seed("Priya Raghunathan",      "admin@infoseva.gov.in",       pw, Role.ROLE_ADMIN);
        seed("Suresh Krishnamurthy",   "admin2@infoseva.gov.in",      pw, Role.ROLE_ADMIN);

        // ── Data Managers ───────────────────────────────────────────────────
        seed("Madhumitha P S",         "madhumithaps2009@gmail.com",   pw, Role.ROLE_DATA_MANAGER);
        seed("Madhumitha P S",         "datamanager@infoseva.gov.in",  pw, Role.ROLE_DATA_MANAGER);
        seed("Meena Kumari",           "datamanager2@infoseva.gov.in", pw, Role.ROLE_DATA_MANAGER);
        seed("Arjun Venkataraman",     "dm.arjun@infoseva.gov.in",     pw, Role.ROLE_DATA_MANAGER);
        seed("Divya Natarajan",        "dm.divya@infoseva.gov.in",     pw, Role.ROLE_DATA_MANAGER);
        seed("Karthikeyan Pillai",     "dm.karthik@infoseva.gov.in",   pw, Role.ROLE_DATA_MANAGER);

        // ── Citizens ───────────────────────────────────────────────────────
        seed("Citizen User",           "citizen@infoseva.gov.in",      pw, Role.ROLE_CITIZEN);
        seed("Anitha Selvam",          "anitha.selvam@gmail.com",      pw, Role.ROLE_CITIZEN);
        seed("Ramesh Babu",            "ramesh.babu@gmail.com",        pw, Role.ROLE_CITIZEN);
        seed("Lakshmi Devi",           "lakshmi.devi@gmail.com",       pw, Role.ROLE_CITIZEN);
        seed("Mohammed Farhan",        "farhan.m@gmail.com",           pw, Role.ROLE_CITIZEN);
        seed("Sunita Sharma",          "sunita.sharma@gmail.com",      pw, Role.ROLE_CITIZEN);
        seed("Vijay Kumar",            "vijay.kumar@gmail.com",        pw, Role.ROLE_CITIZEN);
        seed("Pooja Iyer",             "pooja.iyer@gmail.com",         pw, Role.ROLE_CITIZEN);
        seed("Nitin Agarwal",          "nitin.agarwal@gmail.com",      pw, Role.ROLE_CITIZEN);
        seed("Deepa Menon",            "deepa.menon@gmail.com",        pw, Role.ROLE_CITIZEN);
    }
}

