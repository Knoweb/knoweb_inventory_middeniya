import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Attach JWT token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('knoweb_token');
    const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('tenantid');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Extract values case-insensitively
    const effectiveOrgId = user.orgId || user.orgid;
    const effectiveTenantId = tenantId || user.tenantId || user.tenantid;
    const effectiveIndustryType = user.industryType || user.industrytype;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (effectiveTenantId) {
      config.headers['X-Tenant-ID'] = effectiveTenantId;
    }
    if (effectiveOrgId) {
      config.headers['X-Org-ID'] = effectiveOrgId;
    }
    if (effectiveIndustryType) {
      config.headers['X-Industry-Type'] = effectiveIndustryType;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle errors and 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalError = error;
    let userFriendlyMessage = "System Protocol Synchronization Failure. Please verify your connection.";

    if (error.response) {
      // Handle 401 Unauthorized - Clear localStorage and redirect to login
      if (error.response.status === 401) {
        localStorage.clear();
        const HOST = window.location.hostname;
        const PROTOCOL = window.location.protocol;
        const IS_LOCAL = HOST === 'localhost' || HOST === '127.0.0.1';
        const mainDashboardUrl = `${PROTOCOL}//${HOST}:${IS_LOCAL ? '5173' : '3000'}`;
        window.location.href = `${mainDashboardUrl}/login`;
        return Promise.reject(error);
      }

      // Backend returned a non-2xx response
      const serverError = error.response.data;

      if (serverError && typeof serverError === 'object') {
        userFriendlyMessage = serverError.message || serverError.error || userFriendlyMessage;

        if (serverError.protocol) {
          originalError.protocol = serverError.protocol;
        }
      }
    } else if (error.request) {
      userFriendlyMessage = "Network Infrastructure Offline. Backend services are unreachable.";
    }

    originalError.userMessage = userFriendlyMessage;
    return Promise.reject(originalError);
  }
);

// Auth Service (identity-service)
export const authService = {
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  register: (userData) => apiClient.post('/api/auth/register', userData),
  logout: () => apiClient.post('/api/auth/logout'),
  refreshToken: (refreshToken) => apiClient.post('/api/auth/refresh', { refreshToken }),
  getCurrentUser: () => apiClient.get('/api/auth/me'),
};

export const productService = {
  getAll: () => apiClient.get('/api/products'),
  getByOrganization: (orgId) => apiClient.get(`/api/products/organization/${orgId}`),
  getById: (id) => apiClient.get(`/api/products/${id}`),
  create: (product) => apiClient.post('/api/products', product),
  update: (id, product) => apiClient.put(`/api/products/${id}`, product),
  delete: (id) => apiClient.delete(`/api/products/${id}`),
  search: (name) => apiClient.get(`/api/products/search?name=${name}`),
  registerWithStock: (data) => apiClient.post('/api/products/with-stock', data),
  getNextSku: (orgId) => apiClient.get(`/api/products/next-sku/${orgId}`),
};

export const inventoryService = {
  getAllStocks: () => apiClient.get('/api/inventory/stocks'),
  getStockById: (id) => apiClient.get(`/api/inventory/stocks/${id}`),
  getStocksByProduct: (productId) => apiClient.get(`/api/inventory/stocks/product/${productId}`),
  updateStock: (id, stock) => apiClient.put(`/api/inventory/stocks/${id}`, stock),
  getAllTransactions: () => apiClient.get('/api/inventory/transactions'),
  createTransaction: (transaction) => apiClient.post('/api/inventory/transactions', transaction),
};

export const orderService = {
  getPurchaseOrders: () => apiClient.get('/api/orders/purchase'),
  createPurchaseOrder: (order) => apiClient.post('/api/orders/purchase', order),
  getSalesOrders: () => apiClient.get('/api/orders/sales'),
  createSalesOrder: (order) => apiClient.post('/api/orders/sales', order),
  completeSalesOrder: (id) => apiClient.patch(`/api/orders/sales/${id}/complete`),
};

export const warehouseService = {
  getAll: () => apiClient.get('/api/warehouses'),
  getById: (id) => apiClient.get(`/api/warehouses/${id}`),
  getByOrganization: (orgId) => apiClient.get(`/api/warehouses/organization/${orgId}`),
  getBranches: (orgId) => apiClient.get('/api/warehouses/branches', { params: { orgId } }),
  create: (warehouse) => apiClient.post('/api/warehouses', warehouse),
  update: (id, warehouse) => apiClient.put(`/api/warehouses/${id}`, warehouse),
  delete: (id) => apiClient.delete(`/api/warehouses/${id}`),
};

