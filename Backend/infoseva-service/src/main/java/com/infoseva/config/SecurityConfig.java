package com.infoseva.config;

import com.infoseva.security.JwtAuthFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.access.AccessDeniedHandler;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import java.time.LocalDateTime;
import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, ObjectMapper objectMapper) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.objectMapper = objectMapper;
    }

    /**
     * Returns 401 JSON when a request reaches a protected endpoint
     * without a valid JWT (no redirect, no HTML page).
     */
    @Bean
    public AuthenticationEntryPoint jwtAuthEntryPoint() {
        return (request, response, ex) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            Map<String, Object> body = Map.of(
                    "success", false,
                    "message", "Authentication required. Please provide a valid Bearer token.",
                    "timestamp", LocalDateTime.now().toString()
            );
            objectMapper.writeValue(response.getOutputStream(), body);
        };
    }

    /**
     * Returns 403 JSON when a JWT is valid but the role is insufficient.
     */
    @Bean
    public AccessDeniedHandler jwtAccessDeniedHandler() {
        return (request, response, ex) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            Map<String, Object> body = Map.of(
                    "success", false,
                    "message", "Access denied. You do not have the required authority for this resource.",
                    "timestamp", LocalDateTime.now().toString()
            );
            objectMapper.writeValue(response.getOutputStream(), body);
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .cors(org.springframework.security.config.Customizer.withDefaults())
            .headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()))
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))


            // Wire the custom 401/403 handlers
            .exceptionHandling(ex -> ex
                    .authenticationEntryPoint(jwtAuthEntryPoint())
                    .accessDeniedHandler(jwtAccessDeniedHandler()))

            .authorizeHttpRequests(auth -> auth

                // ── Swagger / OpenAPI ──────────────────────────────────────────────
                .requestMatchers(
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/v3/api-docs/**"
                ).permitAll()

                // ── Actuator health ────────────────────────────────────────────────
                .requestMatchers("/actuator/health").permitAll()

                // ── PUBLIC: read-only citizen-facing content (GET only) ────────────
                .requestMatchers(org.springframework.http.HttpMethod.GET,
                        "/api/faqs/published",
                        "/api/faqs/feed",
                        "/api/faqs/{id}",
                        "/api/faqs/category/{category}",
                        "/api/faqs/department/{departmentId}",
                        "/api/notices/published",
                        "/api/notices/type/{type}",
                        "/api/notices/{id}",
                        "/api/schemes/**",
                        "/api/departments/**",
                        "/api/documents/**",
                        "/api/search/**",
                        "/api/recommendations/**"
                ).permitAll()

                // ── PUBLIC: citizen write actions (no account required) ────────────
                .requestMatchers(org.springframework.http.HttpMethod.POST,
                        "/api/contact",
                        "/api/feedback",
                        "/api/documents/*/view"
                ).permitAll()

                // ── CITIZEN: get own records 
                .requestMatchers(org.springframework.http.HttpMethod.GET,
                        "/api/complaints/my",
                        "/api/rti/my",
                        "/api/dashboard/citizen"
                ).hasAnyAuthority("ROLE_CITIZEN", "ROLE_USER", "ROLE_ADMIN", "ROLE_DATA_MANAGER")

                // ── CITIZEN: file an RTI or Complaint (JWT required) ──────────────
                .requestMatchers(org.springframework.http.HttpMethod.POST,
                        "/api/rti",
                        "/api/complaints"
                ).hasAnyAuthority("ROLE_CITIZEN", "ROLE_ADMIN", "ROLE_DATA_MANAGER")


                // ── ADMIN / DATA_MANAGER: mutations on content tables ─────────────
                .requestMatchers(org.springframework.http.HttpMethod.POST,
                        "/api/faqs", "/api/faqs/**",
                        "/api/notices", "/api/notices/**",
                        "/api/schemes", "/api/schemes/**",
                        "/api/departments", "/api/departments/**",
                        "/api/contact", "/api/contact/**",
                        "/api/feedback", "/api/feedback/**"
                ).hasAnyAuthority("ROLE_ADMIN", "ROLE_DATA_MANAGER")

                // ── DATA_MANAGER ONLY: document management ─────────────
                .requestMatchers(org.springframework.http.HttpMethod.POST,
                        "/api/documents/upload"
                ).hasAuthority("ROLE_DATA_MANAGER")
                .requestMatchers(org.springframework.http.HttpMethod.PUT,
                        "/api/documents/**"
                ).hasAuthority("ROLE_DATA_MANAGER")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE,
                        "/api/documents/**"
                ).hasAuthority("ROLE_DATA_MANAGER")

                .requestMatchers(org.springframework.http.HttpMethod.PUT,
                        "/api/faqs/**",
                        "/api/notices/**",
                        "/api/schemes/**",
                        "/api/departments/**",
                        "/api/contact/**",
                        "/api/feedback/**",
                        "/api/rti/**",
                        "/api/complaints/**"
                ).hasAnyAuthority("ROLE_ADMIN", "ROLE_DATA_MANAGER")
                
                // 🔴 ADMIN ONLY: destructive operations 
                .requestMatchers(org.springframework.http.HttpMethod.DELETE,
                        "/api/faqs/**",
                        "/api/notices/**",
                        "/api/schemes/**",
                        "/api/departments/**",
                        "/api/contact/**",
                        "/api/feedback/**",
                        "/api/rti/**",
                        "/api/complaints/**"
                ).hasAnyAuthority("ROLE_ADMIN", "ROLE_DATA_MANAGER")

                // ── ADMIN / DATA_MANAGER: lists and views that contain PII ─────────
                .requestMatchers(org.springframework.http.HttpMethod.GET,
                        "/api/faqs",
                        "/api/notices",
                        "/api/complaints",
                        "/api/rti",
                        "/api/rti/search",
                        "/api/rti/status/{status}",
                        "/api/rti/department/{deptId}",
                        "/api/contact",
                        "/api/contact/feed",
                        "/api/contact/{id}",
                        "/api/contact/status/{status}",
                        "/api/feedback",
                        "/api/feedback/feed",
                        "/api/feedback/{id}",
                        "/api/feedback/status/{status}"
                ).hasAnyAuthority("ROLE_ADMIN", "ROLE_DATA_MANAGER")

                // ── CITIZEN / ALL AUTHENTICATED: Notifications ─────────
                .requestMatchers("/api/notifications/**").hasAnyAuthority("ROLE_CITIZEN", "ROLE_USER", "ROLE_ADMIN", "ROLE_DATA_MANAGER")

                // ── ADMIN / DATA_MANAGER: dashboard summary & admin reads ─────────
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/dashboard/summary").permitAll()
                .requestMatchers("/api/dashboard/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_DATA_MANAGER", "ROLE_CITIZEN", "ROLE_USER")

                // ── Catch-all: any remaining unlisted request requires auth ────────
                .anyRequest().authenticated()
            );

        // SecurityEvaluator and PreAuthorize require method security to be enabled.
        // It's usually placed on a config class, but we need it. Let's make sure it's enabled.


        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        configuration.setAllowedOrigins(java.util.List.of("http://localhost:3000"));
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.List.of("*"));
        configuration.setAllowCredentials(true);
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}