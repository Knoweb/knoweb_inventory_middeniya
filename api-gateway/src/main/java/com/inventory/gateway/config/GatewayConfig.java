package com.inventory.gateway.config;

import com.inventory.gateway.filter.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

        @Autowired
        private JwtAuthenticationFilter jwtAuthenticationFilter;

        @Bean
        public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
                return builder.routes()
                                // 1. PUBLIC ROUTES

                                // Auth (Login, Register, Refresh)
                                .route("identity-auth-public", r -> r
                                                .path("/api/auth/**")
                                                .uri("lb://identity-service"))

                                // Logo Upload & Access
                                .route("user-logo-public", r -> r
                                                .path("/api/organizations/logo/**")
                                                .uri("lb://user-service"))

                                // Static File Access (Uploaded Logos)
                                .route("user-uploads-public", r -> r
                                                .path("/uploads/**")
                                                .uri("lb://user-service"))

                                // Organization Registration
                                .route("user-org-register", r -> r
                                                .path("/api/organizations", "/api/organizations/")
                                                .and().method("POST")
                                                .uri("lb://user-service"))

                                // Organization Data - GET requests to identity-service
                                .route("identity-organizations-get", r -> r
                                                .path("/api/organizations/**")
                                                .and().method("GET")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://identity-service"))

                                // Organization Data - PUT requests to identity-service
                                .route("identity-organizations-put", r -> r
                                                .path("/api/organizations/**")
                                                .and().method("PUT")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://identity-service"))

                                // 2. PROTECTED ROUTES

                                // Identity - Users
                                .route("identity-users-protected", r -> r
                                                .path("/api/users/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://identity-service"))

                                // Product Service (including categories, brands, pharmacy)
                                .route("product-service", r -> r
                                                .path("/api/products/**", "/api/products", "/api/categories/**",
                                                                "/api/categories", "/api/brands/**", "/api/brands",
                                                                "/api/pharmacy/**", "/api/pharmacy")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://product-service"))

                                // Inventory Service
                                .route("inventory-service", r -> r
                                                .path("/api/inventory/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://inventory-service"))

                                // Order Service
                                .route("order-service", r -> r
                                                .path("/api/orders/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://order-service"))

                                // Warehouse Service
                                .route("warehouse-service", r -> r
                                                .path("/api/warehouses/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://warehouse-service"))

                                // User Service - Protected (Branches only, organizations handled by
                                // identity-service)
                                .route("user-service", r -> r
                                                .path("/api/branches/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://user-service"))

                                // --- GINUMA SERVICE ROUTES (MOVED UP TO PREVENT CONFLICTS) ---

                                // Ginuma Service - Suppliers (Specific to Ginuma)
                                .route("ginuma-suppliers-company", r -> r
                                                .path("/api/suppliers/companies/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://ginuma-service"))

                                // Inventory Service - Suppliers (Specific to Inventory Organization)
                                .route("inventory-suppliers-org", r -> r
                                                .path("/api/suppliers/organization/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://supplier-service"))

                                // Ginuma Service - Employees
                                .route("ginuma-employees-company-specific", r -> r
                                                .path("/api/employees/companies/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://ginuma-service"))

                                // Ginuma Service - Company Management
                                .route("ginuma-companies", r -> r
                                                .path("/api/companies/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://ginuma-service"))

                                // Ginuma Service - Payroll & HR
                                .route("ginuma-payroll", r -> r
                                                .path("/api/payroll/**", "/api/employees/**", "/api/departments/**",
                                                                "/api/designations/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://ginuma-service"))

                                // Ginuma Service - Common Ginuma Modules (Curated to avoid standalone service
                                // conflicts)
                                .route("ginuma-common", r -> r
                                                .path("/api/currencies/**", "/api/countries/**",
                                                                "/api/customers/**",
                                                                "/api/sales-orders/**", "/api/purchase-orders/**",
                                                                "/api/projects/**", "/api/items/**",
                                                                "/api/aged-receivables/**", "/api/aged-payables/**",
                                                                "/api/ginuma/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://ginuma-service"))

                                // --- END GINUMA SERVICE ROUTES ---

                                // Standalone Inventory Supplier Service - Catch-all
                                .route("supplier-service", r -> r
                                                .path("/api/suppliers/**", "/api/suppliers")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://supplier-service"))

                                // Notification Service
                                .route("notification-service", r -> r
                                                .path("/api/notifications/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://notification-service"))

                                // Subscription Service
                                .route("subscription-service", r -> r
                                                .path("/api/subscriptions/**", "/api/superadmin/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://subscription-service"))

                                // Catalog & Reporting
                                .route("catalog-service", r -> r
                                                .path("/api/catalog/**", "/api/schemas/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://catalog-service"))

                                .route("reporting-service", r -> r
                                                .path("/api/reports/**", "/api/analytics/**", "/api/audit/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://reporting-service"))

                                // Ginuma Service - Numeric Company ID Catch-all (Fallback)
                                // This must be the very last route to avoid stealing requests from other
                                // specific services
                                .route("ginuma-company-id-catchall", r -> r
                                                .path("/api/{companyId}/**")
                                                .filters(f -> f.filter(jwtAuthenticationFilter
                                                                .apply(new JwtAuthenticationFilter.Config())))
                                                .uri("lb://ginuma-service"))

                                .build();
        }
}
