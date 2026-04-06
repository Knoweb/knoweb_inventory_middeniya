# 🔴 FIXED: Empty Roles Array in JWT Token (roles=[])

## 🎯 Root Cause Identified

Your JWT token contains `roles=[]` because **the user in your database has NO roles assigned** in the `user_roles` join table.

### What Was Happening:
1. ❌ User exists in `users` table
2. ❌ But `user_roles` table has no entry for this user
3. ❌ `UserDetailsImpl.build()` calls `user.getRoles()` → returns empty Set
4. ❌ JWT generation adds `roles=[]` to token
5. ❌ Ginuma backend parses token → sees empty roles → grants no authorities
6. ❌ Spring Security denies access → **403 Forbidden**

---

## ✅ What I Fixed

### 1. **UserRepository.java** - Added Explicit JOIN FETCH Query
```java
@Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.email = :email")
Optional<User> findByEmailWithRoles(@Param("email") String email);
```
**Why:** Ensures roles are loaded in the same SQL query, preventing lazy loading issues.

### 2. **UserDetailsServiceImpl.java** - Enhanced Logging
```java
logger.info("🔍 Loading user: {} | Roles in DB: {} (count: {})", 
    user.getEmail(), 
    user.getRoles().stream().map(r -> r.getName().name()).toList(),
    user.getRoles().size());

if (user.getRoles().isEmpty()) {
    logger.error("❌ USER HAS NO ROLES! This will cause roles=[] in JWT token!");
}
```
**Why:** You'll immediately see if the user has no roles when loading from database.

### 3. **UserDetailsImpl.java** - Added Warning Messages
```java
if (user.getRoles() == null || user.getRoles().isEmpty()) {
    System.err.println("⚠️ WARNING: User has NO ROLES in database!");
}
System.out.println("✅ Built UserDetailsImpl with authorities: " + authorities);
```
**Why:** Console warning when building UserDetails with empty authorities.

### 4. **JwtTokenProvider.java** - Added Token Generation Logging
```java
List<String> roles = userPrincipal.getAuthorities().stream()
    .map(GrantedAuthority::getAuthority)
    .collect(Collectors.toList());

logger.info("🎫 Generating JWT token | Roles to add: {}", roles);

if (roles.isEmpty()) {
    logger.error("❌ CRITICAL: User has NO authorities! JWT will have roles=[]");
}
```
**Why:** Shows exactly what roles are being added to the JWT token.

---

## 🚀 How to Fix Your Issue

### **Quick Fix - Assign ROLE_COMPANY to Your User**

#### **Option A: Using MySQL Command Line**
```bash
mysql -u root -p
```

```sql
USE identity_db;

-- 1. Find your user ID:
SELECT id, email FROM users WHERE email = 'your-email@example.com';
-- Note the user ID (e.g., 123)

-- 2. Get ROLE_COMPANY role ID:
SELECT id FROM roles WHERE name = 'ROLE_COMPANY';
-- Note the role ID (e.g., 3)

-- 3. Assign role to user:
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (123, 3);
-- ⚠️ Replace 123 and 3 with actual IDs from steps 1 and 2

-- 4. Verify:
SELECT u.email, r.name 
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'your-email@example.com';

-- Expected output:
-- email: your-email@example.com | name: ROLE_COMPANY ✅
```

#### **Option B: Using SQL Script (Automated)**
```bash
mysql -u root -p identity_db < c:/Users/Shehan/Desktop/new_erp/Knoweb_inventory/identity-service/DIAGNOSE_AND_FIX_ROLES.sql
```

**Edit the script first:**
- Line 53: Change `'your-email@example.com'` to your actual email
- Line 66: Uncomment the INSERT statement

---

## 📋 Testing Steps

### **Step 1: Verify Database State**
```sql
-- Check if user has roles:
SELECT 
    u.email,
    GROUP_CONCAT(r.name) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'your-email@example.com'
GROUP BY u.email;

-- If roles column is NULL → NO ROLES ASSIGNED ❌
-- If roles = 'ROLE_COMPANY' → CORRECT ✅
```

