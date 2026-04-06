package com.inventory.identity.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when subscription service registration fails
 * This is a critical error that should rollback the entire registration
 */
@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class SubscriptionRegistrationException extends RuntimeException {
    
    private final Long orgId;
    
    public SubscriptionRegistrationException(String message, Long orgId) {
        super(message);
        this.orgId = orgId;
    }
    
    public SubscriptionRegistrationException(String message, Long orgId, Throwable cause) {
        super(message, cause);
        this.orgId = orgId;
    }
    
    public Long getOrgId() {
        return orgId;
    }
}
