# QUICK START GUIDE - STEP 2 BACKEND ORCHESTRATOR

## Prerequisites Checklist

✅ **Step 1 Database Migrations Executed**
   - V1: subscribed_systems column added to company_tenant
   - V2: system_subscription table created
   - V3: system_catalog table and view created

✅ **MySQL Databases Ready**
   - identity_db (users table exists)
   - subscription_db (company_tenant table exists)

✅ **Identity Service Ready**
   - Running on port 8088
   - Spring Boot 3.2.0
   - Java 17

---

## Step-by-Step Setup

### 1. Update application.properties

Copy configurations from `APPLICATION_PROPERTIES_STEP2.txt` to:
```
identity-service/src/main/resources/application.properties
```

**Key configurations:**
- Primary datasource: identity_db (users)
- Secondary datasource: subscription_db (company_tenant)
- Ginuma endpoint: http://localhost:8081/api/tenant/setup
- Inventory endpoint: http://localhost:8086/api/users/org/setup

### 2. Add Dependencies to pom.xml

```xml
<!-- Already should be present, verify: -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

### 3. Build the Project

```powershell
cd Knoweb_inventory\identity-service
mvn clean install -DskipTests
```

### 4. Start Identity Service

```powershell
mvn spring-boot:run
```

**Expected output:**
```
Started IdentityServiceApplication in X.XXX seconds
Tomcat started on port(s): 8088 (http)
```

### 5. Verify Health

```powershell
curl http://localhost:8088/api/auth/register/health
```

**Expected response:**
```
Registration Orchestrator is running
```

---

## Testing the Implementation

### Test 1: Health Check

```bash
curl http://localhost:8088/api/auth/register/health
```

### Test 2: Get Available Systems

```bash
curl http://localhost:8088/api/auth/register/systems
```

### Test 3: Register Ginuma User

```bash
curl -X POST http://localhost:8088/api/auth/register/unified \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Corp",
    "email": "test@ginuma.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User",
    "selectedSystem": "GINUMA",
    "phoneNumber": "+1234567890"
  }'
```

### Test 4: Verify Database Entries

**Check identity_db:**
```sql
USE identity_db;
SELECT id, email, org_id, is_active, created_at FROM users WHERE email = 'test@ginuma.com';
```

**Check subscription_db:**
```sql
USE subscription_db;
SELECT org_id, company_name, contact_email, subscribed_systems, status 
FROM company_tenant 
WHERE contact_email = 'test@ginuma.com';
```

**Expected Results:**
- User created in identity_db with unique org_id
- Company tenant created in subscription_db with subscribed_systems = ["GINUMA"]
- STATUS should be "ACTIVE"

---

## Common Issues & Solutions

### Issue 1: "Table 'subscription_db.company_tenant' doesn't exist"

**Solution:** Run Step 1 migrations:
```sql
USE subscription_db;
SOURCE path/to/EXECUTE_ALL_MIGRATIONS.sql;
```

### Issue 2: "Bean of type PasswordEncoder not found"

**Solution:** Add to RestClientConfig.java or create SecurityConfig:
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

### Issue 3: "Multiple datasource configuration error"

**Solution:** Make sure:
- IdentityDbConfig has @Primary annotation
- Both configs have different persistenceUnit names
- Repository filters are correctly configured

### Issue 4: "Connection refused to Ginuma/Inventory endpoint"

**Expected Behavior:** This is NORMAL for now because:
- Ginuma endpoint (8081) not implemented yet
- Inventory endpoint (8086) not implemented yet
- The orchestrator will LOG the error but continue
- User and company tenant are still created successfully

**Verify partial success:**
```sql
-- User should exist
SELECT * FROM identity_db.users WHERE email = 'test@ginuma.com';

-- Company should exist
SELECT * FROM subscription_db.company_tenant WHERE contact_email = 'test@ginuma.com';
```

### Issue 5: "JSON parsing error on subscribed_systems"

**Solution:** Check:
- JsonListConverter is in util package
- @Convert annotation is on subscribed_systems field
- MySQL JSON column type is correct

---

## Validation Checklist

After setup, verify:

✅ Identity service starts on port 8088  
✅ Health endpoint returns success  
✅ POST /register/unified accepts request  
✅ User created in identity_db.users  
✅ Company created in subscription_db.company_tenant  
✅ subscribed_systems JSON contains correct system  
✅ org_id is consistent across tables  
✅ Password is hashed (BCrypt)  
✅ Timestamps are populated  
✅ Status is ACTIVE  

---

## Next Development Steps

### STEP 3: Implement System-Specific Endpoints

**A. Ginuma ERP System** (Backend: ginum-backend-main)

Create endpoint: `POST /api/tenant/setup`

```java
@RestController
@RequestMapping("/api/tenant")
public class TenantSetupController {
    
