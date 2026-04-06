import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, X, AlertCircle, RefreshCw, Barcode, Package, Layers, ShieldCheck, Star, Save } from 'lucide-react';

const ProductRegistrationModal = ({ isOpen, onClose, onSuccess, categories, brands, editingProduct, onSave }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        description: '',
        category: '',
        brand: '',
        industryType: 'GENERAL',
        price: '',
        reorderLevel: '',
        unit: '',
        featured: false,
        active: true,
        attributes: {}
    });

    useEffect(() => {
        if (editingProduct) {
            setFormData({
                sku: editingProduct.sku || '',
                name: editingProduct.name || '',
                description: editingProduct.description || '',
                category: editingProduct.category || '',
                brand: editingProduct.brand || '',
                industryType: editingProduct.industryType || 'GENERAL',
                price: editingProduct.price || '',
                reorderLevel: editingProduct.reorderLevel || '',
                unit: editingProduct.unit || '',
                featured: editingProduct.featured || false,
                active: editingProduct.active !== false,
                attributes: editingProduct.attributes || {}
            });
        } else {
            setFormData({
                sku: '',
                name: '',
                description: '',
                category: '',
                brand: '',
                industryType: 'GENERAL',
                price: '',
                reorderLevel: '',
                unit: '',
                featured: false,
                active: true,
                attributes: {}
            });
        }
    }, [editingProduct, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData, editingProduct?.id);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 relative">
                <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                            {editingProduct ? 'Modify Resource' : 'Register New Asset'}
                        </h2>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Global Catalog Synchronization Node</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><X size={28} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-10">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3 group">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Barcode size={12} className="text-indigo-500" /> Identifier (SKU) *
                            </label>
                            <input
                                type="text"
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all uppercase tracking-widest placeholder:text-slate-300"
                                placeholder="Prefix-####-####"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Package size={12} className="text-indigo-400" /> Operational Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all"
                                placeholder="e.g. Lithium Polymer Unit v2"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Layers size={12} className="text-indigo-400" /> Taxonomy (Category)
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
                            >
                                <option value="">Select Domain</option>
                                {categories?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={12} className="text-indigo-400" /> Origin (Brand)
                            </label>
                            <select
                                name="brand"
                                value={formData.brand}
                                onChange={handleChange}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat"
                            >
                                <option value="">Select Origin</option>
                                {brands?.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Industry Cluster</label>
                            <select
                                name="industryType"
                                value={formData.industryType}
                                onChange={handleChange}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400"
                            >
                                <option value="GENERAL">General Node</option>
                                <option value="RETAIL">Retail Ecosystem</option>
                                <option value="PHARMACY">Pharmaceutical Node</option>
                                <option value="MANUFACTURING">Manufacturing Hub</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Valuation (Price)</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm">Rs.</span>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    step="0.01"
                                    className="w-full pl-10 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:border-indigo-400"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={12} className="text-amber-500" /> Reorder Level
                            </label>
                            <input
                                type="number"
                                name="reorderLevel"
                                value={formData.reorderLevel}
                                onChange={handleChange}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:border-indigo-400"
                                placeholder="Low stock threshold"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Standard Unit (UoM)</label>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400"
                            >
                                <option value="">Select Unit</option>
                                <option value="UNIT">Units (Each)</option>
                                <option value="KG">Kilograms (Kg)</option>
                                <option value="GRAM">Grams (g)</option>
                                <option value="LITER">Liters (L)</option>
                                <option value="BOX">Boxes (Box)</option>
                                <option value="PACK">Packs (Pkt)</option>
                                <option value="Sheet">Sheets</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Architectural Documentation (Description)</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 min-h-[120px]"
                            placeholder="Detail parameters, specifications and environmental constraints…"
                        />
                    </div>

                    <div className="flex flex-wrap gap-8 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    name="featured"
                                    checked={formData.featured}
                                    onChange={handleChange}
                                    className="peer sr-only"
                                />
                                <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-amber-400 transition-colors" />
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Star size={12} className="text-amber-400" /> Highlight as Priority
                            </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleChange}
                                    className="peer sr-only"
                                />
                                <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-colors" />
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resource Active</span>
                        </label>
                    </div>

                    <div className="flex gap-4 justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-10 py-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-12 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            {editingProduct ? 'Commit Changes' : 'Initialize Asset'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductRegistrationModal;
