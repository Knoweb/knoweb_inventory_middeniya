package com.inventory.inventoryservice.service;

import com.inventory.inventoryservice.model.Stock;
import com.inventory.inventoryservice.model.InventoryTransaction;
import com.inventory.inventoryservice.repository.StockRepository;
import com.inventory.inventoryservice.repository.InventoryTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class InventoryService {

    private final StockRepository stockRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final StockLedgerService stockLedgerService;
    private final RestTemplate restTemplate;
    private final com.inventory.inventoryservice.event.StockEventPublisher stockEventPublisher;

    private static final String NOTIFICATION_SERVICE_URL = "http://notification-service/api/notifications/events/publish";
    private static final String PRODUCT_SERVICE_URL = "http://product-service/api/products/";
    private static final String WAREHOUSE_SERVICE_URL = "http://warehouse-service/api/warehouses/";

    public List<com.inventory.inventoryservice.dto.StockResponseDto> getAllStocksWithDetails() {
        return stockRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(java.util.stream.Collectors.toList());
    }

    public List<com.inventory.inventoryservice.dto.StockResponseDto> getStocksByOrgWithDetails(Long orgId) {
        return stockRepository.findByOrgId(orgId).stream()
                .map(this::mapToDto)
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Stock> getAllStocks() {
        return stockRepository.findAll();
    }

    public List<Stock> getStocksByOrg(Long orgId) {
        return stockRepository.findByOrgId(orgId);
    }

    // Restored Entity-returning methods
    public Optional<Stock> getStockById(Long id) {
        return stockRepository.findById(id);
    }

    public Optional<Stock> getStockByProductAndWarehouse(Long productId, Long warehouseId) {
        return stockRepository.findByProductIdAndWarehouseId(productId, warehouseId);
    }

    public List<Stock> getStocksByProduct(Long productId) {
        return stockRepository.findByProductId(productId);
    }

    // New DTO-returning methods
    public Optional<com.inventory.inventoryservice.dto.StockResponseDto> getStockByIdWithDetails(Long id) {
        return stockRepository.findById(id).map(this::mapToDto);
    }

    public List<com.inventory.inventoryservice.dto.StockResponseDto> getStocksByProductWithDetails(Long productId) {
        return stockRepository.findByProductId(productId).stream()
                .map(this::mapToDto)
                .collect(java.util.stream.Collectors.toList());
    }

    public Optional<com.inventory.inventoryservice.dto.StockResponseDto> getStockByProductAndWarehouseWithDetails(
            Long productId, Long warehouseId) {
        return stockRepository.findByProductIdAndWarehouseId(productId, warehouseId).map(this::mapToDto);
    }

    private com.inventory.inventoryservice.dto.StockResponseDto mapToDto(Stock stock) {
        com.inventory.inventoryservice.dto.StockResponseDto dto = new com.inventory.inventoryservice.dto.StockResponseDto();
        dto.setId(stock.getId());
        dto.setProductId(stock.getProductId());
        dto.setWarehouseId(stock.getWarehouseId());
        dto.setBranchId(stock.getBranchId());
        dto.setQuantity(stock.getQuantity());
        dto.setAvailableQuantity(stock.getAvailableQuantity());
        dto.setReservedQuantity(stock.getReservedQuantity());
        dto.setOrgId(stock.getOrgId());
        dto.setCreatedAt(stock.getCreatedAt());
        dto.setUpdatedAt(stock.getUpdatedAt());

        // Fetch reorder level from product service if not set in stock
        // Even if set in stock, user requested explicitly fetching from product, but
        // optimization suggests fallback.
        // User request: "explicitly fetch the reorder level from the associated
        // product: dto.setReorderLevel(stock.getProduct().getReorderLevel());"
        // I will fetch from Product Service.
        // Fetch details from Product Service
        try {
            com.inventory.inventoryservice.dto.ProductDto product = restTemplate.getForObject(
                    PRODUCT_SERVICE_URL + stock.getProductId(), com.inventory.inventoryservice.dto.ProductDto.class);
            if (product != null) {
                if (product.getReorderLevel() != null) {
                    dto.setReorderLevel(product.getReorderLevel());
                } else {
                    dto.setReorderLevel(stock.getReorderLevel());
                }
                dto.setProductName(product.getName());
                dto.setProductSku(product.getSku());
                dto.setCategory(product.getCategory());
                dto.setUnitPrice(product.getPrice());
            } else {
                dto.setReorderLevel(stock.getReorderLevel());
            }
        } catch (Exception e) {
            log.error("Failed to fetch product details for stock {}: {}", stock.getId(), e.getMessage());
            dto.setReorderLevel(stock.getReorderLevel());
        }

        return dto;
    }

    public Stock updateStock(Stock stock) {
        return stockRepository.save(stock);
    }

    public Stock createStock(Stock stock) {
        log.info("Creating new stock: productId={}, warehouseId={}, quantity={}",
                stock.getProductId(), stock.getWarehouseId(), stock.getQuantity());
        return stockRepository.save(stock);
    }

    public InventoryTransaction createTransaction(InventoryTransaction transaction) {
        log.info("Creating inventory transaction: type={}, productId={}, quantity={}",
                transaction.getType(), transaction.getProductId(), transaction.getQuantity());

        // Save transaction first
        InventoryTransaction savedTransaction = transactionRepository.save(transaction);

        // ✅ CRITICAL FIX #2: Use pessimistic locking for OUT and TRANSFER to prevent race conditions
        // Use locked query for operations that modify stock
        Stock stock = null;
        if (transaction.getType() == InventoryTransaction.TransactionType.OUT || 
            transaction.getType() == InventoryTransaction.TransactionType.TRANSFER) {
            stock = stockRepository.findByProductIdAndWarehouseIdWithLock(
                    transaction.getProductId(),
                    transaction.getWarehouseId()).orElseGet(() -> {
                        Stock newStock = new Stock();
                        newStock.setProductId(transaction.getProductId());
                        newStock.setWarehouseId(transaction.getWarehouseId());
                        newStock.setBranchId(transaction.getWarehouseId());
                        newStock.setQuantity(0);
                        newStock.setAvailableQuantity(0);
                        newStock.setReservedQuantity(0);
                        newStock.setOrgId(transaction.getOrgId());
                        return newStock;
                    });
        } else {
            stock = stockRepository.findByProductIdAndWarehouseId(
                    transaction.getProductId(),
                    transaction.getWarehouseId()).orElseGet(() -> {
                        Stock newStock = new Stock();
                        newStock.setProductId(transaction.getProductId());
                        newStock.setWarehouseId(transaction.getWarehouseId());
                        newStock.setBranchId(transaction.getWarehouseId());
                        newStock.setQuantity(0);
                        newStock.setAvailableQuantity(0);
                        newStock.setReservedQuantity(0);
                        newStock.setOrgId(transaction.getOrgId());
                        return newStock;
                    });
        }

        switch (transaction.getType()) {
            case IN:
                stock.setQuantity(stock.getQuantity() + transaction.getQuantity());
                stock.setAvailableQuantity(stock.getAvailableQuantity() + transaction.getQuantity());
                break;
            case OUT:
                // ✅ CRITICAL FIX #1: Validate sufficient stock before deducting
                if (stock.getAvailableQuantity() < transaction.getQuantity()) {
                    throw new IllegalArgumentException(
                        "Insufficient stock for product " + transaction.getProductId() + 
                        ": Available " + stock.getAvailableQuantity() + 
                        ", Requested " + transaction.getQuantity());
                }
                stock.setQuantity(stock.getQuantity() - transaction.getQuantity());
                stock.setAvailableQuantity(stock.getAvailableQuantity() - transaction.getQuantity());
                break;
            case ADJUSTMENT:
                stock.setQuantity(transaction.getQuantity());
                stock.setAvailableQuantity(transaction.getQuantity());
                break;
            case TRANSFER:
                // ✅ CRITICAL FIX #3: Validate sufficient stock before transferring
                if (stock.getAvailableQuantity() < transaction.getQuantity()) {
                    throw new IllegalArgumentException(
                        "Insufficient stock for transfer of product " + transaction.getProductId() + 
                        ": Available " + stock.getAvailableQuantity() + 
                        ", Requested " + transaction.getQuantity());
                }
                // 1. Subtract from source
                stock.setQuantity(stock.getQuantity() - transaction.getQuantity());
                stock.setAvailableQuantity(stock.getAvailableQuantity() - transaction.getQuantity());
                stockRepository.save(stock); // Save source stock

                // 2. Add to destination
                if (transaction.getToWarehouseId() != null) {
                    Stock targetStock = stockRepository.findByProductIdAndWarehouseId(
                            transaction.getProductId(),
                            transaction.getToWarehouseId()).orElseGet(() -> {
                                Stock newStock = new Stock();
                                newStock.setProductId(transaction.getProductId());
                                newStock.setWarehouseId(transaction.getToWarehouseId());
                                newStock.setBranchId(transaction.getToWarehouseId());
                                newStock.setQuantity(0);
                                newStock.setAvailableQuantity(0);
                                newStock.setReservedQuantity(0);
                                newStock.setOrgId(transaction.getOrgId());
                                return newStock;
                            });
                    targetStock.setQuantity(targetStock.getQuantity() + transaction.getQuantity());
                    targetStock.setAvailableQuantity(targetStock.getAvailableQuantity() + transaction.getQuantity());
                    stockRepository.save(targetStock);
                } else {
                    log.error("Transfer failed: Destination warehouse ID is missing for Product {}!", transaction.getProductId());
                }
                break;
            case RETURN:
                stock.setQuantity(stock.getQuantity() + transaction.getQuantity());
                stock.setAvailableQuantity(stock.getAvailableQuantity() + transaction.getQuantity());
                break;
        }

        stockRepository.save(stock);

        // Record in stock ledger for valuation tracking
        try {
            stockLedgerService.recordTransaction(savedTransaction);
            log.info("Transaction recorded in stock ledger successfully");
        } catch (Exception e) {
            log.error("Failed to record transaction in stock ledger: {}", e.getMessage(), e);
            // Don't fail the main transaction, just log the error
        }

        // Check stock levels and trigger alerts using Observer Pattern
        checkStockLevelsAndNotify(stock, transaction);

        return savedTransaction;
    }

    /**
     * Check stock levels and publish events to Observer Pattern
     */
    private void checkStockLevelsAndNotify(Stock stock, InventoryTransaction transaction) {
        try {
            // 1. Determine Reorder Level and Product Name
            Integer reorderLevel = stock.getReorderLevel();
            String productName = "Product " + stock.getProductId();
            String warehouseName = "Warehouse " + stock.getWarehouseId();

            // Try fetch global from product service
            try {
                com.inventory.inventoryservice.dto.ProductDto product = restTemplate.getForObject(
                        PRODUCT_SERVICE_URL + stock.getProductId(),
                        com.inventory.inventoryservice.dto.ProductDto.class);
                if (product != null) {
                    if (product.getReorderLevel() != null) {
                        reorderLevel = product.getReorderLevel();
                    }
                    if (product.getName() != null) {
                        productName = product.getName();
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to fetch product details for alert check from {}: {}",
                        PRODUCT_SERVICE_URL + stock.getProductId(), e.getMessage());
            }

            // Try fetch warehouse name
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> warehouse = restTemplate.getForObject(
                        WAREHOUSE_SERVICE_URL + stock.getWarehouseId(), Map.class);
                if (warehouse != null && warehouse.get("name") != null) {
                    warehouseName = (String) warehouse.get("name");
                }
            } catch (Exception e) {
                log.warn("Failed to fetch warehouse details for alert check from {}: {}",
                        WAREHOUSE_SERVICE_URL + stock.getWarehouseId(), e.getMessage());
            }

            // 2. Check Low Stock
            if (reorderLevel != null && stock.getQuantity() <= reorderLevel) {
                String message = String.format("Low Stock Alert: %s at %s has updated to %d (Reorder Level: %d)",
                        productName, warehouseName, stock.getQuantity(), reorderLevel);

                com.inventory.inventoryservice.event.StockEvent event = com.inventory.inventoryservice.event.StockEvent
                        .builder()
                        .type(com.inventory.inventoryservice.event.StockEvent.EventType.LOW_STOCK)
                        .productId(stock.getProductId())
                        .warehouseId(stock.getWarehouseId())
                        .remainingQuantity(stock.getQuantity())
                        .thresholdLevel(reorderLevel)
                        .orgId(stock.getOrgId())
                        .message(message)
                        .timestamp(java.time.LocalDateTime.now())
                        .build();

                stockEventPublisher.notifyObservers(event);
                log.info("Triggered Low Stock Alert: {}", message);
            }

            // 3. Check Out of Stock (Explicit)
            if (stock.getQuantity() <= 0) {
                String message = String.format("Out of Stock: %s at %s", productName, warehouseName);

                com.inventory.inventoryservice.event.StockEvent event = com.inventory.inventoryservice.event.StockEvent
                        .builder()
                        .type(com.inventory.inventoryservice.event.StockEvent.EventType.LOW_STOCK) // reuse LOW_STOCK
                                                                                                   // type
                        .productId(stock.getProductId())
                        .warehouseId(stock.getWarehouseId())
                        .remainingQuantity(stock.getQuantity())
                        .thresholdLevel(0)
                        .orgId(stock.getOrgId())
                        .message(message)
                        .timestamp(java.time.LocalDateTime.now())
                        .build();
                stockEventPublisher.notifyObservers(event);
            }

        } catch (Exception e) {
            log.error("Failed to process stock alerts: {}", e.getMessage());
        }
    }

    public List<InventoryTransaction> getTransactionsByProduct(Long productId) {
        return transactionRepository.findByProductId(productId);
    }

    public List<InventoryTransaction> getTransactionsByOrg(Long orgId) {
        return transactionRepository.findByOrgId(orgId);
    }

    public List<InventoryTransaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public long getLowStockCountByOrg(Long orgId) {
        List<Stock> stocks = stockRepository.findByOrgId(orgId);
        long count = 0;

        // Cache reorder levels to avoid redundant calls for same product in different
        // warehouses
        Map<Long, Integer> productReorderLevels = new HashMap<>();

        for (Stock stock : stocks) {
            Integer reorderLevel = stock.getReorderLevel();

            if (reorderLevel == null) {
                if (productReorderLevels.containsKey(stock.getProductId())) {
                    reorderLevel = productReorderLevels.get(stock.getProductId());
                } else {
                    try {
                        com.inventory.inventoryservice.dto.ProductDto product = restTemplate.getForObject(
                                PRODUCT_SERVICE_URL + stock.getProductId(),
                                com.inventory.inventoryservice.dto.ProductDto.class);
                        reorderLevel = (product != null) ? product.getReorderLevel() : null;
                        productReorderLevels.put(stock.getProductId(), reorderLevel);
                    } catch (Exception e) {
                        log.warn("Failed to fetch reorder level for product {}", stock.getProductId());
                    }
                }
            }

            if (reorderLevel != null && stock.getQuantity() <= reorderLevel) {
                count++;
            }
        }
        return count;
    }

    public void rebuildLedger(Long productId, Long warehouseId) {
        stockLedgerService.rebuildLedger(productId, warehouseId);
    }

    // ✅ NEW: Enrich stocks/transactions with product and warehouse names for UI display
    
    /**
     * Enrich a single stock with product and warehouse names
     */
    public Stock enrichStockWithNames(Stock stock) {
        if (stock == null) return null;
        
        try {
            // Fetch product name
            com.inventory.inventoryservice.dto.ProductDto product = restTemplate.getForObject(
                    PRODUCT_SERVICE_URL + stock.getProductId(),
                    com.inventory.inventoryservice.dto.ProductDto.class);
            if (product != null && product.getName() != null) {
                stock.setProductName(product.getName());
            } else {
                stock.setProductName("Product " + stock.getProductId());
            }
        } catch (Exception e) {
            log.warn("Failed to fetch product name for product ID {}: {}", stock.getProductId(), e.getMessage());
            stock.setProductName("Product " + stock.getProductId());
        }
        
        try {
            // Fetch warehouse name
            com.inventory.inventoryservice.dto.WarehouseDto warehouse = restTemplate.getForObject(
                    WAREHOUSE_SERVICE_URL + stock.getWarehouseId(),
                    com.inventory.inventoryservice.dto.WarehouseDto.class);
            if (warehouse != null && warehouse.getWarehouseName() != null) {
                stock.setWarehouseName(warehouse.getWarehouseName());
            } else {
                log.warn("No warehouse found for warehouse ID: {} or warehouse name is null", stock.getWarehouseId());
                stock.setWarehouseName("Warehouse " + stock.getWarehouseId());
            }
        } catch (Exception e) {
            log.warn("Failed to fetch warehouse name for warehouse ID {}: {}", stock.getWarehouseId(), e.getMessage());
            stock.setWarehouseName("Warehouse " + stock.getWarehouseId());
        }
        
        return stock;
    }

    /**
     * Enrich a list of stocks with product and warehouse names
     */
    public List<Stock> enrichStocksWithNames(List<Stock> stocks) {
        return stocks.stream().map(this::enrichStockWithNames).collect(java.util.stream.Collectors.toList());
    }

    /**
     * Enrich a single transaction with product and warehouse names
     */
    public InventoryTransaction enrichTransactionWithNames(InventoryTransaction tx) {
        if (tx == null) return null;
        
        try {
            // Fetch product name
            com.inventory.inventoryservice.dto.ProductDto product = restTemplate.getForObject(
                    PRODUCT_SERVICE_URL + tx.getProductId(),
                    com.inventory.inventoryservice.dto.ProductDto.class);
            if (product != null && product.getName() != null) {
                tx.setProductName(product.getName());
            } else {
                tx.setProductName("Product " + tx.getProductId());
            }
        } catch (Exception e) {
            log.warn("Failed to fetch product name for product ID {}: {}", tx.getProductId(), e.getMessage());
            tx.setProductName("Product " + tx.getProductId());
        }
        
        try {
            // Fetch warehouse name
            com.inventory.inventoryservice.dto.WarehouseDto warehouse = restTemplate.getForObject(
                    WAREHOUSE_SERVICE_URL + tx.getWarehouseId(),
                    com.inventory.inventoryservice.dto.WarehouseDto.class);
            if (warehouse != null && warehouse.getWarehouseName() != null) {
                tx.setWarehouseName(warehouse.getWarehouseName());
            } else {
                log.warn("No warehouse found for warehouse ID: {} or warehouse name is null", tx.getWarehouseId());
                tx.setWarehouseName("Warehouse " + tx.getWarehouseId());
            }
        } catch (Exception e) {
            log.warn("Failed to fetch warehouse name for warehouse ID {}: {}", tx.getWarehouseId(), e.getMessage());
            tx.setWarehouseName("Warehouse " + tx.getWarehouseId());
        }
        
        // Fetch destination warehouse name if TRANSFER
        if (tx.getToWarehouseId() != null) {
            try {
                com.inventory.inventoryservice.dto.WarehouseDto toWarehouse = restTemplate.getForObject(
                        WAREHOUSE_SERVICE_URL + tx.getToWarehouseId(),
                        com.inventory.inventoryservice.dto.WarehouseDto.class);
                if (toWarehouse != null && toWarehouse.getWarehouseName() != null) {
                    tx.setToWarehouseName(toWarehouse.getWarehouseName());
                } else {
                    log.warn("No destination warehouse found for warehouse ID: {} or name is null", tx.getToWarehouseId());
                    tx.setToWarehouseName("Warehouse " + tx.getToWarehouseId());
                }
            } catch (Exception e) {
                log.warn("Failed to fetch destination warehouse name for warehouse ID {}: {}", tx.getToWarehouseId(), e.getMessage());
                tx.setToWarehouseName("Warehouse " + tx.getToWarehouseId());
            }
        }
        
        return tx;
    }

    /**
     * Enrich a list of transactions with product and warehouse names
     */
    public List<InventoryTransaction> enrichTransactionsWithNames(List<InventoryTransaction> transactions) {
        return transactions.stream().map(this::enrichTransactionWithNames).collect(java.util.stream.Collectors.toList());
    }
}

