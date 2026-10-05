package com.auth.repository;

import com.auth.entity.AuthenticationProvider;
import com.auth.entity.OAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {

    Optional<OAuthAccount> findByProviderAndProviderUserId(AuthenticationProvider provider, String providerUserId);

    boolean existsByProviderAndProviderUserId(AuthenticationProvider provider, String providerUserId);

    List<OAuthAccount> findByUserId(Long userId);
}