export const supplierService = {
  getAll: () => apiClient.get('/api/suppliers'),
  getById: (id) => apiClient.get(`/api/suppliers/${id}`),
  getByOrganization: (orgId) => apiClient.get(`/api/suppliers/organization/${orgId}`),
  create: (supplier) => apiClient.post('/api/suppliers', supplier),
  update: (id, supplier) => apiClient.put(`/api/suppliers/${id}`, supplier),
  delete: (id) => apiClient.delete(`/api/suppliers/${id}`),
};

export const userService = {
  getAll: () => apiClient.get('/api/users'),
  register: (user) => apiClient.post('/api/users/register', user),
};

// Identity User Service (identity-service /api/users)
export const identityUserService = {
  getAll: () => apiClient.get('/api/users'),
  getById: (id) => apiClient.get(`/api/users/${id}`),
  getByUsername: (username) => apiClient.get(`/api/users/username/${username}`),
  getByOrganization: (orgId) => apiClient.get(`/api/users/organization/${orgId}`),
  getByBranch: (branchId) => apiClient.get(`/api/users/branch/${branchId}`),
  update: (id, user) => apiClient.put(`/api/users/${id}`, user),
  delete: (id) => apiClient.delete(`/api/users/${id}`),
};

// Branch Service (user-service)
export const branchService = {
  getAll: () => apiClient.get('/api/branches'),
  getById: (id) => apiClient.get(`/api/branches/${id}`),
  getByOrganization: (orgId) => apiClient.get(`/api/branches/organization/${orgId}`),
  create: (branch) => apiClient.post('/api/branches', branch),
  update: (id, branch) => apiClient.put(`/api/branches/${id}`, branch),
  delete: (id) => apiClient.delete(`/api/branches/${id}`),
};

export const notificationService = {
  getAll: () => apiClient.get('/api/notifications'),
  getUnread: () => apiClient.get('/api/notifications/unread'),
  create: (notification) => apiClient.post('/api/notifications', notification),
  markAsRead: (id) => apiClient.put(`/api/notifications/${id}/read`),
  delete: (id) => apiClient.delete(`/api/notifications/${id}`),
};

// Industry-specific services
export const pharmacyService = {
  create: (pharmacyProduct) => apiClient.post('/api/pharmacy', pharmacyProduct),
  update: (id, pharmacyProduct) => apiClient.put(`/api/pharmacy/${id}`, pharmacyProduct),
  getByProductId: (productId) => apiClient.get(`/api/pharmacy/product/${productId}`),
  getByBatch: (batchNumber) => apiClient.get(`/api/pharmacy/batch/${batchNumber}`),
  getExpiring: (days) => apiClient.get(`/api/pharmacy/expiring?days=${days}`),
  getExpiringRange: (startDate, endDate) => apiClient.get(`/api/pharmacy/expiring-range?startDate=${startDate}&endDate=${endDate}`),
  getExpired: () => apiClient.get('/api/pharmacy/expired'),
  getPrescription: (required) => apiClient.get(`/api/pharmacy/prescription?required=${required}`),
  getControlled: (schedule) => apiClient.get(`/api/pharmacy/controlled?schedule=${schedule}`),
  getByIngredient: (ingredient) => apiClient.get(`/api/pharmacy/ingredient/${ingredient}`),
  getRefrigerated: () => apiClient.get('/api/pharmacy/refrigerated'),
  getRecalled: (orgId) => apiClient.get(`/api/pharmacy/recalled${orgId ? `?orgId=${orgId}` : ''}`),
  recall: (id, reason) => apiClient.post(`/api/pharmacy/${id}/recall`, { reason }),
  updateExpiryStatuses: () => apiClient.post('/api/pharmacy/update-expiry-statuses'),
  getByOrganization: (orgId) => apiClient.get(`/api/pharmacy/organization/${orgId}`),
  getStats: (orgId) => apiClient.get(`/api/pharmacy/stats/${orgId}`),
  sync: () => apiClient.post('/api/pharmacy/sync'),
  delete: (id) => apiClient.delete(`/api/pharmacy/${id}`),
};

