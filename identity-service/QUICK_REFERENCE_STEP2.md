# ⚡ STEP 2 - QUICK REFERENCE CARD

## 🎯 Core Implementation
**Unified SSO Registration Backend Orchestrator**

---

## 📦 What Was Built

### Main Endpoint
```
POST http://localhost:8088/api/auth/register/unified
```

### Flow
```
Frontend → Controller → Service → Multi-DB Save → System Routing
                                   ↓              ↓
                           identity_db      subscription_db
                           (users)          (company_tenant)
                                   ↓              
                         Route to GINUMA (8081) or INVENTORY (8086)
```

---

## ✅ Success Checklist

Before testing, ensure:

- [ ] Step 1 migrations executed (subscribed_systems column exists)
- [ ] MySQL databases running (identity_db + subscription_db)
- [ ] application.properties updated with Step 2 config
- [ ] Identity service starts on port 8088
- [ ] Health check responds: `curl http://localhost:8088/api/auth/register/health`

---

## 🧪 Test Registration

### Ginuma User
```bash
curl -X POST http://localhost:8088/api/auth/register/unified \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Ginuma Corp",
    "email": "test@ginuma.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User",
    "selectedSystem": "GINUMA",
    "phoneNumber": "+1234567890"
  }'
```

### Inventory User
```bash
curl -X POST http://localhost:8088/api/auth/register/unified \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Inventory Corp",
    "email": "test@inventory.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User",
    "selectedSystem": "INVENTORY",
    "branchName": "Main Warehouse"
  }'
```

---

## 🔍 Verify Results

### Quick SQL Check
```sql
-- Check user
SELECT * FROM identity_db.users WHERE email = 'test@ginuma.com';

-- Check company
SELECT * FROM subscription_db.company_tenant WHERE contact_email = 'test@ginuma.com';

-- Check consistency (org_id match)
SELECT u.email, u.org_id, ct.company_name, ct.subscribed_systems
FROM identity_db.users u
JOIN subscription_db.company_tenant ct ON u.org_id = ct.org_id
WHERE u.email = 'test@ginuma.com';
```

### Expected Results
✅ User exists in identity_db with:
   - Hashed password (starts with `$2a$10$`)
   - org_id populated
   - is_active = true

✅ Company exists in subscription_db with:
   - Same org_id
   - subscribed_systems = `["GINUMA"]` or `["INVENTORY"]`
   - status = "ACTIVE"
   - subscription_end_date = today + 14 days

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Table doesn't exist" | Run Step 1 migrations |
| "PasswordEncoder bean not found" | Added in RestClientConfig (already fixed) |
| "Multiple datasource error" | Check @Primary on IdentityDbConfig |
| "Connection refused to 8081/8086" | Expected - implement Step 3 next |
| "JSON parsing error" | Check JsonListConverter exists |

---

## 📂 Key Files

**Service Layer:**
- `RegistrationOrchestratorService.java` - Core logic (400+ lines)
- `RegistrationOrchestratorController.java` - REST endpoints

**Configuration:**
- `IdentityDbConfig.java` - Primary DB (identity_db)
- `SubscriptionDbConfig.java` - Secondary DB (subscription_db)
- `RestClientConfig.java` - HTTP clients + PasswordEncoder

**Entities:**
- `User.java` - Identity DB user (updated with @Builder)
- `CompanyTenant.java` - Subscription DB company (with JSON)

**DTOs:**
- `UnifiedRegistrationRequest.java`
- `UnifiedRegistrationResponse.java`
- `GinumaTenantSetupRequest.java`
- `InventoryOrgSetupRequest.java`
- `SystemSetupResponse.java`

---

## 🎓 Key Concepts

### 1. Multi-Database Access
```java
// Primary (identity_db)
@Primary
@Bean(name = "identityDataSource")

// Secondary (subscription_db)
@Bean(name = "subscriptionDataSource")
```

### 2. JSON Column Handling
```java
@Convert(converter = JsonListConverter.class)
@Column(name = "subscribed_systems", columnDefinition = "JSON")
private List<String> subscribedSystems;
```

### 3. System Routing
```java
if (request.isGinumaSystem()) {
    setupGinumaSystem(request, orgId);
} else if (request.isInventorySystem()) {
    setupInventorySystem(request, orgId);
}
```

---

## 🚀 Next Steps

### STEP 3: System Endpoints
Create these endpoints:

**Ginuma:**
```java
@PostMapping("/api/tenant/setup")
public ResponseEntity<SystemSetupResponse> setupTenant(
    @RequestBody GinumaTenantSetupRequest request) {
    // Save to ginuma_db
}
```

**Inventory:**
```java
@PostMapping("/api/users/org/setup")
public ResponseEntity<SystemSetupResponse> setupOrganization(
    @RequestBody InventoryOrgSetupRequest request) {
    // Save to user_db
}
```

### STEP 4: Frontend
Create `UnifiedRegistrationForm.jsx` with:
- System selection (GINUMA / INVENTORY)
- Form fields (company, email, password)
- POST to `/api/auth/register/unified`
- Success redirect based on system

---

## 📊 Status

| Component | Status |
|-----------|--------|
| **STEP 1** | ✅ Complete (DB migrations) |
| **STEP 2** | ✅ Complete (Backend orchestrator) |
| **STEP 3** | ⏳ Pending (System endpoints) |
| **STEP 4** | ⏳ Pending (Frontend form) |

---

## 📚 Documentation

- `STEP2_BACKEND_ORCHESTRATOR_GUIDE.md` - Complete guide (500+ lines)
- `QUICK_START_STEP2.md` - Setup instructions
- `VERIFICATION_QUERIES_STEP2.sql` - Database validation
- `STEP2_IMPLEMENTATION_SUMMARY.md` - Full summary
- `POSTMAN_COLLECTION_STEP2.json` - API tests
- `THIS_FILE.md` - Quick reference

---

## 💡 Pro Tips

1. **Test with Postman first** before coding frontend
2. **Check logs** if registration fails: `mvn spring-boot:run`
3. **Validate DB entries** after each test registration
4. **Use different emails** for each test (no duplicates)
5. **System setup errors are EXPECTED** until Step 3 is done

---

## 🎉 Quick Win Test

```bash
# 1. Start service
cd Knoweb_inventory/identity-service
mvn spring-boot:run

# 2. Wait for "Started IdentityServiceApplication"

# 3. Test health
curl http://localhost:8088/api/auth/register/health

# 4. Register test user
curl -X POST http://localhost:8088/api/auth/register/unified \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Quick Test Corp","email":"quicktest@test.com","password":"Test123!","firstName":"Quick","lastName":"Test","selectedSystem":"GINUMA"}'

# 5. Should see success response with orgId, userId, etc.
```

---

**Everything Ready! Proceed to STEP 3 when approved.** ✅
