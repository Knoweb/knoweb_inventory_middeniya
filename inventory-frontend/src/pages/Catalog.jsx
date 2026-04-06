import React, { useState, useEffect, useCallback } from 'react';
import { catalogService, categoryService, brandService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Package, Edit2, Trash2, Plus, Search, Star, RefreshCw, AlertCircle, Layers, ShieldCheck, Box } from 'lucide-react';
import ProductRegistrationModal from '../components/ProductRegistrationModal';

const Catalog = () => {
  const { confirm } = useNotification();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        catalogService.getAll(),
        categoryService.getAll(),
        brandService.getAll()
      ]);

      const pData = productsRes.data;
      setProducts(Array.isArray(pData) ? pData : (pData?.content ?? pData?.data ?? []));

      const cData = categoriesRes.data;
      setCategories(Array.isArray(cData) ? cData : (cData?.content ?? cData?.data ?? []));

      const bData = brandsRes.data;
      setBrands(Array.isArray(bData) ? bData : (bData?.content ?? bData?.data ?? []));
    } catch (err) {
      console.error('Error fetching catalog data:', err);
      setError('Failed to load catalog information. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Purge Resource Definition',
      message: 'This will permanently detach the item from the global catalog registry. Proceed with de-registration?',
      type: 'danger',
      confirmLabel: 'Purge Record',
      cancelLabel: 'Retain'
    });
    if (!isConfirmed) return;
    try {
      await catalogService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIndustryBadge = (type) => {
    switch (type) {
      case 'PHARMACY': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'RETAIL': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'MANUFACTURING': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-40 text-slate-300">
      <RefreshCw size={48} className="animate-spin mb-4" />
      <span className="text-[10px] font-black uppercase tracking-[0.4em]">Compiling Global Catalog…</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center p-40 text-slate-400 max-w-xl mx-auto text-center">
      <div className="bg-rose-50 p-6 rounded-full text-rose-500 mb-6 border border-rose-100 shadow-inner">
        <AlertCircle size={48} />
      </div>
      <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Sync Refusal Detected</h3>
      <p className="text-sm font-medium text-slate-400 mt-2 italic">"{error}"</p>
      <button onClick={fetchData} className="mt-8 px-10 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center gap-2 hover:bg-black transition-all">
        <RefreshCw size={14} /> Re-try Signal
      </button>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-start border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Global Catalog</h1>
          <p className="text-sm font-medium text-slate-500 mt-1 italic leading-relaxed">System-wide resource definitions across all organizational nodes</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-8 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus size={18} /> Register Item
        </button>
      </header>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
        <input
          type="text"
          placeholder="Filter by SKU, name or metadata…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all shadow-sm"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource Code</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Signature</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Taxonomy</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Vertical</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Valuation</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lifecycle</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Utilites</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 cursor-default">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-8 py-32 text-center text-slate-300">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-slate-100 p-6 rounded-full opacity-40 shadow-inner"><Layers size={48} /></div>
                      <span className="font-black uppercase tracking-[0.2em] text-sm">No data matching active filters</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <code className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 tracking-widest uppercase shadow-inner">
                        {product.sku || 'UNSET'}
                      </code>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 text-indigo-500 group-hover:scale-110 transition-transform relative">
                          <Package size={18} />
                          {product.featured && <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white rounded-full p-0.5 border-2 border-white shadow-sm"><Star size={8} fill="currentColor" /></div>}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 tracking-tight leading-none">{product.name}</span>
                          {product.featured && <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-1 italic">Featured Asset</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="text-xs font-bold text-slate-500 italic lowercase tracking-tight">#{product.category || 'uncategorized'}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${getIndustryBadge(product.industryType)}`}>
                        {product.industryType || 'GENERAL'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 tracking-tighter text-sm">
                          {product.price ? `Rs. ${parseFloat(product.price).toFixed(2)}` : 'N/A'}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Base Rate</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${product.active !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100'
                        }`}>
                        {product.active !== false ? 'Live' : 'Archived'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-2.5 bg-indigo-50 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-all border border-indigo-100/30 rounded-xl" title="Modify Definition"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-2.5 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all border border-rose-100/30 rounded-xl" title="Purge Record"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductRegistrationModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
        onSuccess={fetchData}
        categories={categories}
        brands={brands}
        editingProduct={editingProduct}
        onSave={async (data, id) => {
          if (id) {
            await catalogService.updateProduct(id, data);
          } else {
            await catalogService.createProduct(data);
          }
        }}
      />
    </div>
  );
};

export default Catalog;
