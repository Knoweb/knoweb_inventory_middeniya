package com.inventory.identity.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.persistence.EntityManagerFactory;
import javax.sql.DataSource;

/**
 * Configuration for Subscription Database (subscription_db)
 * 
 * Manages CompanyTenant entity and subscription data
 */
@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
    basePackages = "com.inventory.identity.repository",
    includeFilters = @org.springframework.context.annotation.ComponentScan.Filter(
        type = org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE,
        value = com.inventory.identity.repository.CompanyTenantRepository.class
    ),
    entityManagerFactoryRef = "subscriptionEntityManagerFactory",
    transactionManagerRef = "subscriptionTransactionManager"
)
public class SubscriptionDbConfig {
    
    /**
     * Subscription Database DataSource
     */
    @Bean(name = "subscriptionDataSource")
    @ConfigurationProperties(prefix = "subscription.datasource")
    public DataSource subscriptionDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    /**
     * Entity Manager Factory for subscription_db
     */
    @Bean(name = "subscriptionEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean subscriptionEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("subscriptionDataSource") DataSource dataSource) {
        
        java.util.Map<String, Object> properties = new java.util.HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "update");
        properties.put("hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
        properties.put("hibernate.show_sql", true);
        properties.put("hibernate.format_sql", true);
        
        return builder
                .dataSource(dataSource)
                .packages("com.inventory.identity.model")
                // Only include CompanyTenant entity
                .persistenceUnit("subscription")
                .properties(properties)
                .build();
    }
    
    /**
     * Transaction Manager for subscription_db operations
     */
    @Bean(name = "subscriptionTransactionManager")
    public PlatformTransactionManager subscriptionTransactionManager(
            @Qualifier("subscriptionEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}
