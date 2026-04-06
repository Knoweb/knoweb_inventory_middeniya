import { useEffect, useState, useCallback } from 'react';
import apiClient, { orderService, supplierService, productService, warehouseService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import PurchaseOrdersTable from '../components/PurchaseOrdersTable';
import { ShoppingCart, DollarSign, X, Plus, Package, MessageSquare, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Layers, TrendingUp } from 'lucide-react';

// ── Initial form states ────────────────────────────────────────────────────────
const INIT_PO = {
  supplierId: '',
  warehouseId: '',
  notes: '',
  items: [{ productId: '', productName: '', quantity: '', unitPrice: '' }],
};

const INIT_SO = {
  customerName: '',
  warehouseId: '',
  notes: '',
  items: [{ productId: '', productName: '', quantity: '', unitPrice: '' }],
};

// ── Create Purchase Order Modal ────────────────────────────────────────────────
function CreatePurchaseOrderModal({ suppliers, onClose, onCreated }) {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [availableWarehouses, setAvailableWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const orgId = user.orgId;

    productService.getAll()
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
        const prods = list.map(p => ({
          id: p.id,
          name: p.name || p.productName || p.sku || `Product #${p.id}`,
        }));
        setAvailableProducts(prods);
      })
      .catch(err => console.error('Failed to load products:', err))
      .finally(() => setProductsLoading(false));

    const warehouseFetch = orgId
      ? warehouseService.getByOrganization(orgId)
      : warehouseService.getAll();
    warehouseFetch
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
        setAvailableWarehouses(list.filter(w => w.isActive !== false));
      })
      .catch(err => console.error('Failed to load warehouses:', err))
      .finally(() => setWarehousesLoading(false));
  }, []);

  const [form, setForm] = useState(INIT_PO);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateItem = (idx, field, value) => {
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const handleProductSelect = (idx, productId) => {
    const product = availableProducts.find(p => String(p.id) === String(productId));
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = {
        ...items[idx],
        productId: product ? product.id : '',
        productName: product ? product.name : '',
      };
      return { ...prev, items };
    });
  };

  const addItem = () =>
    setForm(prev => ({ ...prev, items: [...prev.items, { productId: '', productName: '', quantity: '', unitPrice: '' }] }));

  const removeItem = (idx) =>
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const computedTotal = form.items.reduce((sum, it) => {
    const qty = parseFloat(it.quantity) || 0;
    const price = parseFloat(it.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) { setError('Please select a supplier.'); return; }
    if (!form.warehouseId) { setError('Please select a warehouse.'); return; }
    if (form.items.some(it => !it.productId || !it.quantity || !it.unitPrice)) {
      setError('Please fill in all item fields.'); return;
    }
    setSubmitting(true); setError('');
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const payload = {
        supplierId: Number(form.supplierId),
        warehouseId: Number(form.warehouseId),
        orgId: user.orgId ? Number(user.orgId) : null,
        notes: form.notes.trim() || null,
        items: form.items.map(it => ({
          productId: Number(it.productId),
          quantity: parseInt(it.quantity, 10),
          unitPrice: parseFloat(it.unitPrice),
        })),
      };
      await orderService.createPurchaseOrder(payload);
      onCreated('Purchase order created successfully!');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data || 'Failed to create order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">🛒 Create Purchase Order</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Approval Sequence</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Supplier *</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                value={form.supplierId}
                onChange={e => setForm(p => ({ ...p, supplierId: e.target.value }))}
                required
              >
                <option value="">— Select supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Warehouse *</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                value={form.warehouseId}
                onChange={e => setForm(p => ({ ...p, warehouseId: e.target.value }))}
                required
                disabled={warehousesLoading}
              >
                <option value="">
                  {warehousesLoading ? '⏳ Loading Warehouses…' : '— Select warehouse —'}
                </option>
                {availableWarehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name || w.warehouseName || `Warehouse #${w.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory List</label>
              <button type="button" onClick={addItem} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                <Plus size={10} className="inline mr-1" /> Add Line Item
              </button>
            </div>

            <div className="space-y-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2 duration-200">
                  <select
                    className="flex-[2] px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-indigo-400"
                    value={item.productId}
                    onChange={e => handleProductSelect(idx, e.target.value)}
                    required
                    disabled={productsLoading}
                  >
                    <option value="">{productsLoading ? 'Loading…' : '— Product —'}</option>
                    {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 outline-none focus:border-indigo-400" type="number" placeholder="Qty" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} required />
                  <input className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 outline-none focus:border-indigo-400" type="number" placeholder="Price" min="0.01" step="0.01" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} required />
                  <button type="button" onClick={() => removeItem(idx)} disabled={form.items.length === 1} className="p-2 bg-rose-50 text-rose-600 rounded-lg disabled:opacity-30 hover:bg-rose-100 mt-0.5">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-4">Projected Total</span>
                <span className="text-xl font-black text-indigo-600">Rs.{computedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Internal Notes <span className="normal-case opacity-40 font-bold ml-1">(Optional)</span></label>
            <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 min-h-[80px]" placeholder="e.g. Terms for bulk discount applying next month…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          <div className="flex gap-4 justify-end pt-4">
            <button type="button" onClick={onClose} disabled={submitting} className="px-6 py-2.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-10 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:grayscale">
              {submitting ? 'Creating…' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create Sales Order Modal ───────────────────────────────────────────────────
function CreateSalesOrderModal({ onClose, onCreated }) {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [availableWarehouses, setAvailableWarehouses] = useState([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [form, setForm] = useState(INIT_SO);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const orgId = user.orgId;

    productService.getAll()
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
        const prods = list.map(p => ({
          id: p.id,
          name: p.name || p.productName || p.sku || `Product #${p.id}`,
        }));
        setAvailableProducts(prods);
      })
      .catch(err => console.error('Failed to load products:', err))
      .finally(() => setProductsLoading(false));

    const warehouseFetch = orgId
      ? warehouseService.getByOrganization(orgId)
      : warehouseService.getAll();
    warehouseFetch
      .then(res => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
        setAvailableWarehouses(list.filter(w => w.isActive !== false));
      })
      .catch(err => console.error('Failed to load warehouses:', err))
      .finally(() => setWarehousesLoading(false));
  }, []);

  const updateItem = (idx, field, value) => {
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const handleProductSelect = (idx, productId) => {
    const product = availableProducts.find(p => String(p.id) === String(productId));
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = {
        ...items[idx],
        productId: product ? product.id : '',
        productName: product ? product.name : '',
      };
      return { ...prev, items };
    });
  };

  const addItem = () =>
    setForm(prev => ({ ...prev, items: [...prev.items, { productId: '', productName: '', quantity: '', unitPrice: '' }] }));

  const removeItem = (idx) =>
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const computedTotal = form.items.reduce((sum, it) => {
    const qty = parseFloat(it.quantity) || 0;
    const price = parseFloat(it.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) { setError('Please enter a customer name.'); return; }
    if (!form.warehouseId) { setError('Please select a warehouse.'); return; }
    if (form.items.some(it => !it.productId || !it.quantity || !it.unitPrice)) {
      setError('Please fill in all item fields.'); return;
    }
    setSubmitting(true); setError('');
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const payload = {
        customerName: form.customerName.trim(),
        warehouseId: Number(form.warehouseId),
        orgId: user.orgId ? Number(user.orgId) : null,
        notes: form.notes.trim() || null,
        totalAmount: computedTotal,
        items: form.items.map(it => ({
          productId: Number(it.productId),
          quantity: parseInt(it.quantity, 10),
          unitPrice: parseFloat(it.unitPrice),
        })),
      };
      await orderService.createSalesOrder(payload);
      onCreated('Sales order created successfully!');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data || 'Failed to create sales order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-emerald-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">💰 Create Sales Order</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Customer Transaction</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer Entity *</label>
              <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. Acme Corp Overseas" value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} required />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Source Warehouse *</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all"
                value={form.warehouseId}
                onChange={e => setForm(p => ({ ...p, warehouseId: e.target.value }))}
                required
                disabled={warehousesLoading}
              >
                <option value="">{warehousesLoading ? '⏳ Loading…' : '— Select warehouse —'}</option>
                {availableWarehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name || w.warehouseName || `WH-${w.id}`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales Line Items</label>
              <button type="button" onClick={addItem} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors">
                <Plus size={10} className="inline mr-1" /> Add Line Item
              </button>
            </div>

            <div className="space-y-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2 duration-200">
                  <select
                    className="flex-[2] px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-emerald-400"
                    value={item.productId}
                    onChange={e => handleProductSelect(idx, e.target.value)}
                    required
                    disabled={productsLoading}
                  >
                    <option value="">{productsLoading ? 'Loading…' : '— Product —'}</option>
                    {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 outline-none focus:border-emerald-400" type="number" placeholder="Qty" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} required />
                  <input className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 outline-none focus:border-emerald-400" type="number" placeholder="Price" min="0.01" step="0.01" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} required />
                  <button type="button" onClick={() => removeItem(idx)} disabled={form.items.length === 1} className="p-2 bg-rose-50 text-rose-600 rounded-lg disabled:opacity-30 hover:bg-rose-100 mt-0.5">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em] mr-4">Settlement Value</span>
                <span className="text-xl font-black text-emerald-600">Rs.{computedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Memo / Notes</label>
            <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 min-h-[80px]" placeholder="e.g. Special packaging instructions or discount context…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          <div className="flex gap-4 justify-end pt-4">
            <button type="button" onClick={onClose} disabled={submitting} className="px-6 py-2.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-10 py-2.5 bg-emerald-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:grayscale">
              {submitting ? 'Creating…' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Return Purchase Order Modal ───────────────────────────────────────────────
function ReturnOrderModal({ order, products, onClose, onReturned }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  
  // Track quantities for each item being returned (initially full qty)
  const [returnQtys, setReturnQtys] = useState(() => {
    const qtys = {};
    order.items?.forEach(it => {
      qtys[it.id] = it.quantity || 0;
    });
    return qtys;
  });

  const getProductName = (id) => {
    const p = products.find(p => String(p.id) === String(id));
    return p ? p.name : `Product #${id}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError('Please provide a reason for the return.'); return; }
    
    // Check if at least one item has a return qty > 0
    const totalReturnQty = Object.values(returnQtys).reduce((sum, q) => sum + Number(q), 0);
    if (totalReturnQty <= 0) {
      setError('Please specify at least one item quantity to return.');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      // We send back the quantities map and the reason
      const payload = {
        reason: reason.trim(),
        items: Object.entries(returnQtys).map(([itemId, qty]) => ({
          itemId: Number(itemId),
          quantity: Number(qty)
        }))
      };
      
      await apiClient.patch(`/api/orders/purchase/${order.id}/return`, payload);
      onReturned('Return processed & inventory updated.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process return.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-purple-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">↩️ Return Purchase Order</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: #PO-{String(order.id).padStart(3, '0')}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Items to Return</label>
            <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
              {order.items?.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-700 truncate">{getProductName(item.productId)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Original Qty: {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Return:</span>
                    <input 
                      type="number" 
                      max={item.quantity} 
                      min="0"
                      className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                      value={returnQtys[item.id] || 0}
                      onChange={(e) => setReturnQtys(prev => ({...prev, [item.id]: e.target.value}))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason for Return *</label>
            <textarea 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-purple-400 min-h-[80px]" 
              placeholder="e.g. Expired on arrival, Physical damage to packaging..." 
              value={reason} 
              onChange={e => setReason(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-4 justify-end pt-4">
            <button type="button" onClick={onClose} disabled={submitting} className="px-6 py-2.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-10 py-2.5 bg-purple-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all active:scale-95 disabled:grayscale">
              {submitting ? 'Processing...' : 'Submit Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Orders Page ───────────────────────────────────────────────────────────
function Orders() {
  const { confirm } = useNotification();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('purchase');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [showCreateSO, setShowCreateSO] = useState(false);
  const [showReturnPO, setShowReturnPO] = useState(null); // stores the order to return
  const [viewOrder, setViewOrder] = useState(null);

  const getProductName = (productId) => {
    const p = products.find(p => String(p.id) === String(productId));
    return p ? p.name : `Product #${productId}`;
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setActionError('');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const orgId = user.orgId;

    try {
      const [purchaseRes, salesRes, suppliersRes, productsRes, warehousesRes] = await Promise.allSettled([
        orderService.getPurchaseOrders(),
        orderService.getSalesOrders(),
        orgId ? supplierService.getByOrganization(orgId) : supplierService.getAll(),
        productService.getAll(),
        orgId ? warehouseService.getByOrganization(orgId) : warehouseService.getAll(),
      ]);
      if (purchaseRes.status === 'fulfilled') {
        const data = purchaseRes.value.data;
        setPurchaseOrders(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
      }
      if (salesRes.status === 'fulfilled') {
        const data = salesRes.value.data;
        setSalesOrders(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
      }
      if (warehousesRes.status === 'fulfilled') {
        const data = warehousesRes.value.data;
        setWarehouses(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
      }
      if (suppliersRes.status === 'fulfilled') {
        const data = suppliersRes.value.data;
        const sList = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
        setSuppliers(sList.map((s) => ({
          id: s.id,
          name: s.name || s.supplierName || s.companyName || `Supplier #${s.id}`,
        })));
      }
      if (productsRes.status === 'fulfilled') {
        const data = productsRes.value.data;
        const pList = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
        setProducts(pList.map((p) => ({
          id: p.id,
          name: p.name || p.productName || p.sku || `Product #${p.id}`,
        })));
      }
    } catch (err) {
      setActionError('Failed to load orders. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const showSuccess = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 3500);
  };

  const handleApprove = async (orderId) => {
    const isConfirmed = await confirm({
      title: 'Approve Purchase Order',
      message: 'This will authorize the procurement protocol for this order. Continue?',
      type: 'info',
      confirmLabel: 'Approve',
      cancelLabel: 'Cancel'
    });
    if (!isConfirmed) return;
    try {
      await apiClient.patch(`/api/orders/purchase/${orderId}/approve`);
      showSuccess(`Order approved.`);
      fetchOrders();
    } catch (e) { setActionError(e.response?.data?.error || 'Failed to approve order.'); }
  };

  const handleReceive = async (orderId) => {
    const isConfirmed = await confirm({
      title: 'Inventory Reception',
      message: 'Confirming physical receipt of assets. This will update available inventory levels. Proceed?',
      type: 'info',
      confirmLabel: 'Mark Received',
      cancelLabel: 'Cancel'
    });
    if (!isConfirmed) return;
    try {
      await apiClient.patch(`/api/orders/purchase/${orderId}/receive`);
      showSuccess(`Order marked as received.`);
      fetchOrders();
    } catch (e) { setActionError(e.response?.data?.error || 'Failed to mark order as received.'); }
  };

  const handleReturnAction = (orderId, reason) => {
    // This is called from the table directly by clicking the button
    const order = purchaseOrders.find(o => o.id === orderId);
    if (order) setShowReturnPO(order);
  };

  const handleReturn = async (orderId, payload) => {
    // This is called from the ReturnOrderModal
    try {
      await apiClient.patch(`/api/orders/purchase/${orderId}/return`, payload);
      showSuccess(`Order returned & stock adjusted.`);
      fetchOrders();
    } catch (e) { setActionError(e.response?.data?.error || 'Failed to return order.'); }
  };

  const handleCancel = async (orderId) => {
    const isConfirmed = await confirm({
      title: 'Terminate Order',
      message: 'This will irreversibly cancel the procurement lifecycle for this record. Confirm termination?',
      type: 'danger',
      confirmLabel: 'Cancel Order',
      cancelLabel: 'Retain'
    });
    if (!isConfirmed) return;
    try {
      await apiClient.patch(`/api/orders/purchase/${orderId}/cancel`);
      showSuccess(`Order cancelled.`);
      fetchOrders();
    } catch (e) { setActionError(e.response?.data?.error || 'Failed to cancel order.'); }
  };

  const getWarehouseName = (id) => {
    const w = warehouses.find(w => String(w.id) === String(id));
    return w ? (w.name || w.warehouseName) : `WH-${id}`;
  };

  const handleView = (order) => {
    setViewOrder(order);
  };

  const handleComplete = async (orderId) => {
    const isConfirmed = await confirm({
      title: 'Order Fulfillment',
      message: 'Completing this sales order will automatically deduct stock from the source warehouse. Finalize transaction?',
      type: 'info',
      confirmLabel: 'Complete Order',
      cancelLabel: 'Cancel'
    });
    if (!isConfirmed) return;
    try {
      await orderService.completeSalesOrder(orderId);
      showSuccess(`Sales Order fulfilled — stock updated ✅`);
      fetchOrders();
    } catch (e) {
      setActionError(e.response?.data?.error || 'Failed to complete order. Check stock availability.');
    }
  };

  return (
    <div className="space-y-6">
      {/* View Detail Modal Integration */}
      {viewOrder && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-indigo-600 px-8 py-8 text-white">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <ShoppingCart size={32} />
                  Order Details
                </h2>
                <button onClick={() => setViewOrder(null)} className="text-white/60 hover:text-white transition-colors"><X size={28} /></button>
              </div>
              <div className="mt-4 flex gap-4 items-center">
                <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full border border-white/20 shadow-sm">Ref ID: #PO-{String(viewOrder.id).padStart(3, '0')}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Created: {new Date(viewOrder.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Current Lifecycle</label>
                  {(() => {
                    const s = viewOrder.status;
                    const cfg = {
                      PENDING: { bg: 'bg-amber-100', color: 'text-amber-700', label: '⏳ Pending' },
                      APPROVED: { bg: 'bg-blue-100', color: 'text-blue-700', label: '✔ Approved' },
                      RECEIVED: { bg: 'bg-emerald-100', color: 'text-emerald-700', label: '📦 Received' },
                      CANCELLED: { bg: 'bg-rose-100', color: 'text-rose-700', label: '✕ Cancelled' },
                      RETURNED: { bg: 'bg-purple-100', color: 'text-purple-700', label: '↩ Returned' },
                    }[s] || { bg: 'bg-slate-100', color: 'text-slate-700', label: s };
                    return <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>;
                  })()}
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contract Valuation</label>
                  <div className="text-xl font-black text-slate-800 tracking-tight">Rs.{Number(viewOrder.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="p-3 bg-white rounded-lg shadow-sm text-indigo-500"><Layers size={20} /></div>
                  <div className="flex-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Resource Composition</span>
                    <span className="text-sm font-bold text-slate-700">{viewOrder.items?.length ?? 0} Distinct Line Items</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Manifest Breakdown</label>
                <div className="rounded-xl border border-slate-100 overflow-hidden text-xs">
                  <div className="bg-slate-50 p-3 grid grid-cols-3 gap-2 font-black text-slate-500 uppercase tracking-tighter shadow-inner">
                    <span>Product</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Settlement</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {viewOrder.items?.map((item, i) => (
                      <div key={i} className="p-3 grid grid-cols-3 gap-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                        <span className="truncate">{getProductName(item.productId)}</span>
                        <span className="text-center">{item.quantity}</span>
                        <span className="text-right text-indigo-600">Rs.{Number(item.unitPrice).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setViewOrder(null)} className="px-8 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl shadow-lg shadow-slate-200 hover:bg-black transition-all active:scale-95">Dismiss Detail</button>
            </div>
          </div>
        </div>
      )}

      {showCreatePO && <CreatePurchaseOrderModal suppliers={suppliers} onClose={() => setShowCreatePO(false)} onCreated={(msg) => { showSuccess(msg); fetchOrders(); }} />}
      {showCreateSO && <CreateSalesOrderModal onClose={() => setShowCreateSO(false)} onCreated={(msg) => { showSuccess(msg); fetchOrders(); }} />}
      {showReturnPO && <ReturnOrderModal order={showReturnPO} products={products} onClose={() => setShowReturnPO(null)} onReturned={(msg) => { showSuccess(msg); fetchOrders(); }} />}

      <header className="flex justify-between items-end border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Lifecycle</h1>
          <p className="text-sm font-medium text-slate-500 mt-1 italic tracking-tight">Manage supply chain procurement and customer fulfillment pipelines</p>
        </div>
      </header>

      {/* Notifications */}
      <div className="space-y-3">
        {actionSuccess && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <span className="font-bold text-sm">{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess('')}><X size={16} /></button>
          </div>
        )}
        {actionError && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-2xl flex items-center justify-between shadow-sm animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-500" />
              <span className="font-bold text-sm tracking-tight">{actionError}</span>
            </div>
            <button onClick={() => setActionError('')}><X size={16} /></button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-50 bg-slate-50/20 flex flex-wrap items-center justify-between gap-6">
          <div className="flex gap-1.5 p-1.5 bg-slate-100/60 rounded-2xl shadow-inner">
            <button onClick={() => setActiveTab('purchase')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2.5 transition-all ${activeTab === 'purchase' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>
              <ShoppingCart size={16} /> Purchase Order
              <span className={`ml-1 text-[9px] px-2 py-0.5 rounded-full font-black ${activeTab === 'purchase' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>{purchaseOrders.length}</span>
            </button>
            <button onClick={() => setActiveTab('sales')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2.5 transition-all ${activeTab === 'sales' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}>
              <TrendingUp size={16} /> Fulfillment
              <span className={`ml-1 text-[9px] px-2 py-0.5 rounded-full font-black ${activeTab === 'sales' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>{salesOrders.length}</span>
            </button>
          </div>

          <div>
            {activeTab === 'purchase' && (
              <button
                id="create-purchase-order-btn"
                onClick={() => setShowCreatePO(true)}
                className="px-8 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 shadow-[0_8px_30px_rgb(99,102,241,0.2)]"
              >
                <Plus size={18} /> New PO manifest
              </button>
            )}

            {activeTab === 'sales' && (
              <button
                id="create-sales-order-btn"
                onClick={() => setShowCreateSO(true)}
                className="px-8 py-3 bg-emerald-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2 shadow-[0_8px_30px_rgb(16,185,129,0.2)]"
              >
                <Plus size={18} /> New Sales Order
              </button>
            )}
          </div>
        </div>

        <div className="p-6 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-slate-300">
              <RefreshCw size={40} className="animate-spin mb-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synching Ledger...</span>
            </div>
          ) : activeTab === 'purchase' ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
              <PurchaseOrdersTable
                orders={purchaseOrders}
                suppliers={suppliers}
                products={products}
                warehouses={warehouses}
                onView={handleView}
                onApprove={handleApprove}
                onReceive={handleReceive}
                onCancel={handleCancel}
                onReturn={handleReturnAction}
              />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Reference</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Entity</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin Logic</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valuation</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {salesOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-20 text-center text-slate-300 italic text-sm">No sales records available in this node.</td>
                      </tr>
                    ) : (
                      salesOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 text-center"><span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded shadow-inner tracking-widest font-mono">#SO-{String(order.id).padStart(3, '0')}</span></td>
                          <td className="px-6 py-4"><span className="text-sm font-black text-slate-800">{order.customerName}</span></td>
                          <td className="px-6 py-4 font-bold text-slate-400 text-xs italic">{getWarehouseName(order.warehouseId)}</td>
                          <td className="px-6 py-4 text-sm font-black text-slate-900 tracking-tighter">Rs.{(order.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                              {order.status === 'COMPLETED' ? '✅ Fulfilled' : '⏳ Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-black text-slate-300 uppercase italic tracking-tighter">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {order.status !== 'COMPLETED' && (
                                <button onClick={() => handleComplete(order.id)} className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-50 transition-all flex items-center gap-2">
                                  <CheckCircle2 size={12} /> Mark Fulfilled
                                </button>
                              )}
                              <button className="p-2 bg-slate-100 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all" title="View Detail"><MessageSquare size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Orders;
