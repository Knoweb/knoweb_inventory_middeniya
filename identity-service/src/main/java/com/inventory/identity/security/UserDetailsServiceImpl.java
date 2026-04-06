package com.inventory.identity.security;

import com.inventory.identity.model.User;
import com.inventory.identity.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserDetailsServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Find by email with roles explicitly fetched
        User user = userRepository.findByEmailWithRoles(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));

        logger.info("🔍 Loading user: {} | Roles in DB: {} (count: {})",
                user.getEmail(),
                user.getRoles() != null ? user.getRoles().stream().map(r -> r.getName().name()).toList() : "null",
                user.getRoles() != null ? user.getRoles().size() : 0);

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            logger.warn(
                    "⚠️ USER HAS NO ROLES! Email: {} | User ID: {} | Bypassing strict check and injecting ROLE_COMPANY",
                    user.getEmail(), user.getId());
        }

        return UserDetailsImpl.build(user);
    }

    @Transactional
    public UserDetails loadUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));

        logger.info("🔍 Loading user by ID: {} | Email: {} | Roles: {}",
                id, user.getEmail(),
                user.getRoles() != null ? user.getRoles().stream().map(r -> r.getName().name()).toList() : "null");

        return UserDetailsImpl.build(user);
    }
}
