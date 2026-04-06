package com.inventory.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class JwtResponse {

    private String token;
    private String refreshToken;
    private String type = "Bearer";
    private Long userId;
    private String username;
    private String email;
    private Long orgId;
    private String tenantId;
    private String orgName;
    private Long branchId;
    private String industryType;
    private String companyLogo;
    private List<String> roles;

    public JwtResponse(String token, String refreshToken, Long userId, String username,
            String email, Long orgId, String tenantId, String orgName, Long branchId, String industryType,
            String companyLogo, List<String> roles) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.orgId = orgId;
        this.tenantId = tenantId;
        this.orgName = orgName;
        this.branchId = branchId;
        this.industryType = industryType;
        this.companyLogo = companyLogo;
        this.roles = roles;
    }
}
