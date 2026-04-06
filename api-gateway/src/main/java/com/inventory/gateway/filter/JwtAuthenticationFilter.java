package com.inventory.gateway.filter;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.security.Key;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${gateway.public-endpoints:/api/auth/**,/api/public/**}")
    private String publicEndpoints;
    
    public JwtAuthenticationFilter() {
        super(Config.class);
    }
    
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();
            
            // Skip authentication for OPTIONS requests (CORS preflight)
            if (request.getMethod().name().equals("OPTIONS")) {
                return chain.filter(exchange);
            }
            
            // Skip authentication for public endpoints
            if (isPublicEndpoint(path)) {
                return chain.filter(exchange);
            }
            
            // Check if Authorization header exists
            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                return this.onError(exchange, "Missing authorization header", HttpStatus.UNAUTHORIZED);
            }
            
            String authHeader = request.getHeaders().get(HttpHeaders.AUTHORIZATION).get(0);
            if (!authHeader.startsWith("Bearer ")) {
                return this.onError(exchange, "Invalid authorization header", HttpStatus.UNAUTHORIZED);
            }
            
            String token = authHeader.substring(7);
            
            try {
                if (!validateToken(token)) {
                    return this.onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
                }
                
                // Extract user info from token and add to request headers
                Claims claims = getClaimsFromToken(token);
                
                // ===== SUBSCRIPTION ACCESS CONTROL =====
                // Check allowedSystems and enforce access to specific system endpoints
                @SuppressWarnings("unchecked")
                List<String> allowedSystems = claims.get("allowedSystems", List.class);
                
                // Check if user has access to the requested system
                if (!isSystemAccessAllowed(path, allowedSystems)) {
                    return this.onError(exchange, "Access denied: Subscription does not include this system", HttpStatus.FORBIDDEN);
                }
                
                ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                        .header("X-User-Id", claims.get("userId").toString())
                        .header("X-Username", claims.getSubject())
                        .header("X-Email", claims.get("email", String.class))
                        .header("X-Org-Id", claims.get("orgId") != null ? claims.get("orgId").toString() : "")
                        .header("X-Branch-Id", claims.get("branchId") != null ? claims.get("branchId").toString() : "")
                        .build();
                
                return chain.filter(exchange.mutate().request(modifiedRequest).build());
                
            } catch (Exception e) {
                logger.error("JWT validation error: ", e);
                return this.onError(exchange, "Authentication failed: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
            }
        };
    }
    
    private boolean isPublicEndpoint(String path) {
        List<String> publicPaths = Arrays.asList(publicEndpoints.split(","));
        return publicPaths.stream().anyMatch(pattern -> {
            String regex = pattern.replace("**", ".*").replace("*", "[^/]*");
            return path.matches(regex);
        });
    }
    
    /**
     * Check if the user has access to the requested system based on allowedSystems in JWT
     * @param path Request URI path
     * @param allowedSystems List of allowed systems from JWT claim
     * @return true if access is allowed, false otherwise
     */
    private boolean isSystemAccessAllowed(String path, List<String> allowedSystems) {
        // If no allowedSystems claim exists (legacy tokens or super admin), allow access
        if (allowedSystems == null) {
            logger.warn("No allowedSystems claim found in token - allowing access for backwards compatibility");
            return true;
        }
        
        // Check if request is for Ginuma system (/api/companies/**)
        if (path.startsWith("/api/companies/") || path.equals("/api/companies")) {
            if (!allowedSystems.contains("GINUMA")) {
                logger.warn("Access denied: User does not have GINUMA subscription for path: {}", path);
                return false;
            }
        }
        
        // Check if request is for Inventory system (/api/inventory/**)
        if (path.startsWith("/api/inventory/") || path.equals("/api/inventory")) {
            if (!allowedSystems.contains("INVENTORY")) {
                logger.warn("Access denied: User does not have INVENTORY subscription for path: {}", path);
                return false;
            }
        }
        
        // Add more system checks here as needed:
        // - /api/product/** -> requires INVENTORY
        // - /api/warehouse/** -> requires INVENTORY
        // - /api/orders/** -> requires INVENTORY
        // etc.
        
        // Check for specific inventory-related endpoints
        if (path.startsWith("/api/product/") || path.startsWith("/api/warehouse/") || 
            path.startsWith("/api/order/") || path.startsWith("/api/supplier/")) {
            if (!allowedSystems.contains("INVENTORY")) {
                logger.warn("Access denied: User does not have INVENTORY subscription for path: {}", path);
                return false;
            }
        }
        
        // Default: allow access if no specific system restriction applies
        return true;
    }
    
    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    
    private boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (SecurityException ex) {
            logger.error("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            logger.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            logger.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            logger.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            logger.error("JWT claims string is empty");
        }
        return false;
    }
    
    private Claims getClaimsFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    
    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add("Content-Type", "application/json");
        
        String errorResponse = String.format("{\"error\": \"%s\", \"message\": \"%s\"}", 
                status.getReasonPhrase(), message);
        
        return response.writeWith(Mono.just(response.bufferFactory().wrap(errorResponse.getBytes())));
    }
    
    public static class Config {
        // Configuration properties if needed
    }
}
