package com.inventory.identity.security;

import com.inventory.identity.model.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

import java.util.stream.Collectors;

@Data
@AllArgsConstructor
public class UserDetailsImpl implements UserDetails {

    private Long id;
    private String username;
    private String email;

    @JsonIgnore
    private String password;

    private Long orgId;
    private Long branchId;
    private Boolean isActive;

    private Collection<? extends GrantedAuthority> authorities;

    public static UserDetailsImpl build(User user) {
        java.util.List<GrantedAuthority> authorities = new java.util.ArrayList<>();

        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            authorities.addAll(user.getRoles().stream()
                    .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                    .collect(Collectors.toList()));

            // Also add permission-based authorities
            user.getRoles().forEach(role -> {
                if (role.getPermissions() != null) {
                    role.getPermissions().forEach(permission -> {
                        authorities.add(new SimpleGrantedAuthority(permission.getName()));
                    });
                }
            });
        }

        // AUTOMATIC BYPASS: If no roles found, default to ROLE_COMPANY
        if (authorities.isEmpty()) {
            System.err.println("🚨 BYPASS TRIGGERED: User " + user.getEmail()
                    + " has no roles in DB. Automatically injecting ROLE_COMPANY.");
            authorities.add(new SimpleGrantedAuthority("ROLE_COMPANY"));
        }

        System.out.println("✅ Built UserDetailsImpl for " + user.getEmail() + " with authorities: " + authorities);

        return new UserDetailsImpl(
                user.getId(),
                user.getEmail(),
                user.getEmail(),
                user.getPassword(),
                user.getOrgId(),
                user.getBranchId(),
                user.getIsActive(),
                authorities);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return isActive;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive;
    }
}
