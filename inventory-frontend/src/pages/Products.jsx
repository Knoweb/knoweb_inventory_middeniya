import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, pharmacyService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FaBox, FaExclamationTriangle, FaBan, FaPills, FaSnowflake } from 'react-icons/fa';
import { Edit, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import ProductRegistrationModal from '../components/ProductRegistrationModal';
import { categoryService, brandService } from '../services/api';

function Products() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast, confirm, prompt } = useNotification();
    const [products, setProducts] = useState([]);
    const [pharmacyProducts, setPharmacyProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [expiringDays, setExpiringDays] = useState(30);
    const [stats, setStats] = useState({
        expiringSoon: 0,
        expired: 0,
        prescriptionOnly: 0,
        refrigerated: 0
    });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const isPharmacy = user?.industryType === 'PHARMACY';

    useEffect(() => {
        fetchProducts();
        fetchMetadata();
        if (isPharmacy) {
            fetchPharmacyProducts();
            fetchPharmacyStats();
        }
    }, [activeTab, expiringDays]);

    const toArray = (data) => {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.content)) return data.content;
        if (data && Array.isArray(data.data)) return data.data;
        return [];
    };

    const fetchMetadata = async () => {
        try {
            const [catRes, brandRes] = await Promise.all([
                categoryService.getAll(),
                brandService.getAll()
            ]);
            setCategories(toArray(catRes.data));
            setBrands(toArray(brandRes.data));
        } catch (error) {
            console.error('Error fetching metadata:', error);
            setCategories([]);
            setBrands([]);
            showToast('Catalog synchronization failed', 'error');
        }
    };

    const fetchPharmacyStats = async () => {
        if (!isPharmacy || !user?.orgId) return;
        try {
            const response = await pharmacyService.getStats(user.orgId);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching pharmacy stats:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await productService.getAll();
            const data = response.data;
            setProducts(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            showToast('Critical product retrieval failure', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchPharmacyProducts = async () => {
        if (!isPharmacy) return;

        try {
            let response;
            const orgId = user?.orgId || 1;
            switch (activeTab) {
                case 'expiring':
                    response = await pharmacyService.getExpiring(expiringDays);
                    break;
                case 'expired':
                    response = await pharmacyService.getExpired();
                    break;
                case 'prescription':
                    response = await pharmacyService.getPrescription(true);
                    break;
                case 'controlled':
                    response = await pharmacyService.getControlled('II');
                    break;
                case 'refrigerated':
                    response = await pharmacyService.getRefrigerated();
                    break;
                case 'recalled':
                    response = await pharmacyService.getRecalled();
                    break;
                default:
                    response = await pharmacyService.getByOrganization(orgId);
            }
            const pData = response.data;
            setPharmacyProducts(Array.isArray(pData) ? pData : (pData?.content ?? pData?.data ?? []));
        } catch (error) {
            console.error('Error fetching pharmacy products:', error);
            setPharmacyProducts([]);
            showToast('Pharmacy specific retrieval failed', 'error');
        }
    };

    const handleRecall = async (id) => {
        const reason = await prompt({
            title: 'Initiate Product Recall',
            message: 'Specify the medical or quality reason for this batch recall protocol.',
            placeholder: 'Reason for recall...',
            confirmLabel: 'Recall Batch',
            cancelLabel: 'Cancel'
        });

        if (reason) {
            try {
                await pharmacyService.recall(id, reason);
                fetchPharmacyProducts();
                showToast('Product recall protocol initiated', 'warning');
            } catch (error) {
                console.error('Error recalling product:', error);
                showToast('Recall protocol execution failed', 'error');
            }
        }
    };

    const getProductName = (productId) => {
        const product = products.find(p => p.id === productId);
        return product ? product.name : 'Unknown';
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleSave = async (formData, id) => {
        try {
            if (id) {
                await productService.update(id, formData);
                showToast('Product registry updated', 'success');
            } else {
                await productService.create(formData);
                showToast('New product registered', 'success');
            }
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            showToast('Registry operation failed', 'error');
            throw error;
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Delete Product',
            message: 'This will purge the product from the global registry. This action is irreversible.',
            type: 'danger',
            confirmLabel: 'Delete Product',
            cancelLabel: 'Retain'
        });

        if (isConfirmed) {
            try {
                await productService.delete(id);
                showToast('Product successfully purged', 'warning');
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                showToast('Product purge failed', 'error');
            }
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 text-gray-400">
            <RefreshCw className="animate-spin mb-4" size={32} />
            <p className="text-sm font-medium">Loading products data...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
                        <FaBox className="text-indigo-600" /> Products {isPharmacy && <span className="text-gray-400 font-light">& Pharmacy Management</span>}
                    </h1>
                    {isPharmacy && <p className="text-sm text-gray-500 mt-1">Batch tracking, expiry dates, and prescription management</p>}
                </div>
                <button
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 text-sm"
                    onClick={() => navigate('/products/register')}
                >
                    + Register Product
                </button>
            </header>

            {/* Stats Cards */}
            {isPharmacy && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group" onClick={() => setActiveTab('expiring')}>
                        <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-3 group-hover:text-yellow-600 transition-colors">
                            <FaExclamationTriangle /> <span>Expiring Soon</span>
                        </div>
                        <div className="text-3xl font-black text-yellow-600">
                            {stats.expiringSoon}
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group" onClick={() => setActiveTab('expired')}>
                        <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-3 group-hover:text-red-600 transition-colors">
                            <FaBan /> <span>Expired</span>
                        </div>
                        <div className="text-3xl font-black text-red-600">
                            {stats.expired}
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group" onClick={() => setActiveTab('prescription')}>
                        <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-3 group-hover:text-blue-600 transition-colors">
                            <FaPills /> <span>Prescription</span>
                        </div>
                        <div className="text-3xl font-black text-blue-600">
                            {stats.prescriptionOnly}
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group" onClick={() => setActiveTab('refrigerated')}>
                        <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-3 group-hover:text-cyan-600 transition-colors">
                            <FaSnowflake /> <span>Refrigerated</span>
                        </div>
                        <div className="text-3xl font-black text-cyan-600">
                            {stats.refrigerated}
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            {isPharmacy && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { id: 'all', label: 'All Products' },
                        { id: 'expiring', label: 'Expiring Soon' },
                        { id: 'expired', label: 'Expired' },
                        { id: 'prescription', label: 'Prescription Only' },
                        { id: 'controlled', label: 'Controlled' },
                        { id: 'recalled', label: 'Recalled' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm ${activeTab === tab.id ? 'bg-indigo-600 text-white ring-2 ring-indigo-100' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Filter Controls (Expiring) */}
            {activeTab === 'expiring' && (
                <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50 animate-in fade-in duration-300">
                    <label className="text-xs font-bold text-indigo-900 uppercase tracking-widest">Expiring within:</label>
                    <select
                        className="bg-white text-xs font-black border-indigo-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2 outline-none"
                        value={expiringDays}
                        onChange={(e) => setExpiringDays(e.target.value)}
                    >
                        <option value="7">7 days</option>
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                    </select>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            {isPharmacy && activeTab !== 'all' ? (
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Product</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Batch#</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Ingredient</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Strength</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Expiry</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Attributes</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            ) : (
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">SKU</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Product Name</th>
                                    {isPharmacy && <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Generic</th>}
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Brand</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Price</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Stock Config</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(isPharmacy && activeTab !== 'all' ? pharmacyProducts : products).length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="px-6 py-16 text-center text-gray-400 italic text-sm">
                                        No products found matching relevant criteria.
                                    </td>
                                </tr>
                            ) : (
                                (isPharmacy && activeTab !== 'all' ? pharmacyProducts : products).map((product) => {
                                    if (isPharmacy && activeTab !== 'all') {
                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-900 text-sm whitespace-nowrap">{getProductName(product.productId)}</td>
                                                <td className="px-6 py-4 text-xs font-mono text-gray-500">{product.batchNumber}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700">{product.activeIngredient}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700 font-medium">{product.strength}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-800">{product.expiryDate}</span>
                                                        <span className={`text-[10px] font-black uppercase ${product.daysUntilExpiry <= 30 ? 'text-red-600' : 'text-gray-400'}`}>{product.daysUntilExpiry} days left</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {product.isRecalled ? (
                                                        <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase">RECALLED</span>
                                                    ) : product.isExpired ? (
                                                        <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase">EXPIRED</span>
                                                    ) : product.daysUntilExpiry <= 30 ? (
                                                        <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-[10px] font-black uppercase shadow-sm">Expiring Soon</span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-black uppercase">Good</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {product.isPrescriptionRequired && (
                                                            <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-[10px] font-black uppercase">{product.prescriptionType}</span>
                                                        )}
                                                        {product.requiresRefrigeration && (
                                                            <span className="px-2 py-1 rounded bg-cyan-100 text-cyan-700 text-[10px] font-black uppercase flex items-center gap-1">
                                                                <FaSnowflake size={8} /> Cold
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            className="p-2 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors shadow-sm"
                                                            title="Edit"
                                                            onClick={() => handleEdit(product)}
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors shadow-sm"
                                                            title="Recall Product"
                                                            onClick={() => handleRecall(product.id)}
                                                            disabled={product.isRecalled}
                                                        >
                                                            <AlertTriangle size={16} />
                                                        </button>
                                                        <button
                                                            className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors shadow-sm"
                                                            title="Delete"
                                                            onClick={() => handleDelete(product.id)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    } else {
                                        const genericName = product.industrySpecificAttributes?.genericName || '-';
                                        const isPrescription = product.industrySpecificAttributes?.isPrescriptionRequired || false;
                                        const unit = product.unit || 'UNIT';

                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 text-[10px] font-mono font-bold text-gray-400">{product.sku}</td>
                                                <td className="px-6 py-4 font-bold text-gray-900 text-sm">{product.name}</td>
                                                {isPharmacy && <td className="px-6 py-4 text-xs font-medium text-gray-500 italic">{genericName}</td>}
                                                <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider border border-gray-200">{product.category || '-'}</span></td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{product.brand || '-'}</td>
                                                <td className="px-6 py-4 font-black text-gray-900 text-sm">Rs.{product.price?.toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                        <span>Unit: <span className="text-gray-600">{unit}</span></span>
                                                        <span className={product.reorderLevel <= 10 ? 'text-red-600' : 'text-gray-400'}>
                                                            Reorder: <span className={product.reorderLevel <= 10 ? 'text-red-700 font-black' : 'text-gray-600'}>{product.reorderLevel || 'Not Set'}</span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {product.isActive ? (
                                                            <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-black uppercase">Active</span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase">Inactive</span>
                                                        )}
                                                        {isPrescription && <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase">Rx</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2.5">
                                                        <button
                                                            className="p-2 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors shadow-sm"
                                                            title="Edit"
                                                            onClick={() => handleEdit(product)}
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors shadow-sm"
                                                            title="Delete"
                                                            onClick={() => handleDelete(product.id)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProductRegistrationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchProducts();
                    if (isPharmacy) {
                        fetchPharmacyProducts();
                        fetchPharmacyStats();
                    }
                }}
                categories={categories}
                brands={brands}
                editingProduct={editingProduct}
                onSave={handleSave}
            />
        </div>
    );
}

export default Products;
