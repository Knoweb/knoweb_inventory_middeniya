import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    submitStockTransaction,
    fetchCurrentStock,
    resetTransactionState,
    clearCurrentStock,
} from '../store/stockSlice';
import { productService, warehouseService } from '../services/api';
import {
    X,
    ArrowDownLeft,
    ArrowUpRight,
    RefreshCcw,
    Scale,
    Package,
    Warehouse,
    Hash,
    Tag,
    AlertCircle,
    CheckCircle2,
    Info,
    Plus,
    MoreHorizontal,
    ArrowRight
} from 'lucide-react';

const TRANSACTION_TYPES = [
    { value: 'IN', label: 'Stock In', icon: ArrowDownLeft, color: 'emerald', description: 'Receive goods' },
    { value: 'OUT', label: 'Stock Out', icon: ArrowUpRight, color: 'rose', description: 'Dispatch goods' },
    { value: 'TRANSFER', label: 'Transfer', icon: RefreshCcw, color: 'indigo', description: 'Move between nodes' },
    { value: 'ADJUSTMENT', label: 'Adjustment', icon: Scale, color: 'amber', description: 'Correct discrepancy' },
];

const INITIAL_FORM = {
    productId: '',
    warehouseId: '',
    targetWarehouseId: '',
    transactionType: 'IN',
    quantity: '',
    referenceId: '',
};

const INITIAL_ERRORS = {
    productId: '',
    warehouseId: '',
    targetWarehouseId: '',
    quantity: '',
};

