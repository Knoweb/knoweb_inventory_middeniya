package com.inventory.warehouse.service;

import com.inventory.warehouse.dto.BranchDto;
import com.inventory.warehouse.dto.WarehouseResponseDto;
import com.inventory.warehouse.model.Warehouse;
import com.inventory.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final RestTemplate restTemplate;
    private final JdbcTemplate jdbcTemplate;

    @Value("${user.service.url:http://localhost:8086}")
    private String userServiceUrl;

    // ── Create ────────────────────────────────────────────────────────────────

    /**
     * Save a warehouse. If branchId is null, 0, maps to "main" (no branch).
     */
    public WarehouseResponseDto createWarehouse(Warehouse warehouse) {
        // Treat 0 or negative values as "no branch"
        if (warehouse.getBranchId() != null && warehouse.getBranchId() <= 0) {
            warehouse.setBranchId(null);
        }
        if (warehouse.getStatus() == null) {
            warehouse.setStatus(Warehouse.WarehouseStatus.ACTIVE);
        }
        if (warehouse.getIsActive() == null) {
            warehouse.setIsActive(true);
        }

        Warehouse saved = warehouseRepository.save(warehouse);
        return toDto(saved, buildBranchMap(
                saved.getBranchId() != null ? List.of(saved.getBranchId()) : List.of()));
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public List<WarehouseResponseDto> getAllWarehouses() {
        List<Warehouse> warehouses = warehouseRepository.findAll();
        return toDtoList(warehouses);
    }

    public List<WarehouseResponseDto> getWarehousesByOrg(Long orgId) {
        List<Warehouse> warehouses = warehouseRepository.findByOrgId(orgId);
        return toDtoList(warehouses);
    }

    public Optional<WarehouseResponseDto> getWarehouseById(Long id) {
        return warehouseRepository.findById(id).map(w -> toDto(w, buildBranchMap(
                w.getBranchId() != null ? List.of(w.getBranchId()) : List.of())));
    }

    public List<WarehouseResponseDto> getWarehousesByBranch(Long branchId) {
        return toDtoList(warehouseRepository.findByBranchId(branchId));
    }

    /**
     * Proxy: fetch branches for a given org from user-service.
     * Used by the frontend to populate the branch dropdown on warehouse creation.
     */
    public List<BranchDto> getBranchesByOrgId(Long orgId) {
        try {
            String url = userServiceUrl + "/api/branches/organization/" + orgId;
            ResponseEntity<List<BranchDto>> resp = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<BranchDto>>() {
                    });
            return resp.getBody() != null ? resp.getBody() : Collections.emptyList();
        } catch (Exception ex) {
            log.warn("Could not fetch branches from user-service for orgId={}: {}", orgId, ex.getMessage());
            return Collections.emptyList();
        }
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public Optional<WarehouseResponseDto> updateWarehouse(Long id, Warehouse incoming) {
        return warehouseRepository.findById(id).map(existing -> {
            existing.setName(incoming.getName());
            existing.setLocation(incoming.getLocation());
            // Treat 0 as null
            Long bid = incoming.getBranchId();
            existing.setBranchId((bid != null && bid > 0) ? bid : null);
            existing.setWarehouseType(incoming.getWarehouseType());
            existing.setStorageCapacity(incoming.getStorageCapacity());
            existing.setAttributes(incoming.getAttributes());
            if (incoming.getStatus() != null)
                existing.setStatus(incoming.getStatus());
            if (incoming.getIsActive() != null)
                existing.setIsActive(incoming.getIsActive());
            Warehouse saved = warehouseRepository.save(existing);
            return toDto(saved, buildBranchMap(
                    saved.getBranchId() != null ? List.of(saved.getBranchId()) : List.of()));
        });
    }

    /** Soft-delete */
    public boolean deactivateWarehouse(Long id) {
        return warehouseRepository.findById(id).map(w -> {
            w.setIsActive(false);
            w.setStatus(Warehouse.WarehouseStatus.INACTIVE);
            warehouseRepository.save(w);
            return true;
        }).orElse(false);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private List<WarehouseResponseDto> toDtoList(List<Warehouse> warehouses) {
        // Collect all distinct branchIds in one batch
        List<Long> branchIds = warehouses.stream()
                .map(Warehouse::getBranchId)
                .filter(b -> b != null && b > 0)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, String> branchMap = buildBranchMap(branchIds);

        return warehouses.stream()
                .map(w -> toDto(w, branchMap))
                .collect(Collectors.toList());
    }

    /**
     * Fetch branch names from user-service for the given list of branchIds.
     * Returns a map of branchId → locationName.
     */
    private Map<Long, String> buildBranchMap(List<Long> branchIds) {
        if (branchIds.isEmpty())
            return Collections.emptyMap();

        return branchIds.stream()
                .distinct()
                .collect(Collectors.toMap(
                        bid -> bid,
                        bid -> {
                            try {
                                String url = userServiceUrl + "/api/branches/" + bid;
                                BranchDto b = restTemplate.getForObject(url, BranchDto.class);
                                return (b != null && b.getLocationName() != null)
                                        ? b.getLocationName()
                                        : "Branch #" + bid;
                            } catch (Exception ex) {
                                log.warn("Branch lookup failed for id={}: {}", bid, ex.getMessage());
                                return "Branch #" + bid;
                            }
                        }));
    }

    /**
     * Count how many distinct stock records exist for this warehouse.
     * Queries inventory_db.stocks directly via JDBC — adjust the DB/schema if
     * needed.
     */
    private Integer countCurrentUsage(Long warehouseId) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM inventory_db.stocks WHERE warehouse_id = ?",
                    Integer.class,
                    warehouseId);
            return count != null ? count : 0;
        } catch (Exception ex) {
            log.debug("currentUsage query failed for warehouseId={}: {}", warehouseId, ex.getMessage());
            return 0;
        }
    }

    private WarehouseResponseDto toDto(Warehouse w, Map<Long, String> branchMap) {
        String branchName = (w.getBranchId() != null && w.getBranchId() > 0)
                ? branchMap.getOrDefault(w.getBranchId(), "Branch #" + w.getBranchId())
                : "Main (No Branch)";

        Integer usage = countCurrentUsage(w.getId());

        return WarehouseResponseDto.builder()
                .id(w.getId())
                .name(w.getName())
                .location(w.getLocation())
                .orgId(w.getOrgId())
                .branchId(w.getBranchId())
                .branchName(branchName)
                .warehouseType(w.getWarehouseType())
                .storageCapacity(w.getStorageCapacity())
                .currentUsage(usage)
                .attributes(w.getAttributes())
                .status(w.getStatus())
                .isActive(w.getIsActive())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }
}
