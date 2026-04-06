package com.inventory.identity.repository;

import com.inventory.identity.model.RefreshToken;
import com.inventory.identity.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
    void deleteByExpiryDateBefore(LocalDateTime date);
    Optional<RefreshToken> findByUserAndIsRevoked(User user, Boolean isRevoked);
}
