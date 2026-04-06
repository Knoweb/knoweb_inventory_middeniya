import { useEffect, useState } from 'react';
import { warehouseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Eye, Edit, Trash2, Plus, X, Package, MapPin, Layers, Box, GitBranch, RefreshCw, Trash } from 'lucide-react';

function Warehouses() {
  const { user } = useAuth();
  const { showToast, confirm } = useNotification();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [viewWarehouse, setViewWarehouse] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    orgId: user?.orgId || 1,
    branchId: '',
    warehouseType: 'DRY_STORAGE',
    storageCapacity: '',
    isActive: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (user?.orgId) {
      fetchWarehouses();
    }
  }, [user]);

  const fetchWarehouses = async () => {
    try {
      const orgId = user?.orgId || 1;
      const [warehouseRes, branchRes] = await Promise.all([
        warehouseService.getByOrganization(orgId),
        warehouseService.getBranches(orgId)
      ]);
      const wData = warehouseRes.data;
      const bData = branchRes.data;
      setWarehouses(Array.isArray(wData) ? wData : (wData?.content ?? wData?.data ?? []));
      setBranches(Array.isArray(bData) ? bData : (bData?.content ?? bData?.data ?? []));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const warehouseData = { ...formData };
      if (attributes.length > 0) {
        const attributesObj = {};
        attributes.forEach(attr => {
          if (attr.key && attr.value) {
            attributesObj[attr.key] = attr.value;
          }
        });
        warehouseData.attributes = JSON.stringify(attributesObj);
      }

      const payload = { ...warehouseData };
      if (!payload.branchId) payload.branchId = null;

      if (isEditing) {
        await warehouseService.update(editId, payload);
      } else {
        await warehouseService.create(payload);
      }

      setShowModal(false);
      fetchWarehouses();
      resetForm();
    } catch (error) {
      console.error('Error saving warehouse:', error);
    }
  };

  const handleEdit = (warehouse) => {
    let attrs = [];
    try {
      const parsed = typeof warehouse.attributes === 'string'
        ? JSON.parse(warehouse.attributes)
        : (warehouse.warehouseAttributes || {});
      attrs = Object.entries(parsed).map(([key, value]) => ({ key, value }));
    } catch (e) { }

    setFormData({
      name: warehouse.name,
      location: warehouse.location,
      orgId: warehouse.orgId,
      branchId: warehouse.branchId || '',
      warehouseType: warehouse.warehouseType,
      storageCapacity: warehouse.storageCapacity || '',
      isActive: warehouse.isActive
    });
    setAttributes(attrs);
    setIsEditing(true);
    setEditId(warehouse.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Warehouse',
      message: 'This will purge the warehouse from the strategic network. Confirm deletion?',
      type: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    });

    if (isConfirmed) {
      try {
        await warehouseService.delete(id);
        fetchWarehouses();
      } catch (error) {
        console.error('Error deleting warehouse:', error);
        showToast('Error deleting warehouse', 'error');
      }
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const removeAttribute = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index, field, value) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[index][field] = value;
    setAttributes(updatedAttributes);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      orgId: user?.orgId || 1,
      branchId: '',
      warehouseType: 'DRY_STORAGE',
      storageCapacity: '',
      isActive: true
    });
    setIsEditing(false);
    setEditId(null);
    setAttributes([]);
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 text-gray-400">
      <RefreshCw className="animate-spin mb-4" size={32} />
      <p className="text-sm font-medium">Loading warehouses...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Warehouses</h1>
        <button
          onClick={openNewModal}
          className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={16} /> Add New Warehouse
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Branch</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[160px]">Capacity</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Attributes</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {warehouses.map((warehouse) => {
                let attrs = {};
                try {
                  attrs = typeof warehouse.attributes === 'string'
                    ? JSON.parse(warehouse.attributes)
                    : (warehouse.warehouseAttributes || {});
                } catch (e) { }

                const capacity = warehouse.storageCapacity || 1;
                const usage = warehouse.currentUsage || 0;
                const percent = Math.min(Math.round((usage / capacity) * 100), 100);

                return (
                  <tr key={warehouse.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">{warehouse.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{warehouse.location}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500 italic">{warehouse.warehouseType?.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4">
                      {warehouse.branchId ? (
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-black uppercase border border-sky-100">
                          {warehouse.branchName || `Branch #${warehouse.branchId}`}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-400 text-[10px] font-black uppercase border border-slate-100 italic">
                          Main Store
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          <span>{usage} used</span>
                          <span>{warehouse.storageCapacity ? `${warehouse.storageCapacity} max` : '∞'}</span>
                        </div>
                        {warehouse.storageCapacity ? (
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-500 ${percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${percent}%` }} />
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">No limit set</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {Object.keys(attrs).length > 0 ? (
                        <div className="text-[10px] text-slate-500">
                          {Object.entries(attrs).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="line-clamp-1">
                              <span className="font-bold">{key}:</span> {String(value)}
                            </div>
                          ))}
                          {Object.keys(attrs).length > 3 && <div className="text-slate-300">...</div>}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${warehouse.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {warehouse.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setViewWarehouse(warehouse)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View"><Eye size={18} /></button>
                        <button onClick={() => handleEdit(warehouse)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(warehouse.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-800">{isEditing ? 'Edit Warehouse' : 'Add New Warehouse'}</h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="flex items-center text-xs font-bold text-slate-600"><Package size={14} className="mr-1" /> Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Central Medical Store"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center text-xs font-bold text-slate-600"><MapPin size={14} className="mr-1" /> Location</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Colombo North Hub"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center text-xs font-bold text-slate-600"><Layers size={14} className="mr-1" /> Warehouse Type</label>
                  <select
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors"
                    value={formData.warehouseType}
                    onChange={(e) => setFormData({ ...formData, warehouseType: e.target.value })}
                    required
                  >
                    <option value="DRY_STORAGE">Dry Storage</option>
                    <option value="COLD_STORAGE">Cold Storage</option>
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="FINISHED_GOODS">Finished Goods</option>
                    <option value="TRANSIT">Transit</option>
                    <option value="RETAIL_OUTLET">Retail Outlet</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center text-xs font-bold text-slate-600"><Box size={14} className="mr-1" /> Storage Capacity</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors"
                    value={formData.storageCapacity}
                    onChange={(e) => setFormData({ ...formData, storageCapacity: e.target.value })}
                    placeholder="Capacity in units"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center text-xs font-bold text-slate-600"><GitBranch size={14} className="mr-1" /> Branch Association</label>
                  <select
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors"
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  >
                    <option value="">None / Default (Main Warehouse)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.locationName} ({b.branchCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-slate-800">Active and available for stock</label>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Additional Attributes</label>
                    <button type="button" className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors" onClick={addAttribute}>+ Add Attribute</button>
                  </div>
                  <div className="space-y-2">
                    {attributes.map((attr, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Key"
                          value={attr.key}
                          onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Value"
                          value={attr.value}
                          onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                        />
                        <button type="button" className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" onClick={() => removeAttribute(index)}><Trash size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                <button type="button" className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="px-8 py-2 bg-indigo-600 text-white text-sm font-extrabold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">
                  {isEditing ? 'Update Warehouse' : 'Create Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Warehouse Modal */}
      {viewWarehouse && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewWarehouse(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-8 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="bg-indigo-600 px-6 py-6 text-white">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-black">Warehouse Details</h2>
                <button onClick={() => setViewWarehouse(null)} className="text-white/70 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">Full record information</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Package size={24} /></div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">Name</label>
                  <div className="text-lg font-black text-slate-900 leading-tight">{viewWarehouse.name}</div>
                </div>
              </div>

              <div className="flex gap-4 items-start border-t border-slate-50 pt-5">
                <div className="p-3 bg-slate-100 text-slate-500 rounded-xl"><MapPin size={24} /></div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 block">Location</label>
                  <div className="text-sm font-bold text-slate-700">{viewWarehouse.location}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Category</label>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded uppercase tracking-tighter">{viewWarehouse.warehouseType?.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Status</label>
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${viewWarehouse.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {viewWarehouse.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Storage Capacity</label>
                <div className="flex items-end gap-1.5">
                  <div className="text-2xl font-black text-slate-900 leading-none">{viewWarehouse.storageCapacity || '∞'}</div>
                  <span className="text-xs font-bold text-slate-400 mb-0.5 uppercase tracking-tighter">Units Total</span>
                </div>
              </div>

              {viewWarehouse.attributes && Object.keys(JSON.parse(viewWarehouse.attributes || '{}')).length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Metadata Attributes</label>
                  <div className="space-y-2">
                    {Object.entries(JSON.parse(viewWarehouse.attributes)).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-tighter">{k}:</span>
                        <span className="font-black text-slate-700">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-5 bg-slate-50 flex justify-end">
              <button onClick={() => setViewWarehouse(null)} className="px-8 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-black transition-all shadow-lg shadow-slate-200">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Warehouses;
