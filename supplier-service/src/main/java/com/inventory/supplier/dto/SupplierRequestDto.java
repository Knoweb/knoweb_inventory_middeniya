package com.inventory.supplier.dto;

import lombok.Data;
import java.util.Map;

@Data
public class SupplierRequestDto {
    private String name;
    private Map<String, Object> contactInfo;
    private Long orgId;
}
