package com.auth.service;

import com.auth.entity.AppUser;
import com.auth.entity.RefreshToken;

public interface RefreshTokenService {

    RefreshToken createRefreshToken(AppUser user);

    RefreshToken rotateRefreshToken(String requestToken);

    void revokeRefreshToken(String requestToken);

    RefreshToken verifyAndGetToken(String requestToken);

    void purgeExpiredAndRevokedTokens();
}
