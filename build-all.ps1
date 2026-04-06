# Build all services
Write-Host "Building all microservices..." -ForegroundColor Green

# Build Service Discovery
Write-Host "`nBuilding Service Discovery..." -ForegroundColor Cyan
Set-Location service-discovery
mvn clean package -DskipTests
Set-Location ..

# Build API Gateway
Write-Host "`nBuilding API Gateway..." -ForegroundColor Cyan
Set-Location api-gateway
mvn clean package -DskipTests
Set-Location ..

# Build Product Service
Write-Host "`nBuilding Product Service..." -ForegroundColor Cyan
Set-Location product-service
mvn clean package -DskipTests
Set-Location ..

# Build Inventory Service
Write-Host "`nBuilding Inventory Service..." -ForegroundColor Cyan
Set-Location inventory-service
mvn clean package -DskipTests
Set-Location ..

# Build Order Service
Write-Host "`nBuilding Order Service..." -ForegroundColor Cyan
Set-Location order-service
mvn clean package -DskipTests
Set-Location ..

# Build Warehouse Service
Write-Host "`nBuilding Warehouse Service..." -ForegroundColor Cyan
Set-Location warehouse-service
mvn clean package -DskipTests
Set-Location ..

# Build Supplier Service
Write-Host "`nBuilding Supplier Service..." -ForegroundColor Cyan
Set-Location supplier-service
mvn clean package -DskipTests
Set-Location ..

# Build User Service
Write-Host "`nBuilding User Service..." -ForegroundColor Cyan
Set-Location user-service
mvn clean package -DskipTests
Set-Location ..

# Build Notification Service
Write-Host "`nBuilding Notification Service..." -ForegroundColor Cyan
Set-Location notification-service
mvn clean package -DskipTests
Set-Location ..

Write-Host "`n✅ All services built successfully!" -ForegroundColor Green
