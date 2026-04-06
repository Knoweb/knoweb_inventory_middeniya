package com.inventory.identity.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;

/**
 * Configuration for Identity Database (identity_db)
 * 
 * Manages User entity and authentication data
 */
@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
    basePackages = "com.inventory.identity.repository",
    excludeFilters = @org.springframework.context.annotation.ComponentScan.Filter(
        type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE, 
        value = com.inventory.identity.repository.CompanyTenantRepository.class
    ),
    entityManagerFactoryRef = "identityEntityManagerFactory",
    transactionManagerRef = "identityTransactionManager"
)
public class IdentityDbConfig {
    
    /**
     * Identity Database DataSource
     * Primary datasource for authentication
     */
    @Primary
    @Bean(name = "identityDataSource")
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSource identityDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    /**
     * Entity Manager Factory for identity_db
     */
    @Primary
    @Bean(name = "identityEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean identityEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("identityDataSource") DataSource dataSource) {
        
        java.util.Map<String, Object> properties = new java.util.HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "update");
        properties.put("hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
        properties.put("hibernate.show_sql", true);
        properties.put("hibernate.format_sql", true);
        
        return builder
                .dataSource(dataSource)
                .packages("com.inventory.identity.model")
                // Exclude CompanyTenant entity (handled by subscription DB)
                .persistenceUnit("identity")
                .properties(properties)
                .build();
    }
    
    /**
     * Transaction Manager for identity_db operations
     */
    @Primary
    @Bean(name = "identityTransactionManager")
    public PlatformTransactionManager identityTransactionManager(
            @Qualifier("identityEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}
