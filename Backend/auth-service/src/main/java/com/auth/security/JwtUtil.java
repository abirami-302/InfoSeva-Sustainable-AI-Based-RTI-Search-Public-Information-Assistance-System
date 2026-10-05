package com.auth.security;

import com.auth.config.JwtProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    private final JwtProperties jwtProperties;
    private SecretKey signingKey;

    public JwtUtil(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    private SecretKey key() {
        if (signingKey == null) {
            byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
            signingKey = Keys.hmacShaKeyFor(keyBytes);
        }
        return signingKey;
    }

    public String generateToken(String email, Long userId, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getAccessTokenExpiration());

        return Jwts.builder()
                .subject(email)
                .issuer(jwtProperties.getIssuer())
                .claim("userId", userId)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key())
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = parseClaims(token);
        return claimsResolver.apply(claims);
    }

    public boolean isTokenValid(String token, String expectedEmail) {
        try {
            if (token == null || token.isBlank()) {
                return false;
            }
            Claims claims = parseClaims(token);
            String email = claims.getSubject();
            String issuer = claims.getIssuer();
            Date expiration = claims.getExpiration();

            boolean emailMatches = email != null && email.equalsIgnoreCase(expectedEmail);
            boolean issuerMatches = jwtProperties.getIssuer() == null || jwtProperties.getIssuer().equals(issuer);
            boolean notExpired = expiration != null && expiration.after(new Date());

            return emailMatches && issuerMatches && notExpired;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims parseClaims(String token) throws ExpiredJwtException, UnsupportedJwtException, MalformedJwtException, SignatureException, IllegalArgumentException {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token string cannot be empty or null");
        }
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
