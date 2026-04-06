import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, warehouseService, categoryService, brandService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

function UnifiedProductRegistration({ categories: propsCategories, brands: propsBrands, onRefresh }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm } = useNotification();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState(propsCategories || []);
  const [brands, setBrands] = useState(propsBrands || []);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    unit: 'UNIT',
    reorderLevel: '',
    orgId: user?.orgId || null,
    industryType: user?.industryType || 'GENERAL',
    itemType: '',
    genericName: '',
    isPrescriptionRequired: false,
    isRefrigerated: false,
    initialBatch: {
      batchNumber: '',
      expiryDate: '',
      quantity: '',
      purchasePrice: '',
      warehouseId: ''
    }
  });

  const [errors, setErrors] = useState({});

  const fetchDependencies = useCallback(async () => {
    try {
      const promises = [];
      if (user?.orgId) {
        promises.push(warehouseService.getByOrganization(user.orgId).then(res => setWarehouses((res.data || []).filter(w => w.isActive !== false))));
      }

      if (!propsCategories) {
        promises.push(categoryService.getAll().then(res => setCategories(res.data)));
      }
      if (!propsBrands) {
        promises.push(brandService.getAll().then(res => setBrands(res.data)));
      }

      const orgId = user?.orgId || 1;
      promises.push(productService.getNextSku(orgId).then(res => {
        setFormData(prev => ({ ...prev, sku: res.data }));
      }));

      await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
    }
  }, [user?.orgId, propsCategories, propsBrands]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    if (propsCategories) setCategories(propsCategories);
    if (propsBrands) setBrands(propsBrands);
  }, [propsCategories, propsBrands]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('batch_')) {
      const batchField = name.replace('batch_', '');
      setFormData(prev => ({
        ...prev,
        initialBatch: {
          ...prev.initialBatch,
          [batchField]: type === 'number' ? (value ? Number(value) : '') : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.sku) newErrors.sku = 'SKU is required';
    if (!formData.name) newErrors.name = 'Product name is required';

    const isRawMaterial = user?.industryType === 'MANUFACTURING' && formData.itemType === 'RAW_MATERIAL';
    if (!isRawMaterial) {
      if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    }

    if (!formData.category) newErrors.category = 'Category is required';

    if (!formData.initialBatch.warehouseId) newErrors.warehouseId = 'Warehouse is required';
    if (!formData.initialBatch.quantity || formData.initialBatch.quantity <= 0) newErrors.quantity = 'Valid initial quantity is required';
    if (!formData.initialBatch.purchasePrice || formData.initialBatch.purchasePrice <= 0) newErrors.purchasePrice = 'Valid purchase price is required';

    if (user?.industryType === 'PHARMACY' && !formData.genericName) {
      newErrors.genericName = 'Generic name is required for pharmacy';
    }
    if (user?.industryType === 'PHARMACY' && !formData.initialBatch.expiryDate) {
      newErrors['initialBatch.expiryDate'] = 'Expiry date is required for pharmacy products';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const requestData = {
        ...formData,
        price: Number(formData.price),
        reorderLevel: formData.reorderLevel ? Number(formData.reorderLevel) : 10,
        orgId: user.orgId,
        initialBatch: {
          ...formData.initialBatch,
          quantity: Number(formData.initialBatch.quantity),
          purchasePrice: Number(formData.initialBatch.purchasePrice),
          warehouseId: Number(formData.initialBatch.warehouseId)
        }
      };

      const response = await productService.registerWithStock(requestData);
      alert(`Product registered successfully!`);

      if (!onRefresh) {
        try {
          const orgId = user?.orgId || 1;
          const res = await productService.getNextSku(orgId);
          setFormData(prev => ({ ...prev, sku: res.data }));
        } catch (e) {
          console.error('Error fetching next SKU:', e);
        }
      }

      if (onRefresh) {
        onRefresh(response.data);
      } else {
        navigate('/products');
      }
    } catch (error) {
      console.error('Error registering product:', error);
      alert(error.response?.data?.message || 'Failed to register product.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (onRefresh) {
      onRefresh(null);
    } else {
      const isConfirmed = await confirm({
        title: 'Cancel Registration',
        message: 'This will irreversibly purge the current draft data. Confirm session termination?',
        type: 'warning',
        confirmLabel: 'Cancel',
        cancelLabel: 'Continue'
      });
      if (isConfirmed) navigate('/products');
    }
  };

  const isPharmacy = user?.industryType === 'PHARMACY';
  const isManufacturing = user?.industryType === 'MANUFACTURING';

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-800">Register New Product</h2>
          <button className="text-slate-400 hover:text-slate-600 text-3xl leading-none transition-colors" onClick={handleCancel} type="button">×</button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <h3 className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-6 pb-2 border-b border-indigo-50">Product Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600" htmlFor="sku">SKU <span className="text-red-500">*</span></label>
                  <input
                    type="text" id="sku" name="sku"
                    value={formData.sku} onChange={handleChange}
                    placeholder={isManufacturing ? "e.g., MFG-001" : isPharmacy ? "e.g., PHR-001" : "e.g., PRD-001"}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${errors.sku ? 'border-red-500' : 'border-slate-200'}`}
                    disabled={loading}
                  />
                  {errors.sku && <span className="text-[10px] font-bold text-red-500 mt-1 block">{errors.sku}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600" htmlFor="name">Product Name <span className="text-red-500">*</span></label>
                  <input
                    type="text" id="name" name="name"
                    value={formData.name} onChange={handleChange}
                    placeholder={isPharmacy ? "e.g., Aspirin Tablets" : "e.g., Steel Sheet 2mm"}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${errors.name ? 'border-red-500' : 'border-slate-200'}`}
                    disabled={loading}
                  />
                  {errors.name && <span className="text-[10px] font-bold text-red-500 mt-1 block">{errors.name}</span>}
                </div>

                {isPharmacy && (
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600" htmlFor="genericName">Generic Name <span className="text-red-500">*</span></label>
                    <input
                      type="text" id="genericName" name="genericName"
                      value={formData.genericName} onChange={handleChange}
                      placeholder="e.g., Acetylsalicylic Acid"
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${errors.genericName ? 'border-red-500' : 'border-slate-200'}`}
                      disabled={loading}
                    />
                    {errors.genericName && <span className="text-[10px] font-bold text-red-500 mt-1 block">{errors.genericName}</span>}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600" htmlFor="category">Category <span className="text-red-500">*</span></label>
                  <select
                    id="category" name="category"
                    value={formData.category} onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${errors.category ? 'border-red-500' : 'border-slate-200'}`}
                    disabled={loading}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category && <span className="text-[10px] font-bold text-red-500 mt-1 block">{errors.category}</span>}
                </div>

                {user?.industryType === 'MANUFACTURING' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600" htmlFor="itemType">Item Type <span className="text-red-500">*</span></label>
                    <select
                      id="itemType" name="itemType"
                      value={formData.itemType} onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      disabled={loading}
                    >
                      <option value="">Select Type</option>
                      <option value="RAW_MATERIAL">Raw Material</option>
                      <option value="WIP">Work-in-Progress (WIP)</option>
                      <option value="FINISHED_GOOD">Finished Good</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600" htmlFor="brand">Brand</label>
                  <select
                    id="brand" name="brand"
                    value={formData.brand} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={loading}
                  >
                    <option value="">Select Brand</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.name}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600" htmlFor="price">
                    Selling Price (Rs.) {!(user?.industryType === 'MANUFACTURING' && formData.itemType === 'RAW_MATERIAL') && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number" id="price" name="price"
                    value={formData.price} onChange={handleChange}
                    placeholder="0.00" step="0.01" min="0"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${errors.price ? 'border-red-500' : 'border-slate-200'}`}
                    disabled={loading || (user?.industryType === 'MANUFACTURING' && formData.itemType === 'RAW_MATERIAL')}
                  />
                  {errors.price && <span className="text-[10px] font-bold text-red-500 mt-1 block">{errors.price}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600" htmlFor="unit">Unit</label>
                  <select
                    id="unit" name="unit"
                    value={formData.unit} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400" disabled={loading}
                  >
                    <option value="UNIT">Unit</option>
                    <option value="PCS">Pieces</option>
                    <option value="BOX">Box</option>
                    <option value="PACK">Pack</option>
                    <option value="BOTTLE">Bottle</option>
                    <option value="KG">Kilogram</option>
                    <option value="LBS">Pounds</option>
                    <option value="LITER">Liter</option>
                    <option value="GAL">Gallon</option>
                    <option value="Sheet">Sheets</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600" htmlFor="reorderLevel">Reorder Level</label>
                  <input
                    type="number" id="reorderLevel" name="reorderLevel"
                    value={formData.reorderLevel} onChange={handleChange}
                    placeholder="10" min="0"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600" htmlFor="description">Description</label>
                  <textarea
                    id="description" name="description"
                    value={formData.description} onChange={handleChange}
                    placeholder="Product description..." rows="3"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={loading}
                  />
                </div>
              </div>

              {isPharmacy && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox" id="isPrescriptionRequired" name="isPrescriptionRequired"
                      checked={formData.isPrescriptionRequired} onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" disabled={loading}
                    />
                    <label htmlFor="isPrescriptionRequired" className="text-xs font-semibold text-slate-700">Prescription Required</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox" id="isRefrigerated" name="isRefrigerated"
                      checked={formData.isRefrigerated} onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" disabled={loading}
                    />
                    <label htmlFor="isRefrigerated" className="text-xs font-semibold text-slate-700">Refrigerated</label>
                  </div>
                </div>
              )}
            </section>

            <section>
              <h3 className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-6 pb-2 border-b border-indigo-50">Initial Stock & Batch Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600" htmlFor="batch_warehouseId">Warehouse <span className="text-red-500">*</span></label>
                  <select
                    id="batch_warehouseId" name="batch_warehouseId"
                    value={formData.initialBatch.warehouseId} onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${errors.warehouseId ? 'border-red-500' : 'border-slate-200'}`}
                    disabled={loading}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.location}
                      </option>
                    ))}
                  </select>
                  {errors.warehouseId && <span className="text-[10px] font-bold text-red-500 mt-1 block">{errors.warehouseId}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600" htmlFor="batch_batchNumber">Batch Number</label>
                  <input
                    type="text" id="batch_batchNumber" name="batch_batchNumber"
                    value={formData.initialBatch.batchNumber} onChange={handleChange}
                    placeholder={isPharmacy ? "e.g., BATCH-2024-001" : "Optional"}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={loading}
                  />
                </div>

                {isPharmacy && (
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600" htmlFor="batch_expiryDate">Expiry Date</label>
                    <input
                      type="date" id="batch_expiryDate" name="batch_expiryDate"
                      value={formData.initialBatch.expiryDate} onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600" htmlFor="batch_quantity">Initial Quantity <span className="text-red-500">*</span></label>
                  <input
                    type="number" id="batch_quantity" name="batch_quantity"
                    value={formData.initialBatch.quantity} onChange={handleChange}
                    placeholder="0" min="0"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${errors.quantity ? 'border-red-500' : 'border-slate-200'}`}
                    disabled={loading}
                  />
                  {errors.quantity && <span className="text-[10px] font-bold text-red-500 mt-1 block">{errors.quantity}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600" htmlFor="batch_purchasePrice">Purchase Price (Rs.) <span className="text-red-500">*</span></label>
                  <input
                    type="number" id="batch_purchasePrice" name="batch_purchasePrice"
                    value={formData.initialBatch.purchasePrice} onChange={handleChange}
                    placeholder="0.00" step="0.01" min="0"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 ${errors.purchasePrice ? 'border-red-500' : 'border-slate-200'}`}
                    disabled={loading}
                  />
                  {errors.purchasePrice && <span className="text-[10px] font-bold text-red-500 mt-1 block">{errors.purchasePrice}</span>}
                </div>
              </div>

              {formData.price && formData.initialBatch.purchasePrice && (
                <div className="mt-6 p-4 bg-indigo-50 rounded-xl flex items-center justify-between border border-indigo-100 shadow-sm">
                  <strong className="text-xs text-indigo-900">Estimated Profit Margin:</strong>
                  <span className="text-lg font-black text-indigo-700">{((formData.price - formData.initialBatch.purchasePrice) / formData.price * 100).toFixed(2)}%</span>
                </div>
              )}
            </section>

            <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-slate-100">
              <button
                type="button"
                className="px-6 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 rounded-lg bg-indigo-600 text-white font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register Product & Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UnifiedProductRegistration;
