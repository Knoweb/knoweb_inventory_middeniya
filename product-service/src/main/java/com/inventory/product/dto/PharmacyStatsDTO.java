package com.inventory.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PharmacyStatsDTO {
    private long expiringSoon;
    private long expired;
    private long prescriptionOnly;
    private long refrigerated;
}
