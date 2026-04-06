package com.inventory.inventoryservice.dto;

import lombok.Data;

@Data
public class WarehouseDto {
    private Long id;
    private String name;
    private String warehouseName;
    private String location;
    private String code;
    
    // Getter that works with both field names
    public String getWarehouseName() {
        return warehouseName != null ? warehouseName : name;
    }
}