export const retailService = {
  create: (retailProduct) => apiClient.post('/api/retail', retailProduct),
  update: (id, retailProduct) => apiClient.put(`/api/retail/${id}`, retailProduct),
  getByProductId: (productId) => apiClient.get(`/api/retail/product/${productId}`),
  getVariants: (parentSku) => apiClient.get(`/api/retail/variants/${parentSku}`),
  getVariant: (parentSku, color, size) => apiClient.get(`/api/retail/variant?parentSku=${parentSku}&color=${color}&size=${size}`),
  getAvailableSizes: (parentSku) => apiClient.get(`/api/retail/${parentSku}/sizes`),
  getAvailableColors: (parentSku) => apiClient.get(`/api/retail/${parentSku}/colors`),
  getBySeason: (season, year) => apiClient.get(`/api/retail/season/${season}${year ? `?year=${year}` : ''}`),
  getByCollection: (collectionName) => apiClient.get(`/api/retail/collection/${collectionName}`),
  getClearance: () => apiClient.get('/api/retail/clearance'),
  getOnSale: () => apiClient.get('/api/retail/on-sale'),
  getPromotions: () => apiClient.get('/api/retail/promotions'),
  applySale: (id, saleData) => apiClient.post(`/api/retail/${id}/sale`, saleData),
  applyPromotion: (id, promotionData) => apiClient.post(`/api/retail/${id}/promotion`, promotionData),
  markAsClearance: (data) => apiClient.post('/api/retail/clearance', data),
  getFeatured: () => apiClient.get('/api/retail/featured'),
  getNewArrivals: () => apiClient.get('/api/retail/new-arrivals'),
  getBestsellers: () => apiClient.get('/api/retail/bestsellers'),
  getByColorFamily: (colorFamily) => apiClient.get(`/api/retail/color-family/${colorFamily}`),
  getByMaterial: (material) => apiClient.get(`/api/retail/material/${material}`),
  getByOrganization: (orgId) => apiClient.get(`/api/retail/organization/${orgId}`),
  delete: (id) => apiClient.delete(`/api/retail/${id}`),
};

export const manufacturingService = {
  create: (manufacturingProduct) => apiClient.post('/api/manufacturing', manufacturingProduct),
  update: (id, manufacturingProduct) => apiClient.put(`/api/manufacturing/${id}`, manufacturingProduct),
  getByProductId: (productId) => apiClient.get(`/api/manufacturing/product/${productId}`),
  getByType: (productType, orgId) => apiClient.get(`/api/manufacturing/type/${productType}${orgId ? `?orgId=${orgId}` : ''}`),
  getRawMaterials: (orgId) => apiClient.get(`/api/manufacturing/raw-materials${orgId ? `?orgId=${orgId}` : ''}`),
  getWip: (orgId) => apiClient.get(`/api/manufacturing/wip${orgId ? `?orgId=${orgId}` : ''}`),
  getFinishedGoods: (orgId) => apiClient.get(`/api/manufacturing/finished-goods${orgId ? `?orgId=${orgId}` : ''}`),
  getActiveWip: () => apiClient.get('/api/manufacturing/wip/active'),
  getOverdueWip: () => apiClient.get('/api/manufacturing/wip/overdue'),
  getWipByStatus: (status) => apiClient.get(`/api/manufacturing/wip/status/${status}`),
  updateWipStatus: (id, status) => apiClient.post(`/api/manufacturing/${id}/wip-status`, { status }),
  getByWorkOrder: (workOrderNumber) => apiClient.get(`/api/manufacturing/work-order/${workOrderNumber}`),
  getByProductionLine: (productionLine) => apiClient.get(`/api/manufacturing/production-line/${productionLine}`),
  getBomComponents: (parentProductId) => apiClient.get(`/api/manufacturing/bom/${parentProductId}`),
  getByBomLevel: (level) => apiClient.get(`/api/manufacturing/bom-level/${level}`),
  getByMaterialCode: (materialCode) => apiClient.get(`/api/manufacturing/material/${materialCode}`),
  getByLotNumber: (lotNumber) => apiClient.get(`/api/manufacturing/lot/${lotNumber}`),
  getPendingInspection: () => apiClient.get('/api/manufacturing/inspection/pending'),
  updateInspection: (id, inspectionData) => apiClient.post(`/api/manufacturing/${id}/inspection`, inspectionData),
  getReworkRequired: () => apiClient.get('/api/manufacturing/rework/required'),
  getExcessiveRework: (maxRework) => apiClient.get(`/api/manufacturing/rework/excessive?maxRework=${maxRework}`),
  getByOrganization: (orgId) => apiClient.get(`/api/manufacturing/organization/${orgId}`),
  delete: (id) => apiClient.delete(`/api/manufacturing/${id}`),
};

export const industryConfigService = {
  getTypes: () => apiClient.get('/api/industry-config/types'),
  getFeatures: (industryType) => apiClient.get(`/api/industry-config/features/${industryType}`),
  checkFeature: (industry, feature) => apiClient.get(`/api/industry-config/check?industry=${industry}&feature=${feature}`),
  getAttributes: (productId, industry) => apiClient.get(`/api/industry-config/attributes/${productId}?industry=${industry}`),
  deleteAttributes: (productId, industry) => apiClient.delete(`/api/industry-config/attributes/${productId}?industry=${industry}`),
  recommend: (productAttributes) => apiClient.post('/api/industry-config/recommend', productAttributes),
  getSummary: () => apiClient.get('/api/industry-config/summary'),
};