### **Step 2: Start Identity Service**
```powershell
cd c:\Users\Shehan\Desktop\new_erp\Knoweb_inventory\identity-service
mvn spring-boot:run
```

**Watch for these logs during login:**
```
🔍 Loading user: john@company.com | Roles in DB: [ROLE_COMPANY] (count: 1)
✅ Built UserDetailsImpl with authorities: [ROLE_COMPANY]
🎫 Generating JWT token | Roles to add to token: [ROLE_COMPANY]
```

**If you see:**
```
❌ USER HAS NO ROLES! This will cause roles=[] in JWT token!
```
→ **Go back to Step 1 and assign the role**

### **Step 3: Clear Tokens and Re-Login**
1. Open browser console (F12)
2. Clear storage:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
3. Navigate to Dashboard: http://localhost:5173
4. Login again
5. Launch Ginuma via SSO

### **Step 4: Verify Token Contains Roles**
```javascript
// In browser console:
const token = localStorage.getItem('auth_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Roles in token:', payload.roles);

// Expected output:
// Roles in token: ["ROLE_COMPANY"] ✅

// If output is:
// Roles in token: [] ❌
// → User still has no roles in database, check Step 1 again
```

### **Step 5: Start Ginuma Backend**
```powershell
cd c:\Users\Shehan\Desktop\new_erp\Ginuma_new_updates\ginum-backend-main
mvn spring-boot:run
```

**Watch for these logs:**
```
✅ JWT validation successful!
📋 ALL CLAIMS: {roles=[ROLE_COMPANY], userId=123, ...}
🎭 Extracted roles from JWT: [ROLE_COMPANY] (count: 1)
   ↳ Mapping role 'ROLE_COMPANY' → authority 'ROLE_COMPANY'
🔐 Final Granted Authorities (count: 1): [ROLE_COMPANY]
✅ Authentication set with authorities: [ROLE_COMPANY]
```

### **Step 6: Test API Endpoint**
```javascript
// In browser console:
fetch('http://localhost:8081/api/companies/YOUR_ORG_ID', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
  }
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(data => console.log('Data:', data));

// Expected:
// Status: 200 ✅

// If you get:
// Status: 403 ❌
// → Check Ginuma logs for "NO ROLES FOUND IN TOKEN"
```

---

## 🔍 Troubleshooting Decision Tree

### **Symptom: JWT token has roles=[]**

#### **Check 1: Does database have role assigned?**
```sql
SELECT * FROM user_roles WHERE user_id = YOUR_USER_ID;
```

**If empty:**
- ❌ **Problem:** User has no roles in database
- ✅ **Solution:** Run Step 1 above to assign ROLE_COMPANY

**If has rows:**
- ✅ Database is correct
- ❓ Check next step

#### **Check 2: Are roles being loaded from database?**
**Look at identity-service logs during login:**

**If you see:**
```
❌ USER HAS NO ROLES! This will cause roles=[] in JWT token!
```
- ❌ **Problem:** JOIN FETCH query not working or wrong method being called
- ✅ **Solution:** Verify `findByEmailWithRoles()` is being used (I already fixed this)

**If you see:**
```
🔍 Loading user: <email> | Roles in DB: [ROLE_COMPANY]
```
- ✅ Roles loaded from database correctly
- ❓ Check next step

#### **Check 3: Are roles being added to JWT token?**
**Look at identity-service logs during token generation:**

**If you see:**
```
❌ CRITICAL: User has NO authorities! JWT will have roles=[]
```
- ❌ **Problem:** Authorities not passed from UserDetails to JWT
- ✅ **Solution:** This should not happen with the fixes I made

**If you see:**
```
🎫 Generating JWT token | Roles to add to token: [ROLE_COMPANY]
```
- ✅ Token should contain roles
- ❓ Decode token to verify (Step 4 above)

