package com.inventory.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionAccessResponse {
    private Long orgId;
    private boolean isBlocked;
    private List<String> allowedSystems;
}
