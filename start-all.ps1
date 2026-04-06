# Start all services in order
Write-Host "Starting all microservices..." -ForegroundColor Green

# Start MySQL (if not running with Docker)
Write-Host "`nMake sure MySQL is running on port 3306" -ForegroundColor Yellow

# Start Service Discovery
Write-Host "`nStarting Service Discovery on port 8761..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd service-discovery; mvn spring-boot:run"
Start-Sleep -Seconds 30

# Start API Gateway
Write-Host "`nStarting API Gateway on port 8080..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api-gateway; mvn spring-boot:run"
Start-Sleep -Seconds 20

# Start Product Service
Write-Host "`nStarting Product Service on port 8081..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd product-service; mvn spring-boot:run"
Start-Sleep -Seconds 10

# Start Inventory Service
Write-Host "`nStarting Inventory Service on port 8082..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd inventory-service; mvn spring-boot:run"
Start-Sleep -Seconds 10

# Start Order Service
Write-Host "`nStarting Order Service on port 8083..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd order-service; mvn spring-boot:run"
Start-Sleep -Seconds 10

# Start Warehouse Service
Write-Host "`nStarting Warehouse Service on port 8084..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd warehouse-service; mvn spring-boot:run"
Start-Sleep -Seconds 10

# Start Supplier Service
Write-Host "`nStarting Supplier Service on port 8085..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd supplier-service; mvn spring-boot:run"
Start-Sleep -Seconds 10

# Start User Service
Write-Host "`nStarting User Service on port 8086..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd user-service; mvn spring-boot:run"
Start-Sleep -Seconds 10

# Start Notification Service
Write-Host "`nStarting Notification Service on port 8087..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd notification-service; mvn spring-boot:run"
Start-Sleep -Seconds 10

# Start Identity Service
Write-Host "`nStarting Identity Service on port 8088..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd identity-service; mvn spring-boot:run"
Start-Sleep -Seconds 10

# Start Catalog Service
Write-Host "`nStarting Catalog Service on port 8089..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd catalog-service; mvn spring-boot:run"
Start-Sleep -Seconds 10

# Start Reporting Service
Write-Host "`nStarting Reporting Service on port 8090..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd reporting-service; mvn spring-boot:run"
Start-Sleep -Seconds 10

Write-Host "`n✅ All 12 microservices started!" -ForegroundColor Green
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "SERVICE URLS:" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Eureka Dashboard:     http://localhost:8761" -ForegroundColor White
Write-Host "API Gateway:          http://localhost:8080" -ForegroundColor White
Write-Host "Product Service:      http://localhost:8081" -ForegroundColor White
Write-Host "Inventory Service:    http://localhost:8082" -ForegroundColor White
Write-Host "Order Service:        http://localhost:8083" -ForegroundColor White
Write-Host "Warehouse Service:    http://localhost:8084" -ForegroundColor White
Write-Host "Supplier Service:     http://localhost:8085" -ForegroundColor White
Write-Host "User Service:         http://localhost:8086" -ForegroundColor White
Write-Host "Notification Service: http://localhost:8087" -ForegroundColor White
Write-Host "Identity Service:     http://localhost:8088" -ForegroundColor White
Write-Host "Catalog Service:      http://localhost:8089" -ForegroundColor White
Write-Host "Reporting Service:    http://localhost:8090" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