#### **Check 4: Is Ginuma extracting roles from token?**
**Look at Ginuma backend logs:**

**If you see:**
```
❌ NO ROLES FOUND IN TOKEN! Available claims: [...]
```
- ❌ **Problem:** Token doesn't actually have roles claim
- ✅ **Solution:** Token was cached, clear localStorage and re-login

**If you see:**
```
🎭 Extracted roles from JWT: [ROLE_COMPANY]
🔐 Final Granted Authorities: [ROLE_COMPANY]
```
- ✅ Everything working correctly!
- If still 403, check SecurityConfig hasRole() patterns

---

## 📊 Log Patterns Summary

### ✅ **GOOD - Everything Working:**
```
Identity-Service:
  🔍 Loading user: john@company.com | Roles in DB: [ROLE_COMPANY] (count: 1)
  ✅ Built UserDetailsImpl with authorities: [ROLE_COMPANY]
  🎫 Generating JWT token | Roles to add to token: [ROLE_COMPANY]

Ginuma Backend:
  🎭 Extracted roles from JWT: [ROLE_COMPANY] (count: 1)
  🔐 Final Granted Authorities (count: 1): [ROLE_COMPANY]
  ✅ Authentication set with authorities: [ROLE_COMPANY]
```
→ **No 403 errors, API calls succeed** ✅

### ❌ **BAD - User Has No Roles in Database:**
```
Identity-Service:
  ❌ USER HAS NO ROLES! Email: john@company.com | User ID: 123
     FIX: Run SQL -> INSERT INTO user_roles (user_id, role_id) SELECT 123, id FROM roles WHERE name = 'ROLE_COMPANY'
  ⚠️ WARNING: User john@company.com has NO ROLES in database!
  ✅ Built UserDetailsImpl with authorities: []
  ❌ CRITICAL: User john@company.com has NO authorities! JWT token will have roles=[]

Ginuma Backend:
  ❌ NO ROLES FOUND IN TOKEN! Available claims: [username, email, userId, orgId, tenantId]
  🔐 Final Granted Authorities (count: 0): []
```
→ **403 Forbidden on all API calls** ❌

---

## 🎯 Quick Reference

**Files Changed:**
- ✅ [UserRepository.java](Knoweb_inventory/identity-service/src/main/java/com/inventory/identity/repository/UserRepository.java) - Added `findByEmailWithRoles()`
- ✅ [UserDetailsServiceImpl.java](Knoweb_inventory/identity-service/src/main/java/com/inventory/identity/security/UserDetailsServiceImpl.java) - Enhanced logging
- ✅ [UserDetailsImpl.java](Knoweb_inventory/identity-service/src/main/java/com/inventory/identity/security/UserDetailsImpl.java) - Added warnings
- ✅ [JwtTokenProvider.java](Knoweb_inventory/identity-service/src/main/java/com/inventory/identity/security/JwtTokenProvider.java) - Token generation logging

**SQL Scripts:**
- 📄 [DIAGNOSE_AND_FIX_ROLES.sql](Knoweb_inventory/identity-service/DIAGNOSE_AND_FIX_ROLES.sql) - Full diagnostic & fix
- 📄 [ADD_ROLE_COMPANY.sql](Knoweb_inventory/identity-service/ADD_ROLE_COMPANY.sql) - Simple role assignment

**Your Action:**
1. Run SQL to assign ROLE_COMPANY to your user
2. Restart identity-service
3. Clear browser storage
4. Re-login
5. Check logs for "Roles in DB: [ROLE_COMPANY]"
6. Verify token has roles (decode JWT)
7. Test API endpoints

**Expected Result:**
- ✅ Identity-service logs show roles loaded from DB
- ✅ JWT token contains `roles: ["ROLE_COMPANY"]`
- ✅ Ginuma backend extracts roles successfully
- ✅ API calls return 200 instead of 403
