package com.inventory.identity.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

/**
 * Configuration for HTTP clients used in service-to-service communication
 */
@Configuration
public class RestClientConfig {

    /**
     * RestTemplate bean for synchronous HTTP calls
     * Used for calling Ginuma and Inventory system endpoints
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(30))
                .requestFactory(this::clientHttpRequestFactory)
                .build();
    }

    /**
     * Configure request factory with timeouts
     */
    private ClientHttpRequestFactory clientHttpRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000); // 10 seconds
        factory.setReadTimeout(30000); // 30 seconds
        return factory;
    }

    /**
     * WebClient bean for reactive HTTP calls (alternative to RestTemplate)
     * More modern and supports non-blocking operations
     */
    @Bean
    public WebClient webClient(WebClient.Builder builder) {
        return builder
                .baseUrl("http://localhost") // Base URL, will be overridden per request
                .build();
    }

    /**
     * WebClient specifically for Ginuma ERP System
     */
    @Bean
    public WebClient ginumaWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl("http://ginuma-service:8081")
                .build();
    }

    /**
     * WebClient specifically for Inventory System
     */
    @Bean
    public WebClient inventoryWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl("http://user-service:8086")
                .build();
    }
}
