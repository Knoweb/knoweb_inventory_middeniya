package com.inventory.customer.dto;

import lombok.Data;
import java.util.Map;

@Data
public class CustomerRequestDto {
    private String customerName;
    private String vatNumber;
    private String phoneNumber;
    private String address;
    private Map<String, Object> contactInfo;
    private Long orgId;
}
