package com.inventory.identity.config;

import com.inventory.identity.model.Permission;
import com.inventory.identity.model.Role;
import com.inventory.identity.model.RoleName;
import com.inventory.identity.repository.PermissionRepository;
import com.inventory.identity.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PermissionRepository permissionRepository;

    @PersistenceContext(unitName = "subscription")
    private EntityManager subscriptionEntityManager;

    private final TransactionTemplate subscriptionTxTemplate;

    public DataInitializer(@Qualifier("subscriptionTransactionManager") PlatformTransactionManager subscriptionTxManager) {
        this.subscriptionTxTemplate = new TransactionTemplate(subscriptionTxManager);
    }
    
    @Override
    public void run(String... args) throws Exception {
        // Ensure subscription table exists before registration queries run
        ensureCompanyTenantTableExists();

        // Create permissions if they don't exist
        createPermissionsIfNotExist();
        
        // Create roles if they don't exist
        createRolesIfNotExist();
    }

    private void ensureCompanyTenantTableExists() {
        subscriptionTxTemplate.executeWithoutResult(status -> {
            subscriptionEntityManager.createNativeQuery("""
                CREATE TABLE IF NOT EXISTS company_tenant (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    org_id BIGINT NOT NULL,
                    company_name VARCHAR(255) NOT NULL,
                    contact_email VARCHAR(255),
                    status VARCHAR(50),
                    plan_type VARCHAR(50),
                    subscription_start_date DATE,
                    subscription_end_date DATE,
                    subscribed_systems JSON,
                    created_at DATETIME(6),
                    updated_at DATETIME(6),
                    PRIMARY KEY (id),
                    UNIQUE KEY UK_company_tenant_org_id (org_id),
                    KEY IDX_company_tenant_contact_email (contact_email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """).executeUpdate();

                    Number columnCount = (Number) subscriptionEntityManager.createNativeQuery("""
                        SELECT COUNT(*)
                        FROM information_schema.columns
                        WHERE table_schema = DATABASE()
                          AND table_name = 'company_tenant'
                          AND column_name = 'plan_type'
                        """)
                        .getSingleResult();

                    if (columnCount.intValue() == 0) {
                    subscriptionEntityManager.createNativeQuery(
                        "ALTER TABLE company_tenant ADD COLUMN plan_type VARCHAR(50)"
                    ).executeUpdate();
                    }

            subscriptionEntityManager.createNativeQuery(
                    "UPDATE company_tenant SET plan_type = 'TRIAL' WHERE plan_type IS NULL OR plan_type = ''"
            ).executeUpdate();
        });
    }
    
    private void createPermissionsIfNotExist() {
        String[] resources = {"product", "inventory", "order", "warehouse", "supplier", "user", "report"};
        String[] actions = {"create", "read", "update", "delete"};
        
        for (String resource : resources) {
            for (String action : actions) {
                String permissionName = resource + ":" + action;
                if (!permissionRepository.existsByName(permissionName)) {
                    Permission permission = new Permission();
                    permission.setName(permissionName);
                    permission.setResource(resource);
                    permission.setAction(action);
                    permission.setDescription("Permission to " + action + " " + resource);
                    permissionRepository.save(permission);
                }
            }
        }
    }
    
    private void createRolesIfNotExist() {
        // Super Admin - Full access
        if (!roleRepository.existsByName(RoleName.ROLE_SUPER_ADMIN)) {
            Role superAdmin = new Role();
            superAdmin.setName(RoleName.ROLE_SUPER_ADMIN);
            superAdmin.setDescription("System administrator with full access");
            superAdmin.setPermissions(new HashSet<>(permissionRepository.findAll()));
            roleRepository.save(superAdmin);
        }
        
        // Org Admin - Organization level admin
        if (!roleRepository.existsByName(RoleName.ROLE_ORG_ADMIN)) {
            Role orgAdmin = new Role();
            orgAdmin.setName(RoleName.ROLE_ORG_ADMIN);
            orgAdmin.setDescription("Organization administrator");
            orgAdmin.setPermissions(getAllPermissionsExcept("user:delete"));
            roleRepository.save(orgAdmin);
        }
        
        // Manager - Branch/Department manager
        if (!roleRepository.existsByName(RoleName.ROLE_MANAGER)) {
            Role manager = new Role();
            manager.setName(RoleName.ROLE_MANAGER);
            manager.setDescription("Branch or department manager");
            manager.setPermissions(getPermissions(new String[]{
                "product:read", "product:update",
                "inventory:read", "inventory:update",
                "order:read", "order:create", "order:update",
                "warehouse:read",
                "supplier:read",
                "report:read"
            }));
            roleRepository.save(manager);
        }
        
        // Warehouse Staff
        if (!roleRepository.existsByName(RoleName.ROLE_WAREHOUSE_STAFF)) {
            Role warehouseStaff = new Role();
            warehouseStaff.setName(RoleName.ROLE_WAREHOUSE_STAFF);
            warehouseStaff.setDescription("Warehouse operations staff");
            warehouseStaff.setPermissions(getPermissions(new String[]{
                "product:read",
                "inventory:read", "inventory:create", "inventory:update",
                "warehouse:read",
                "order:read", "order:update"
            }));
            roleRepository.save(warehouseStaff);
        }
        
        // Sales Staff
        if (!roleRepository.existsByName(RoleName.ROLE_SALES_STAFF)) {
            Role salesStaff = new Role();
            salesStaff.setName(RoleName.ROLE_SALES_STAFF);
            salesStaff.setDescription("Sales and order management staff");
            salesStaff.setPermissions(getPermissions(new String[]{
                "product:read",
                "inventory:read",
                "order:read", "order:create", "order:update"
            }));
            roleRepository.save(salesStaff);
        }
        
        // Procurement
        if (!roleRepository.existsByName(RoleName.ROLE_PROCUREMENT)) {
            Role procurement = new Role();
            procurement.setName(RoleName.ROLE_PROCUREMENT);
            procurement.setDescription("Procurement and supplier management");
            procurement.setPermissions(getPermissions(new String[]{
                "product:read", "product:create",
                "supplier:read", "supplier:create", "supplier:update",
                "inventory:read",
                "order:read"
            }));
            roleRepository.save(procurement);
        }
        
        // Accountant
        if (!roleRepository.existsByName(RoleName.ROLE_ACCOUNTANT)) {
            Role accountant = new Role();
            accountant.setName(RoleName.ROLE_ACCOUNTANT);
            accountant.setDescription("Financial and reporting access");
            accountant.setPermissions(getPermissions(new String[]{
                "product:read",
                "inventory:read",
                "order:read",
                "supplier:read",
                "report:read"
            }));
            roleRepository.save(accountant);
        }
        
        // Auditor
        if (!roleRepository.existsByName(RoleName.ROLE_AUDITOR)) {
            Role auditor = new Role();
            auditor.setName(RoleName.ROLE_AUDITOR);
            auditor.setDescription("Read-only audit access");
            auditor.setPermissions(getReadOnlyPermissions());
            roleRepository.save(auditor);
        }
        
        // Basic User
        if (!roleRepository.existsByName(RoleName.ROLE_USER)) {
            Role user = new Role();
            user.setName(RoleName.ROLE_USER);
            user.setDescription("Basic user with limited access");
            user.setPermissions(getPermissions(new String[]{
                "product:read",
                "inventory:read",
                "order:read"
            }));
            roleRepository.save(user);
        }
    }
    
    private Set<Permission> getAllPermissionsExcept(String... excludeNames) {
        Set<Permission> permissions = new HashSet<>(permissionRepository.findAll());
        for (String excludeName : excludeNames) {
            permissionRepository.findByName(excludeName)
                    .ifPresent(permissions::remove);
        }
        return permissions;
    }
    
    private Set<Permission> getPermissions(String[] permissionNames) {
        Set<Permission> permissions = new HashSet<>();
        for (String name : permissionNames) {
            permissionRepository.findByName(name)
                    .ifPresent(permissions::add);
        }
        return permissions;
    }
    
    private Set<Permission> getReadOnlyPermissions() {
        return new HashSet<>(permissionRepository.findByAction("read"));
    }
}
