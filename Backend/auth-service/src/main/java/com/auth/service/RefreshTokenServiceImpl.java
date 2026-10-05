package com.auth.service;

import com.auth.config.JwtProperties;
import com.auth.entity.AppUser;
import com.auth.entity.RefreshToken;
import com.auth.exception.TokenRefreshException;
import com.auth.repository.RefreshTokenRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;

    public RefreshTokenServiceImpl(RefreshTokenRepository refreshTokenRepository, JwtProperties jwtProperties) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtProperties = jwtProperties;
    }

    @Override
    @Transactional
    public RefreshToken createRefreshToken(AppUser user) {
        // Business rule: Enforce single active refresh token per user.
        // Purge any existing refresh tokens for the user before issuing a new one.
        refreshTokenRepository.deleteByUser(user);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(Instant.now().plusMillis(jwtProperties.getRefreshTokenExpiration()));
        refreshToken.setRevoked(false);

        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    @Transactional
    public RefreshToken rotateRefreshToken(String requestToken) {
        RefreshToken token = verifyAndGetToken(requestToken);

        // Mark old token revoked and issue a new one for the user
        token.setRevoked(true);
        refreshTokenRepository.save(token);

        return createRefreshToken(token.getUser());
    }

    @Override
    @Transactional
    public void revokeRefreshToken(String requestToken) {
        RefreshToken token = verifyAndGetToken(requestToken);
        token.setRevoked(true);
        refreshTokenRepository.save(token);
    }

    @Override
    @Transactional(readOnly = true)
    public RefreshToken verifyAndGetToken(String requestToken) {
        if (requestToken == null || requestToken.isBlank()) {
            throw new TokenRefreshException("Refresh token is required.");
        }

        try {
            UUID.fromString(requestToken.trim());
        } catch (IllegalArgumentException e) {
            throw new TokenRefreshException("Invalid refresh token format.");
        }

        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(requestToken.trim());
        if (tokenOpt.isEmpty()) {
            throw new TokenRefreshException("Refresh token not found.");
        }

        RefreshToken token = tokenOpt.get();

        if (token.isRevoked()) {
            throw new TokenRefreshException("Refresh token has been revoked.");
        }

        if (token.getExpiryDate().isBefore(Instant.now())) {
            throw new TokenRefreshException("Refresh token has expired. Please log in again.");
        }

        return token;
    }

    @Override
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void purgeExpiredAndRevokedTokens() {
        refreshTokenRepository.findAll().stream()
                .filter(t -> t.isRevoked() || t.getExpiryDate().isBefore(Instant.now()))
                .forEach(refreshTokenRepository::delete);
    }
}
