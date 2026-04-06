import React, { useState, useEffect, useCallback } from 'react';
import {
    Edit,
    Trash2,
    Plus,
    Loader2,
    AlertCircle,
    RefreshCw,
    X,
    Tag,
    AlignLeft,
    Printer,
    Activity,
    Layers,
    Bookmark,
    Save,
    Search
} from 'lucide-react';
import { categoryService, brandService } from '../services/api';
import { useNotification } from '../context/NotificationContext';

const CatalogSettings = () => {
    const { confirm } = useNotification();
    const [activeTab, setActiveTab] = useState('categories');

    // State Management
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal States
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Form States
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
    const [brandForm, setBrandForm] = useState({ name: '', manufacturer: '' });

    // Data Fetching
    const fetchCategories = useCallback(async () => {
        try {
            setError(null);
            const response = await categoryService.getAll();
            const data = response.data;
            setCategories(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to load categories. Please check your connection.');
        }
    }, []);

    const fetchBrands = useCallback(async () => {
        try {
            setError(null);
            const response = await brandService.getAll();
            const data = response.data;
            setBrands(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
        } catch (err) {
            console.error('Error fetching brands:', err);
            setError('Failed to load brands. Please check your connection.');
        }
    }, []);

    const initFetch = useCallback(async () => {
        setIsLoading(true);
        if (activeTab === 'categories') {
            await fetchCategories();
        } else {
            await fetchBrands();
        }
        setIsLoading(false);
    }, [activeTab, fetchCategories, fetchBrands]);

    useEffect(() => {
        initFetch();
    }, [initFetch]);

    const handleDeleteCategory = async (id) => {
        const isConfirmed = await confirm({
            title: 'Delete Category',
            message: 'This will permanently delete this category. Proceed?',
            type: 'danger',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
        });
        if (!isConfirmed) return;
        try {
            await categoryService.delete(id);
            setCategories(prev => prev.filter(cat => cat.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleDeleteBrand = async (id) => {
        const isConfirmed = await confirm({
            title: 'Delete Brand',
            message: 'This will irreversibly remove the brand from the system. Continue?',
            type: 'danger',
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel'
        });
        if (!isConfirmed) return;
        try {
            await brandService.delete(id);
            setBrands(prev => prev.filter(brand => brand.id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setEditId(null);
        if (activeTab === 'categories') {
            setCategoryForm({ name: '', description: '' });
            setIsCategoryModalOpen(true);
        } else {
            setBrandForm({ name: '', manufacturer: '' });
            setIsBrandModalOpen(true);
        }
    };

    const handleEditCategory = (category) => {
        setIsEditing(true);
        setEditId(category.id);
        setCategoryForm({ name: category.name, description: category.description || '' });
        setIsCategoryModalOpen(true);
    };

    const handleEditBrand = (brand) => {
        setIsEditing(true);
        setEditId(brand.id);
        setBrandForm({ name: brand.name, manufacturer: brand.manufacturer || '' });
        setIsBrandModalOpen(true);
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            if (isEditing) {
                await categoryService.update(editId, categoryForm);
            } else {
                await categoryService.create(categoryForm);
            }
            await fetchCategories();
            setIsCategoryModalOpen(false);
        } catch (err) {
            console.error('Error saving category:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveBrand = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            if (isEditing) {
                await brandService.update(editId, brandForm);
            } else {
                await brandService.create(brandForm);
            }
            await fetchBrands();
            setIsBrandModalOpen(false);
        } catch (err) {
            console.error('Error saving brand:', err);
        } finally {
            setIsSaving(false);
        }
    };


    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-40 text-slate-300">
                <RefreshCw size={48} className="animate-spin mb-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Synchronizing Registry…</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-40 text-slate-400 max-w-xl mx-auto text-center">
                <div className="bg-rose-50 p-6 rounded-full text-rose-500 mb-6 border border-rose-100 shadow-inner">
                    <AlertCircle size={48} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Loading Error</h3>
                <p className="text-sm font-medium text-slate-400 mt-2 italic">"{error}"</p>
                <button onClick={initFetch} className="mt-8 px-10 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 hover:bg-black transition-all">
                    <RefreshCw size={14} /> Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <header className="flex justify-between items-start border-b border-slate-100 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Catalog Settings</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1 italic tracking-tight">Manage product categories and brands for your inventory</p>
                </div>
                <button
                    onClick={handleOpenAddModal}
                    className="px-8 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
                >
                    <Plus size={18} /> Define {activeTab === 'categories' ? 'Category' : 'Brand'}
                </button>
            </header>

            <div className="flex flex-wrap items-center gap-10">
                <div className="bg-slate-100/60 p-1.5 rounded-2xl shadow-inner border border-slate-100 flex gap-1">
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'categories'
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Layers size={14} />
                        <span>Categories</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] ${activeTab === 'categories' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                            {categories.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('brands')}
                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'brands'
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Bookmark size={14} />
                        <span>Brands</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] ${activeTab === 'brands' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                            {brands.length}
                        </span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeTab === 'categories' ? 'Category Name' : 'Brand Name'}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeTab === 'categories' ? 'Description' : 'Manufacturer'}</th>
                                {activeTab === 'categories' && <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Product Count</th>}
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {activeTab === 'categories' ? (
                                categories.length === 0 ? (
                                    <tr><td colSpan="4" className="px-8 py-20 text-center text-slate-300 italic text-sm font-medium tracking-tight whitespace-nowrap">No categories found in this sector.</td></tr>
                                ) : (
                                    categories.map((category) => (
                                        <tr key={category.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-500 shadow-inner group-hover:scale-110 transition-transform">
                                                        <Tag size={14} />
                                                    </div>
                                                    <span className="font-black text-slate-800 tracking-tight">{category.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-xs font-bold text-slate-500 italic max-w-xs truncate">"{category.description || 'No definition set'}"</td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                                    {category.count || 0} Products
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditCategory(category)} className="p-2.5 bg-indigo-50 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-all border border-indigo-100/30 rounded-xl" title="Modify Def"><Edit size={16} /></button>
                                                    <button onClick={() => handleDeleteCategory(category.id)} className="p-2.5 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all border border-rose-100/30 rounded-xl" title="Purge State"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : (
                                brands.length === 0 ? (
                                    <tr><td colSpan="3" className="px-8 py-20 text-center text-slate-300 italic text-sm font-medium tracking-tight whitespace-nowrap">No brands found in system archives.</td></tr>
                                ) : (
                                    brands.map((brand) => (
                                        <tr key={brand.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                                                        <Activity size={14} />
                                                    </div>
                                                    <span className="font-black text-slate-800 tracking-tight">{brand.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-xs font-bold text-slate-500 italic">#{brand.manufacturer || 'General Production'}</td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditBrand(brand)} className="p-2.5 bg-indigo-50 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-all border border-indigo-100/30 rounded-xl" title="Modify Def"><Edit size={16} /></button>
                                                    <button onClick={() => handleDeleteBrand(brand.id)} className="p-2.5 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all border border-rose-100/30 rounded-xl" title="Purge State"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Components */}
            {(isCategoryModalOpen || isBrandModalOpen) && (
                <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => { setIsCategoryModalOpen(false); setIsBrandModalOpen(false); }}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl shadow-xl text-white ${isCategoryModalOpen ? 'bg-indigo-600 shadow-indigo-100' : 'bg-emerald-600 shadow-emerald-100'}`}>
                                    {isCategoryModalOpen ? <Tag size={20} /> : <Activity size={20} />}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                        {isEditing
                                            ? (isCategoryModalOpen ? 'Modify Category' : 'Modify Brand')
                                            : (isCategoryModalOpen ? 'Add New Category' : 'Add New Brand')}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Classify and organize your products and brands</p>
                                </div>
                            </div>
                            <button onClick={() => { setIsCategoryModalOpen(false); setIsBrandModalOpen(false); }} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                <X size={28} />
                            </button>
                        </div>

                        <form onSubmit={isCategoryModalOpen ? handleSaveCategory : handleSaveBrand} className="p-10 space-y-8">
                            {isCategoryModalOpen ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                            <Tag size={12} className="text-indigo-400" /> Category Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all"
                                            value={categoryForm.name}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                            placeholder="e.g. Bio-Chemicals, Industrial Grade"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                            <AlignLeft size={12} className="text-indigo-400" /> Description
                                        </label>
                                        <textarea
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-400 min-h-[120px]"
                                            rows="3"
                                            value={categoryForm.description}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                            placeholder="Provide a brief description of this category..."
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                            <Activity size={12} className="text-emerald-400" /> Brand Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 transition-all"
                                            value={brandForm.name}
                                            onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                                            placeholder="e.g. OmniCorp, Cyberdyne"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                            <Printer size={12} className="text-emerald-400" /> Manufacturer
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-400"
                                            value={brandForm.manufacturer}
                                            onChange={(e) => setBrandForm({ ...brandForm, manufacturer: e.target.value })}
                                            placeholder="Enter legal manufacturer name..."
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-4 justify-end pt-8 border-t border-slate-50">
                                <button
                                    type="button"
                                    onClick={() => { setIsCategoryModalOpen(false); setIsBrandModalOpen(false); }}
                                    className="px-8 py-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`px-12 py-4 text-white text-xs font-black uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl transition-all active:scale-95 flex items-center gap-2 ${isCategoryModalOpen ? 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700' : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700'
                                        }`}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving…
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Save
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CatalogSettings;
