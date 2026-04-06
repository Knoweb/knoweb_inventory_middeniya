package com.inventory.identity.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * JWT Authentication Filter
 * 
 * This filter extracts JWT token from Authorization header and validates it.
 * If valid, it sets the authentication in Spring Security context.
 * If no token or invalid token, it simply continues the filter chain
 * (allowing Spring Security's permitAll() rules to handle public endpoints).
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    @Autowired
    private JwtTokenProvider tokenProvider;
    
    @Autowired
    private UserDetailsServiceImpl userDetailsService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);
            
            // Only authenticate if JWT token is present
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String username = tokenProvider.getUsernameFromToken(jwt);
                
                // ✅ CRITICAL FIX: Extract roles from JWT token, NOT from database
                // This ensures SSO tokens work even if user not in local DB
                List<String> rolesFromToken = tokenProvider.getRolesFromToken(jwt);
                
                logger.info("🔐 Identity-Service JWT Filter - User: {} | Roles from token: {}", username, rolesFromToken);
                
                // Convert roles to GrantedAuthority with proper ROLE_ prefix
                List<GrantedAuthority> authorities = rolesFromToken.stream()
                        .map(role -> {
                            // Add ROLE_ prefix if not already present (for Spring Security .hasRole())
                            String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                            return new SimpleGrantedAuthority(authority);
                        })
                        .collect(Collectors.toList());
                
                logger.info("✅ Granted Authorities: {} (count: {})", authorities, authorities.size());
                
                // Create lightweight UserDetails from token (no DB query needed)
                UserDetails userDetails = User.builder()
                        .username(username)
                        .password("") // No password needed for token-based auth
                        .authorities(authorities)
                        .build();
                
                UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.info("✅ Authentication set for user: {} with authorities: {}", username, authorities);
            }
        } catch (Exception ex) {
            // Log the error but don't block the request
            // Let Spring Security's permitAll() handle public endpoints
            logger.error("❌ Could not set user authentication in security context", ex);
        }
        
        // Always continue the filter chain
        filterChain.doFilter(request, response);
    }
    
    /**
     * Extract JWT token from Authorization header
     */
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
