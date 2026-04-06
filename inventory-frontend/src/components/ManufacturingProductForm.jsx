import { useState } from 'react';
import { Box, Package, DollarSign, Warehouse, User, Hash, X, Save, AlertCircle, Info, Layers, Beaker, Factory } from 'lucide-react';

function ManufacturingProductForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    partNumber: '',
    itemName: '',
    itemType: 'RAW_MATERIAL',
    uom: 'PCS',
    standardCost: '',
    minimumStockLevel: '',
    supplier: '',
    salesPrice: '',
    warehouse: '',
    binLocation: '',
    lotNumber: '',
    quantity: ''
  });

  const [errors, setErrors] = useState({});

  const itemTypes = [
    { value: 'RAW_MATERIAL', label: 'Raw Material', icon: Beaker, color: 'emerald' },
    { value: 'SUB_ASSEMBLY', label: 'Sub-Assembly', icon: Layers, color: 'indigo' },
    { value: 'FINISHED_GOOD', label: 'Finished Good', icon: Factory, color: 'rose' }
  ];

  const uomOptions = [
    'PCS', 'KG', 'LBS', 'M', 'FT', 'L', 'GAL', 'BOX', 'ROLL', 'SHEET'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.partNumber.trim()) newErrors.partNumber = 'Part Number is required';
    if (!formData.itemName.trim()) newErrors.itemName = 'Item Name is required';
    if (!formData.standardCost || parseFloat(formData.standardCost) <= 0) newErrors.standardCost = 'Valid Standard Cost is required';
    if (!formData.minimumStockLevel || parseInt(formData.minimumStockLevel) < 0) newErrors.minimumStockLevel = 'Valid Minimum Stock Level is required';
    if (formData.itemType === 'RAW_MATERIAL' && !formData.supplier.trim()) newErrors.supplier = 'Supplier is required for Raw Materials';
    if (formData.itemType === 'FINISHED_GOOD' && (!formData.salesPrice || parseFloat(formData.salesPrice) <= 0)) newErrors.salesPrice = 'Valid Sales Price is required for Finished Goods';

    const hasStockData = [formData.warehouse, formData.quantity].some(field => field && field.toString().trim());
    if (hasStockData) {
      if (!formData.warehouse) newErrors.warehouse = 'Warehouse is required for initial stock';
      if (!formData.quantity || parseInt(formData.quantity) <= 0) newErrors.quantity = 'Valid Quantity is required for initial stock';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl animate-in zoom-in-95 fade-in duration-300 relative overflow-hidden">

        <header className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200">
              <Factory size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Manufacturing Registry</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Industrial Resource Initialization</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><X size={28} /></button>
        </header>

        <form onSubmit={handleSubmit} className="p-10 space-y-12">

          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Item Spec & Definition</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/30 p-8 rounded-[2rem] border border-slate-100">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Hash size={12} className="text-indigo-400" /> Part Number (SKU) *
                </label>
                <input
                  type="text"
                  name="partNumber"
                  value={formData.partNumber}
                  onChange={handleChange}
                  placeholder="MFG-####-####"
                  className={`w-full px-5 py-3.5 bg-white border ${errors.partNumber ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all uppercase tracking-widest`}
                />
                {errors.partNumber && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-2">{errors.partNumber}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Package size={12} className="text-indigo-400" /> Operational Name *
                </label>
                <input
                  type="text"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  placeholder="e.g. Cobalt Sub-Module"
                  className={`w-full px-5 py-3.5 bg-white border ${errors.itemName ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all`}
                />
                {errors.itemName && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-2">{errors.itemName}</p>}
              </div>

              <div className="space-y-2 col-span-full">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">Classification Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {itemTypes.map(type => {
                    const Icon = type.icon;
                    const isActive = formData.itemType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, itemType: type.value }))}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${isActive
                          ? `bg-slate-900 border-slate-900 text-white shadow-lg`
                          : `bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600`
                          }`}
                      >
                        <Icon size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unit of Measure *</label>
                <select name="uom" value={formData.uom} onChange={handleChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400">
                  {uomOptions.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Std. Cost Calibration (Rs.) *</label>
                <input type="number" name="standardCost" value={formData.standardCost} onChange={handleChange} step="0.01" className={`w-full px-5 py-3.5 bg-white border ${errors.standardCost ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-black text-slate-700 outline-none focus:border-indigo-400`} placeholder="0.00" />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Initial Temporal State</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-emerald-50/10 p-8 rounded-[2rem] border border-emerald-100/30">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Warehouse size={12} className="text-emerald-500" /> Deployment Anchor (Warehouse)
                </label>
                <select name="warehouse" value={formData.warehouse} onChange={handleChange} className={`w-full px-5 py-3.5 bg-white border ${errors.warehouse ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-400`}>
                  <option value="">N/A (Archive Mode)</option>
                  <option value="MAIN_WH">Main Hub</option>
                  <option value="PROD_WH">Production Node</option>
                </select>
                {errors.warehouse && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-2">{errors.warehouse}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">Initial Magnitude (Qty)</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="0" className={`w-full px-5 py-3.5 bg-white border ${errors.quantity ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-black text-slate-700 outline-none focus:border-emerald-400`} />
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4">
            <button type="button" onClick={onCancel} className="px-10 py-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">Cancel</button>
            <button type="submit" className="px-12 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3">
              <Save size={18} /> Commit Definition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ManufacturingProductForm;
