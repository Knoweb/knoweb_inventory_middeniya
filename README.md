# Inventory Management System - Microservices Architecture

## Technology Stack
- **Frontend**: React + Vite
- **Backend**: Spring Boot (Java 17)
- **Database**: MySQL 8.0
- **Architecture**: Microservices

## Project Structure

### Backend Services
1. **api-gateway** - API Gateway (Port: 8080)
2. **service-discovery** - Eureka Server (Port: 8761)
3. **product-service** - Product Management (Port: 8081)
4. **inventory-service** - Inventory & Stock Management (Port: 8082)
5. **order-service** - Purchase & Sales Orders (Port: 8083)
6. **warehouse-service** - Warehouse Management (Port: 8084)
7. **supplier-service** - Supplier Management (Port: 8085)
8. **user-service** - User & Authentication (Port: 8086)
9. **notification-service** - Notifications (Port: 8087)

### Frontend
- **inventory-frontend** - React + Vite Application (Port: 5173)

## Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0+
- Maven 3.8+
- Docker (optional)

## Getting Started

### Database Setup
1. Create MySQL databases for each service:
```sql
CREATE DATABASE product_db;
CREATE DATABASE inventory_db;
CREATE DATABASE order_db;
CREATE DATABASE warehouse_db;
CREATE DATABASE supplier_db;
CREATE DATABASE user_db;
CREATE DATABASE notification_db;
```

### Backend Services
1. Start Service Discovery:
```bash
cd service-discovery
mvn spring-boot:run
```

2. Start API Gateway:
```bash
cd api-gateway
mvn spring-boot:run
```

3. Start individual services:
```bash
cd product-service && mvn spring-boot:run
cd inventory-service && mvn spring-boot:run
# ... and so on
```

### Frontend
```bash
cd inventory-frontend
npm install
npm run dev
```

## API Endpoints
All services are accessible through API Gateway: `http://localhost:8080`

- Product Service: `/api/products/**`
- Inventory Service: `/api/inventory/**`
- Order Service: `/api/orders/**`
- Warehouse Service: `/api/warehouses/**`
- Supplier Service: `/api/suppliers/**`
- User Service: `/api/users/**`
- Notification Service: `/api/notifications/**`

## Docker Deployment
```bash
docker-compose up -d
```

## Features
- Product Management
- Inventory Tracking
- Warehouse Management
- Purchase & Sales Orders
- Supplier Management
- User Management & Authentication
- Real-time Notifications
- Accounting & Ledger