    @PostMapping("/setup")
    public ResponseEntity<SystemSetupResponse> setupTenant(
        @RequestBody GinumaTenantSetupRequest request) {
        
        // 1. Create organization in ginuma_db
        // 2. Create admin user
        // 3. Initialize company settings
        // 4. Return success response
        
        return ResponseEntity.ok(
            SystemSetupResponse.builder()
                .success(true)
                .message("Ginuma tenant setup completed")
                .orgId(request.getOrgId())
                .build()
        );
    }
}
```

**B. Inventory User Service** (Backend: user-service)

Create endpoint: `POST /api/users/org/setup`

```java
@RestController
@RequestMapping("/api/users")
public class OrgSetupController {
    
    @PostMapping("/org/setup")
    public ResponseEntity<SystemSetupResponse> setupOrganization(
        @RequestBody InventoryOrgSetupRequest request) {
        
        // 1. Create organization in user_db
        // 2. Create primary branch
        // 3. Create admin user
        // 4. Return success response
        
        return ResponseEntity.ok(
            SystemSetupResponse.builder()
                .success(true)
                .message("Organization setup completed")
                .orgId(request.getOrgId())
                .branchId(1L)
                .build()
        );
    }
}
```

---

## Testing with Postman

Import collection: `POSTMAN_COLLECTION_STEP2.json`

Contains 6 pre-configured requests:
1. Health Check
2. Get Available Systems
3. Register Ginuma User
4. Register Inventory User
5. Duplicate Email Test (should fail)
6. Minimal Data Test

---

## Troubleshooting Commands

### View Logs
```powershell
# Real-time logs
mvn spring-boot:run

# Or check log file
Get-Content identity-service/logs/application.log -Tail 50 -Wait
```

### Check Database
```sql
-- Check if databases exist
SHOW DATABASES;

-- Check tables
USE identity_db;
SHOW TABLES;

USE subscription_db;
SHOW TABLES;

-- Check user count
SELECT COUNT(*) FROM identity_db.users;
SELECT COUNT(*) FROM subscription_db.company_tenant;

-- View recent registrations
SELECT u.id, u.email, u.org_id, ct.company_name, ct.subscribed_systems
FROM identity_db.users u
LEFT JOIN subscription_db.company_tenant ct ON u.org_id = ct.org_id
ORDER BY u.created_at DESC
LIMIT 10;
```

### Debug REST Calls
```powershell
# Enable verbose logging in application.properties
logging.level.org.springframework.web.client.RestTemplate=DEBUG
logging.level.com.inventory.identity.service.RegistrationOrchestratorService=TRACE
```

---

## Production Checklist (Before Step 4)

Before moving to frontend implementation:

- [ ] Test registration with GINUMA system
- [ ] Test registration with INVENTORY system
- [ ] Verify database isolation (data in correct DBs)
- [ ] Test duplicate email validation
- [ ] Test password hashing
- [ ] Verify org_id generation
- [ ] Check trial period calculation
- [ ] Test with missing optional fields
- [ ] Verify CORS headers
- [ ] Review log outputs

---

## Architecture Verification

```
✅ Frontend (Future)
      │
      ├─→ POST /api/auth/register/unified
      │
✅ RegistrationOrchestratorController
      │
✅ RegistrationOrchestratorService
      │
      ├─→ ✅ UserRepository → identity_db.users
      │
      ├─→ ✅ CompanyTenantRepository → subscription_db.company_tenant
      │
      ├─→ ⏳ RestTemplate.POST → http://localhost:8081/api/tenant/setup (STEP 3)
      │                          (ginuma_db)
      │
      └─→ ⏳ RestTemplate.POST → http://localhost:8086/api/users/org/setup (STEP 3)
                                 (user_db)
```

✅ = Completed  
⏳ = Pending (Next Step)

---

**Files Created:**
- 11 Java classes (DTOs, Entities, Services, Controllers, Configs)
- 2 Database config classes
- 1 Properties file
- 1 Postman collection
- 2 Documentation files

**Ready for STEP 3!** 🚀