// Catalog Service
export const catalogService = {
  createProduct: (product) => apiClient.post('/api/catalog/products', product),
  getAll: () => apiClient.get('/api/catalog/products'),
  getById: (id) => apiClient.get(`/api/catalog/products/${id}`),
  getBySku: (sku) => apiClient.get(`/api/catalog/products/sku/${sku}`),
  getByOrganization: (orgId) => apiClient.get(`/api/catalog/products/organization/${orgId}`),
  getByIndustry: (industryType) => apiClient.get(`/api/catalog/products/industry/${industryType}`),
  getByCategory: (category) => apiClient.get(`/api/catalog/products/category/${category}`),
  search: (query) => apiClient.get(`/api/catalog/products/search?query=${query}`),
  getFeatured: () => apiClient.get('/api/catalog/products/featured'),
};

// Schema Service (catalog-service)
export const schemaService = {
  create: (schema) => apiClient.post('/api/schemas', schema),
  getAll: () => apiClient.get('/api/schemas'),
  getActive: () => apiClient.get('/api/schemas/active'),
  getByIndustry: (industryType) => apiClient.get(`/api/schemas/industry/${industryType}`),
  validate: (data) => apiClient.post('/api/schemas/validate', data),
};

// Analytics Service (reporting-service)
export const analyticsService = {
  getInventoryAnalytics: (orgId) => apiClient.get(`/api/analytics/inventory/${orgId}`),
  getInventorySummary: (orgId) => apiClient.get(`/api/analytics/inventory/${orgId}/summary`),
  getLowStock: (orgId, threshold) => apiClient.get(`/api/analytics/inventory/${orgId}/low-stock?threshold=${threshold || 10}`),
  getSalesAnalytics: (orgId) => apiClient.get(`/api/analytics/sales/${orgId}`),
  getSalesSummary: (orgId, startDate, endDate) => apiClient.get(`/api/analytics/sales/${orgId}/summary?startDate=${startDate}&endDate=${endDate}`),
  getMonthlySales: (orgId, monthYear) => apiClient.get(`/api/analytics/sales/${orgId}/monthly?monthYear=${monthYear}`),
  getDashboard: (orgId) => apiClient.get(`/api/analytics/dashboard/${orgId}`),
};

// Audit Service (reporting-service)
export const auditService = {
  create: (auditLog) => apiClient.post('/api/audit', auditLog),
  getByUser: (userId) => apiClient.get(`/api/audit/user/${userId}`),
  getByOrganization: (orgId) => apiClient.get(`/api/audit/organization/${orgId}`),
  getByEntity: (entity) => apiClient.get(`/api/audit/entity/${entity}`),
  getByEntityId: (entity, entityId) => apiClient.get(`/api/audit/entity/${entity}/${entityId}`),
  getByDateRange: (orgId, startDate, endDate) => apiClient.get(`/api/audit/organization/${orgId}/range?startDate=${startDate}&endDate=${endDate}`),
  getCritical: () => apiClient.get('/api/audit/critical'),
};

// Stock Ledger Service (inventory-service)
export const ledgerService = {
  getByProduct: (productId) => apiClient.get(`/api/inventory/ledger/product/${productId}`),
  getByWarehouse: (warehouseId) => apiClient.get(`/api/inventory/ledger/warehouse/${warehouseId}`),
  getByProductAndWarehouse: (productId, warehouseId) =>
    apiClient.get(`/api/inventory/ledger/product/${productId}/warehouse/${warehouseId}`),
  getProductValuation: (productId, strategy) =>
    apiClient.get(`/api/inventory/ledger/product/${productId}/valuation?strategy=${strategy || 'FIFO'}`),
  getWarehouseValuation: (warehouseId, strategy) =>
    apiClient.get(`/api/inventory/ledger/warehouse/${warehouseId}/valuation?strategy=${strategy || 'FIFO'}`),
};

// Valuation Service (inventory-service)
export const valuationService = {
  compareMethods: (productId, warehouseId) =>
    apiClient.get(`/api/inventory/valuation/compare/${productId}/warehouse/${warehouseId}`),
  getStrategies: () => apiClient.get('/api/inventory/valuation/strategies'),
};

// Category Service
export const categoryService = {
  getAll: () => apiClient.get('/api/categories'),
  getById: (id) => apiClient.get(`/api/categories/${id}`),
  create: (category) => apiClient.post('/api/categories', category),
  update: (id, category) => apiClient.put(`/api/categories/${id}`, category),
  delete: (id) => apiClient.delete(`/api/categories/${id}`),
};

// Brand Service
export const brandService = {
  getAll: () => apiClient.get('/api/brands'),
  getById: (id) => apiClient.get(`/api/brands/${id}`),
  create: (brand) => apiClient.post('/api/brands', brand),
  update: (id, brand) => apiClient.put(`/api/brands/${id}`, brand),
  delete: (id) => apiClient.delete(`/api/brands/${id}`),
};

export default apiClient;