function StockTransactionForm({ onClose, onSuccess }) {
    const dispatch = useDispatch();
    const { submitting, submitSuccess, submitError, currentStock, stockLoading } =
        useSelector((state) => state.stock);

    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState(INITIAL_ERRORS);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataError, setDataError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setDataLoading(true);
            setDataError(null);
            try {
                const [productsRes, warehousesRes] = await Promise.all([
                    productService.getAll(),
                    warehouseService.getAll(),
                ]);
                const pData = productsRes.data;
                const pList = Array.isArray(pData) ? pData : (pData?.content ?? pData?.data ?? []);
                const prods = pList.map((p) => ({
                    id: p.id,
                    name: p.name || p.productName || p.sku || `Product #${p.id}`,
                }));

                const wData = warehousesRes.data;
                const wList = Array.isArray(wData) ? wData : (wData?.content ?? wData?.data ?? []);
                const whs = wList
                    .filter(w => w.isActive !== false)
                    .map((w) => ({
                        id: w.id,
                        name: w.name || w.warehouseName || w.location || `Warehouse #${w.id}`,
                    }));
                setProducts(prods);
                setWarehouses(whs);
            } catch (err) {
                console.error('Failed to load form data:', err);
                setDataError('Could not load products or warehouses. Please try again.');
            } finally {
                setDataLoading(false);
            }
        };
        loadData();
    }, []);

    const isOutOrTransfer = form.transactionType === 'OUT' || form.transactionType === 'TRANSFER';
    const isTransfer = form.transactionType === 'TRANSFER';
    const availableQty = currentStock?.availableQuantity ?? null;

    useEffect(() => {
        if (form.productId && form.warehouseId && isOutOrTransfer) {
            dispatch(fetchCurrentStock({
                productId: form.productId,
                warehouseId: form.warehouseId,
            }));
        } else {
            dispatch(clearCurrentStock());
        }
    }, [form.productId, form.warehouseId, form.transactionType, dispatch, isOutOrTransfer]);

    useEffect(() => {
        if (submitSuccess) {
            onSuccess?.();
            const timer = setTimeout(() => {
                dispatch(resetTransactionState());
                onClose?.();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [submitSuccess, dispatch, onClose, onSuccess]);

    useEffect(() => {
        return () => {
            dispatch(resetTransactionState());
            dispatch(clearCurrentStock());
        };
    }, [dispatch]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const next = { ...prev, [name]: value };
            if (name === 'transactionType' && value !== 'TRANSFER') {
                next.targetWarehouseId = '';
            }
            return next;
        });
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    }, [errors]);

    const handleTypeSelect = useCallback((type) => {
        setForm((prev) => ({
            ...prev,
            transactionType: type,
            targetWarehouseId: type !== 'TRANSFER' ? '' : prev.targetWarehouseId,
        }));
        setErrors((prev) => ({ ...prev, targetWarehouseId: '' }));
    }, []);

    const validate = () => {
        const newErrors = { ...INITIAL_ERRORS };
        let valid = true;

        if (!form.productId) {
            newErrors.productId = 'Please select a product';
            valid = false;
        }

        if (!form.warehouseId) {
            newErrors.warehouseId = 'Please select a source warehouse';
            valid = false;
        }

        if (isTransfer) {
            if (!form.targetWarehouseId) {
                newErrors.targetWarehouseId = 'Please select a target warehouse';
                valid = false;
            } else if (form.targetWarehouseId === form.warehouseId) {
                newErrors.targetWarehouseId = 'Target warehouse must differ from source';
                valid = false;
            }
        }

        const qty = parseFloat(form.quantity);
        if (!form.quantity || isNaN(qty) || qty <= 0) {
            newErrors.quantity = 'Quantity must be a positive number';
            valid = false;
        } else if (isOutOrTransfer && availableQty !== null && qty > availableQty) {
            newErrors.quantity = `Insufficient stock — only ${availableQty} units available`;
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            productId: Number(form.productId),
            warehouseId: Number(form.warehouseId),
            type: form.transactionType,
            quantity: parseFloat(form.quantity),
            referenceId: form.referenceId.trim() || null,
            ...(isTransfer && { toWarehouseId: Number(form.targetWarehouseId) }),
        };

        dispatch(submitStockTransaction(payload));
    };

    const getStockBadge = () => {
        if (!isOutOrTransfer || !form.productId || !form.warehouseId) return null;
        if (stockLoading) {
            return (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 animate-pulse">
                    <RefreshCcw size={12} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Querying Real-time Stock…</span>
                </div>
            );
        }
        if (availableQty === null) return null;

        const qty = parseFloat(form.quantity) || 0;
        const isDanger = availableQty === 0 || qty > availableQty;
        const isWarning = availableQty < 20;

        return (
            <div className={`flex flex-col gap-1 p-4 rounded-2xl border transition-all ${isDanger ? 'bg-rose-50 border-rose-100 text-rose-600 shadow-rose-100' :
                isWarning ? 'bg-amber-50 border-amber-100 text-amber-600 shadow-amber-100' :
                    'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-100'
                } shadow-lg`}>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Inventory Level</span>
                    {isDanger ? <AlertCircle size={14} /> : isWarning ? <Info size={14} /> : <CheckCircle2 size={14} />}
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black tracking-tighter">{availableQty}</span>
                    <span className="text-xs font-bold uppercase opacity-60">Units Available</span>
                </div>
                {qty > 0 && !isDanger && (
                    <div className="mt-2 pt-2 border-t border-current/10 text-[10px] font-bold flex justify-between items-center italic">
                        <span>Projected Balance Post-Op:</span>
                        <span className="font-black text-sm">{(availableQty - qty).toFixed(2)}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-300 relative scrollbar-hide">
                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200">
                            <RefreshCcw size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Stock Transaction</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Inventory Ledger Entry Node</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><X size={28} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-12">
                    {submitSuccess && (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-6 py-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
                            <CheckCircle2 size={24} />
                            <div>
                                <p className="font-black uppercase text-xs tracking-widest">Success</p>
                                <p className="text-sm font-bold">Protocol fully committed. De-allocating viewport…</p>
                            </div>
                        </div>
                    )}

                    {submitError && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl flex items-center gap-4">
                            <AlertCircle size={24} />
                            <div>
                                <p className="font-black uppercase text-xs tracking-widest">Protocol Refusal</p>
                                <p className="text-sm font-bold">{submitError}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Op Mode</h3>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {TRANSACTION_TYPES.map((type) => {
                                const Icon = type.icon;
                                const isActive = form.transactionType === type.value;
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => handleTypeSelect(type.value)}
                                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 relative group overflow-hidden ${isActive
                                            ? `bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200 scale-105 z-10`
                                            : `bg-slate-50 border-transparent text-slate-400 hover:border-slate-200 hover:bg-white`
                                            }`}
                                    >
                                        <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white text-slate-400 group-hover:text-slate-600'}`}>
                                            <Icon size={18} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                                        {isActive && <div className="absolute -bottom-1 left-0 right-0 h-1 bg-indigo-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Contextual Registry</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Package size={12} className="text-indigo-400" /> Product Entity *
                                </label>
                                <select
                                    name="productId"
                                    value={form.productId}
                                    onChange={handleChange}
                                    disabled={dataLoading}
                                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.productId ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat`}
                                >
                                    <option value="">Select Resource…</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                {errors.productId && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-2">{errors.productId}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Warehouse size={12} className={`text-${isTransfer ? 'indigo' : 'emerald'}-400`} />
                                    {isTransfer ? 'Origin Node' : 'Operational Warehouse'} *
                                </label>
                                <select
                                    name="warehouseId"
                                    value={form.warehouseId}
                                    onChange={handleChange}
                                    disabled={dataLoading}
                                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.warehouseId ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat`}
                                >
                                    <option value="">Select Warehouse</option>
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                                {errors.warehouseId && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-2">{errors.warehouseId}</p>}
                            </div>
                        </div>

                        {isTransfer && (
                            <div className="flex flex-col items-center gap-8 animate-in slide-in-from-top-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center border-2 border-indigo-100 shadow-xl shadow-indigo-50 animate-bounce">
                                    <ArrowRight className="rotate-90" />
                                </div>
                                <div className="w-full space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                        <Warehouse size={12} className="text-violet-400" /> Destination Node *
                                    </label>
                                    <select
                                        name="targetWarehouseId"
                                        value={form.targetWarehouseId}
                                        onChange={handleChange}
                                        className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.targetWarehouseId ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1rem_center] bg-no-repeat`}
                                    >
                                        <option value="">Select Target Node…</option>
                                        {warehouses.filter(w => String(w.id) !== String(form.warehouseId)).map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                    {errors.targetWarehouseId && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-2">{errors.targetWarehouseId}</p>}
                                </div>
                            </div>
                        )}

                        {getStockBadge()}
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Resource Parameters</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Hash size={12} className="text-indigo-400" /> Quantitative Magnitude *
                                </label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={form.quantity}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="any"
                                    className={`w-full px-5 py-3.5 bg-slate-50 border ${errors.quantity ? 'border-rose-400' : 'border-slate-200'} rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all`}
                                />
                                {errors.quantity && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-2">{errors.quantity}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Tag size={12} className="text-indigo-400" /> Operational Trace (Ref ID)
                                </label>
                                <input
                                    type="text"
                                    name="referenceId"
                                    value={form.referenceId}
                                    onChange={handleChange}
                                    placeholder="e.g. TR-2026-X"
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all placeholder:font-medium placeholder:italic"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-end pt-8 border-t border-slate-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-10 py-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || submitSuccess}
                            className="px-12 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:grayscale flex items-center gap-3"
                        >
                            {submitting ? (
                                <RefreshCcw size={16} className="animate-spin" />
                            ) : submitSuccess ? (
                                <CheckCircle2 size={16} />
                            ) : (
                                <Plus size={16} />
                            )}
                            {submitting ? 'Streaming Data…' : submitSuccess ? 'Finalized' : 'Execute Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default StockTransactionForm;
