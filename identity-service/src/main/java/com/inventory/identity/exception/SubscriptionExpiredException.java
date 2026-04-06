package com.inventory.identity.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class SubscriptionExpiredException extends RuntimeException {
    public SubscriptionExpiredException(String message) {
        super(message);
    }
}
