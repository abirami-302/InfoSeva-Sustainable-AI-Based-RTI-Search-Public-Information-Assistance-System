package com.auth.controller;

import com.auth.dto.LoginRequest;
import com.auth.dto.RegisterRequest;
import com.auth.dto.request.*;
import com.auth.dto.response.ApiResponse;
import com.auth.dto.response.AuthResponseData;
import com.auth.dto.response.UserDto;
import com.auth.entity.AppUser;
import com.auth.entity.RefreshToken;
import com.auth.security.JwtUtil;
import com.auth.service.AuthService;
import com.auth.service.GoogleTokenVerifierService;
import com.auth.service.OTPService;
import com.auth.service.RefreshTokenService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication & OAuth2", description = "Endpoints for local login, Google OAuth2 login, user registration, OTP verification, password recovery, refresh tokens, and logout")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final OTPService otpService;
    private final JwtUtil jwtUtil;
    private final GoogleTokenVerifierService googleTokenVerifierService;

    @Value("${jwt.access-token-expiration:3600000}")
    private long jwtExpirationMs;

    public AuthController(AuthService authService,
                          RefreshTokenService refreshTokenService,
                          OTPService otpService,
                          JwtUtil jwtUtil,
                          GoogleTokenVerifierService googleTokenVerifierService) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
        this.otpService = otpService;
        this.jwtUtil = jwtUtil;
        this.googleTokenVerifierService = googleTokenVerifierService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new Citizen user", description = "Self-registers a new citizen user in the InfoSeva system. Creates 1:1 profile aggregate automatically.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "User registered successfully",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error / Invalid payload",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email address already registered",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest request) {
        UserDto userDto = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully.", userDto));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate User and Issue Tokens", description = "Authenticates user credentials and returns an Access Token (JWT) along with a Refresh Token.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
    public ResponseEntity<ApiResponse<AuthResponseData>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponseData authData = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful.", authData));
    }

    @PostMapping("/google")
    @Operation(summary = "Authenticate or Register via Google OAuth2", description = "Authenticates a user via verified Google ID Token, automatically linking local accounts or creating new user aggregates.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Google authentication successful",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid Google ID Token",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
    public ResponseEntity<ApiResponse<AuthResponseData>> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        // Live Google ID Token signature verification via Google Public Keys
        GoogleIdToken.Payload payload = googleTokenVerifierService.verifyToken(request.getIdToken());
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String googleSubject = payload.getSubject();

        AuthResponseData authData = authService.loginWithGoogle(email, googleSubject, name);
        return ResponseEntity.ok(ApiResponse.success("Google authentication successful.", authData));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate Refresh Token & Get New Access Token", description = "Validates an active refresh token, revokes it, and issues a new Access Token + Refresh Token pair.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token refreshed successfully",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Expired, revoked, or invalid refresh token",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
    public ResponseEntity<ApiResponse<AuthResponseData>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(request.getRefreshToken());
        AppUser user = newRefreshToken.getUser();

        String newAccessToken = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        
        String status = (user.getProfile() != null && user.getProfile().getStatus() != null) ? user.getProfile().getStatus().name() : "ACTIVE";
        boolean completed = (user.getProfile() != null && user.getProfile().getProfileCompleted() != null) ? user.getProfile().getProfileCompleted() : false;

        UserDto userDto = new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole().name(),
                status, completed, user.getAuthProvider().name());

        long expiresInSeconds = jwtExpirationMs / 1000;

        AuthResponseData authData = new AuthResponseData(newAccessToken, newRefreshToken.getToken(), "Bearer", expiresInSeconds, userDto);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully.", authData));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout & Revoke Active Refresh Token", description = "Soft-revokes the active refresh token associated with the user session.")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logout successful",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid or missing refresh token",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.success("Logout successful. Refresh token has been revoked."));
    }

    @PostMapping("/send-otp")
    @Operation(summary = "Send Email or Phone OTP", description = "Generates and dispatches a 6-digit OTP code for Email/Phone verification or password recovery.")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        otpService.sendOTP(request);
        return ResponseEntity.ok(ApiResponse.success("OTP code sent successfully to " + request.getTarget()));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify Email or Phone OTP", description = "Validates the 6-digit OTP code submitted by the user.")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        otpService.verifyOTP(request);
        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully."));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Initiate Password Recovery", description = "Sends a password reset OTP code to the user's registered email or phone.")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        otpService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password recovery OTP sent to registered contact."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset Password with OTP", description = "Resets user password upon successful verification of the recovery OTP code.")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        otpService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password has been reset successfully. You can now login with your new password."));
    }

    @GetMapping("/test-users")
    @Operation(summary = "Get Test Users for Developer Auto-Fill", description = "Returns active developer test accounts with their current database names and profile photos.")
    public ResponseEntity<ApiResponse<java.util.List<com.auth.dto.response.TestUserDto>>> getTestUsers() {
        return ResponseEntity.ok(ApiResponse.success("Test users retrieved successfully.", authService.getTestUsers()));
    }
}
