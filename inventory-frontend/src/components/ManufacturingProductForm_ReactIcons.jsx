import { useState } from 'react';
import { FaBox, FaBoxes, FaDollarSign, FaWarehouse, FaUser, FaHashtag } from 'react-icons/fa';
import { X, Save, Factory, Beaker, Layers } from 'lucide-react';

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
    { value: 'RAW_MATERIAL', label: 'Raw Material', icon: Beaker },
    { value: 'SUB_ASSEMBLY', label: 'Sub-Assembly', icon: Layers },
    { value: 'FINISHED_GOOD', label: 'Finished Good', icon: Factory }
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

    if (formData.itemType === 'RAW_MATERIAL' && !formData.supplier.trim()) newErrors.supplier = 'Supplier is required';
    if (formData.itemType === 'FINISHED_GOOD' && (!formData.salesPrice || parseFloat(formData.salesPrice) <= 0)) newErrors.salesPrice = 'Valid Sales Price is required';

    const hasStockData = [formData.warehouse, formData.quantity].some(f => f && f.toString().trim());
    if (hasStockData) {
      if (!formData.warehouse) newErrors.warehouse = 'Warehouse required';
      if (!formData.quantity || parseInt(formData.quantity) <= 0) newErrors.quantity = 'Valid Qty required';
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
              <FaBoxes size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Manufacturing Registry</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Industrial Resource Initialization (Legacy Icon Support)</p>
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
                  <FaHashtag size={12} className="text-indigo-400" /> Part Number (SKU) *
                </label>
                <input
                  type="text"
                  name="partNumber"
                  value={formData.partNumber}
                  onChange={handleChange}
                  placeholder="MFG-####"
                  className={`w-full px-5 py-3.5 bg-white border ${errors.partNumber ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all uppercase tracking-widest`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <FaBox size={12} className="text-indigo-400" /> Operational Name *
                </label>
                <input
                  type="text"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  className={`w-full px-5 py-3.5 bg-white border ${errors.itemName ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all`}
                />
              </div>

              <div className="space-y-2 col-span-full">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">Classification Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {itemTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, itemType: type.value }))}
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${formData.itemType === type.value
                        ? `bg-slate-900 border-slate-900 text-white shadow-lg`
                        : `bg-white border-slate-100 text-slate-400 hover:border-slate-200`
                        }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unit of Measure *</label>
                <select name="uom" value={formData.uom} onChange={handleChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 cursor-pointer">
                  {uomOptions.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <FaDollarSign size={12} className="text-indigo-400" /> Std. Cost (Rs.) *
                </label>
                <input type="number" name="standardCost" value={formData.standardCost} onChange={handleChange} step="0.01" className={`w-full px-5 py-3.5 bg-white border ${errors.standardCost ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-black text-slate-700 outline-none focus:border-indigo-400`} />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Temporal State</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-emerald-50/10 p-8 rounded-[2rem] border border-emerald-100/30">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <FaWarehouse size={12} className="text-emerald-500" /> Node Anchor
                </label>
                <select name="warehouse" value={formData.warehouse} onChange={handleChange} className={`w-full px-5 py-3.5 bg-white border ${errors.warehouse ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 cursor-pointer`}>
                  <option value="">Select Anchor…</option>
                  <option value="MAIN_WH">Main Hub</option>
                  <option value="PROD_WH">Production Node</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">Initial Qty</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className={`w-full px-5 py-3.5 bg-white border ${errors.quantity ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-black text-slate-700 outline-none focus:border-emerald-400`} />
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4">
            <button type="button" onClick={onCancel} className="px-10 py-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">Cancel</button>
            <button type="submit" className="px-12 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3">
              <Save size={18} /> Commit Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ManufacturingProductForm;
