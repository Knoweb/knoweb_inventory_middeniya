package com.inventory.identity.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    
    @Autowired
    private UserDetailsServiceImpl userDetailsService;
    
    @Autowired
    private JwtAuthenticationEntryPoint unauthorizedHandler;
    
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.disable())  // API Gateway handles CORS
            .csrf(csrf -> csrf.disable())   // Disabled for stateless JWT auth
            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints - MUST be first
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()  // Add if using Spring Actuator
                .requestMatchers("/error").permitAll()  // Allow error endpoint
                
                // Organization endpoints - Authenticated users (JWT required)
                .requestMatchers(HttpMethod.GET, "/api/organizations/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/organizations/**").hasAnyRole("SUPER_ADMIN", "ORG_ADMIN")
                
                // Role-based endpoints
                .requestMatchers(HttpMethod.GET, "/api/roles").hasAnyRole("SUPER_ADMIN", "ORG_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/users").hasAnyRole("SUPER_ADMIN", "ORG_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/users/**").hasAnyRole("SUPER_ADMIN", "ORG_ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("SUPER_ADMIN")
                
                // All other requests require authentication
                .anyRequest().authenticated()
            );
        
        // Authentication provider and JWT filter
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
