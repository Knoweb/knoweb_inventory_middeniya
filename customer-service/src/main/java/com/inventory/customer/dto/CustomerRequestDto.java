package com.inventory.customer.dto;

import lombok.Data;
import java.util.Map;

@Data
public class CustomerRequestDto {
    private String name;
    private Map<String, Object> contactInfo;
    private Long orgId;
}
