import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Info,
    ArrowUpCircle,
    ArrowDownCircle,
    AlertCircle,
    TrendingUp,
    Star,
    RefreshCw,
    MapPin,
    Package,
    Calculator,
    Layers,
    Clock,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';
import { ledgerService, valuationService, productService, warehouseService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StockLedgerValuation = () => {
    const { user } = useAuth();
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [method, setMethod] = useState('FIFO');

    const [ledgerData, setLedgerData] = useState([]);
    const [valuationData, setValuationData] = useState(null);

    // Fetch products and warehouses scoped to the user's organization
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user?.orgId) return;

            try {
                const orgId = user.orgId;
                const [productsRes, warehousesRes] = await Promise.all([
                    productService.getByOrganization(orgId),
                    warehouseService.getByOrganization(orgId)
                ]);

                const pData = productsRes.data;
                const pList = Array.isArray(pData) ? pData : (pData?.content ?? pData?.data ?? []);

                const wData = warehousesRes.data;
                const wList = Array.isArray(wData) ? wData : (wData?.content ?? wData?.data ?? []);

                const activeWarehouses = wList.filter(w => w.isActive !== false);
                setProducts(pList);
                setWarehouses(activeWarehouses);

                if (activeWarehouses.length > 0) {
                    setSelectedWarehouseId(activeWarehouses[0].id.toString());
                }
            } catch (err) {
                console.error("Failed to fetch organization data:", err);
                setError("Infrastructure Connectivity Error: Failed to synchronize catalog and warehouse nodes.");
            }
        };

        fetchInitialData();
    }, [user?.orgId]);

    const methodDescriptions = {
        FIFO: 'First-In, First-Out: Assumes that the oldest inventory items are sold first. This results in current costs being matched with revenue on the balance sheet.',
        LIFO: 'Last-In, First-Out: Assumes that the most recently acquired items are sold first. This can be beneficial for tax purposes during periods of inflation.',
        'WEIGHTED_AVERAGE': 'Weighted Average Cost: Calculates a mean cost for all inventory items based on the total cost of units purchased divided by the total number of units.'
    };

    const handleLoad = async () => {
        if (!selectedProductId || !selectedWarehouseId) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [ledgerRes, valuationRes] = await Promise.all([
                ledgerService.getByProductAndWarehouse(selectedProductId, selectedWarehouseId),
                valuationService.compareMethods(selectedProductId, selectedWarehouseId)
            ]);

            const lData = ledgerRes.data;
            const lList = Array.isArray(lData) ? lData : (lData?.content ?? lData?.data ?? []);
            setLedgerData(lList);
            setValuationData(valuationRes.data);
            setIsLoaded(true);
        } catch (err) {
            console.error("Data fetch error:", err);
            setError(err.userMessage || "Analysis Protocol Failure: The requested asset nodes are currently unreachable.");
        } finally {
            setIsLoading(false);
        }
    };

    const isRecommended = (m) => valuationData?.recommendedMethod === m;

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Header Section */}
            <header className="flex justify-between items-start border-b border-slate-100 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Unified Valuation</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3 ml-1">Universal Asset Ledger & Cross-Method Analysis</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : (error ? 'bg-rose-500' : 'bg-indigo-500')}`} />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {isLoading ? 'Computing Analysis' : (error ? 'Protocol Error' : 'Intelligence Active')}
                        </span>
                    </div>
                </div>
            </header>

            {/* Analysis Protocol (Filter Card) */}
            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)]" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Ledger Targeting Protocol</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                            <MapPin size={10} /> Structural Node
                        </label>
                        <select
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all uppercase tracking-widest appearance-none shadow-inner"
                            value={selectedWarehouseId}
                            onChange={(e) => setSelectedWarehouseId(e.target.value)}
                        >
                            <option value="">Select Warehouse...</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                            <Package size={10} /> Asset Identifier
                        </label>
                        <select
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all uppercase tracking-widest appearance-none shadow-inner"
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                        >
                            <option value="">Select Product...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} [{p.sku}]</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                            <Calculator size={10} /> Valuation Logic
                        </label>
                        <select
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all uppercase tracking-widest appearance-none shadow-inner"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                        >
                            <option value="FIFO">FIFO (First-In, First-Out)</option>
                            <option value="LIFO">LIFO (Last-In, First-Out)</option>
                            <option value="WEIGHTED_AVERAGE">Weighted Average</option>
                        </select>
                    </div>

                    <div className="flex flex-col justify-end">
                        <button
                            className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-slate-200 hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 transition-all active:scale-95 flex items-center justify-center gap-3"
                            onClick={handleLoad}
                            disabled={isLoading || !selectedProductId || !selectedWarehouseId}
                        >
                            {isLoading ? <RefreshCw className="animate-spin" size={14} /> : <TrendingUp size={14} />}
                            Initialize Analysis
                        </button>
                    </div>
                </div>

                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 flex gap-4 items-start">
                    <Info className="text-indigo-400 shrink-0" size={20} />
                    <div className="space-y-1">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Methodology Protocol: {method}</span>
                        <p className="text-[11px] font-semibold text-slate-500 leading-relaxed italic">
                            {methodDescriptions[method] || methodDescriptions['FIFO']}
                        </p>
                    </div>
                </div>
            </section>

            {error && (
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] flex items-start gap-5 animate-in slide-in-from-top-2 duration-300">
                    <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                        <AlertCircle size={24} />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-black text-rose-800 uppercase tracking-widest italic">Analysis Protocol failure</h4>
                        <p className="text-xs font-semibold text-rose-600/80 leading-relaxed max-w-2xl">{error}</p>
                        <button
                            onClick={handleLoad}
                            className="mt-4 px-6 py-2.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
                        >
                            Emergency Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content (Table or Empty State) */}
            <section className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[400px]">
                {!isLoaded ? (
                    <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
                        <div className="p-10 bg-slate-50 rounded-full">
                            <BookOpen className="text-slate-200" size={64} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">No movement data initialized</h3>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Target a structural unit and asset to begin financial analysis</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Type</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Volume</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Financials</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Batch Total</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right italic font-mono">Running Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {ledgerData.length > 0 ? ledgerData.map((row, idx) => {
                                    const isOut = (row.quantityOut > 0 || row.transactionType === 'OUT' || row.type === 'OUT');
                                    const quantity = !isOut ? (row.quantityIn || row.quantity) : (row.quantityOut || row.quantity);

                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-3">
                                                    <Clock size={14} className="text-slate-300" />
                                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">
                                                        {row.transactionDate ? new Date(row.transactionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className={`px-4 py-1.5 rounded-full inline-flex items-center gap-2 border text-[9px] font-black uppercase tracking-widest ${!isOut ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_2px_10px_rgba(16,185,129,0.1)]' : 'bg-rose-50 text-rose-600 border-rose-100 shadow-[0_2px_10px_rgba(239,68,68,0.1)]'}`}>
                                                    {!isOut ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                                    {row.transactionType || row.type}
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <span className={`text-lg font-black italic tracking-tighter ${isOut ? 'text-rose-500' : 'text-slate-800'}`}>
                                                    {isOut ? '−' : '+'} {quantity} <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Units</span>
                                                </span>
                                            </td>
                                            <td className="px-10 py-8 text-right text-xs font-black text-slate-700 tracking-tight">
                                                Rs.{parseFloat(row.unitCost || 0).toFixed(2)}
                                            </td>
                                            <td className="px-10 py-8 text-right text-sm font-black text-slate-900 italic">
                                                Rs.{parseFloat(row.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-10 py-8 text-right bg-slate-50/30">
                                                <span className="text-lg font-black text-indigo-600 tracking-widest italic">{row.runningBalance || row.quantityBalance}</span>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="6" className="text-center py-20 text-slate-300 text-[10px] font-black uppercase tracking-widest italic">No movement sequences detected in targeted nodes.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Valuation Summary Section */}
            {valuationData && (
                <section className="space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-4">
                        <TrendingUp className="text-indigo-600" size={32} />
                        <h2 className="text-2xl font-black italic text-slate-900 uppercase tracking-tight">Financial Comparative Matrix</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* FIFO Card */}
                        <div className={`bg-white p-8 rounded-[2.5rem] border shadow-xl shadow-slate-200/50 space-y-6 relative overflow-hidden transition-all hover:-translate-y-2 ${isRecommended('FIFO') ? 'border-amber-400' : 'border-slate-100'}`}>
                            {isRecommended('FIFO') && (
                                <div className="absolute top-0 right-0 bg-amber-400 text-white px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Star size={10} fill="currentColor" /> System Recommended
                                </div>
                            )}
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Asset Logic</p>
                                <h4 className="text-xl font-black text-slate-800 italic uppercase">FIFO Evaluation</h4>
                            </div>
                            <h5 className="text-4xl font-black text-slate-900 tracking-tighter">
                                Rs.{(valuationData?.fifoValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h5>
                            <p className="text-[10px] font-semibold text-slate-400 leading-relaxed uppercase italic">
                                Values remaining stack using oldest cost sequence. Optimizes reported equity value in inflationary growth cycles.
                            </p>
                        </div>

                        {/* LIFO Card */}
                        <div className={`bg-white p-8 rounded-[2.5rem] border shadow-xl shadow-slate-200/50 space-y-6 relative overflow-hidden transition-all hover:-translate-y-2 ${isRecommended('LIFO') ? 'border-amber-400' : 'border-slate-100'}`}>
                            {isRecommended('LIFO') && (
                                <div className="absolute top-0 right-0 bg-amber-400 text-white px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Star size={10} fill="currentColor" /> System Recommended
                                </div>
                            )}
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Asset Logic</p>
                                <h4 className="text-xl font-black text-slate-800 italic uppercase">LIFO Evaluation</h4>
                            </div>
                            <h5 className="text-4xl font-black text-slate-900 tracking-tighter">
                                Rs.{(valuationData?.lifoValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h5>
                            <p className="text-[10px] font-semibold text-slate-400 leading-relaxed uppercase italic">
                                Aligns newest costs with current revenue. Critical methodology for specific cross-border tax optimization.
                            </p>
                        </div>

                        {/* Weighted Avg Card */}
                        <div className={`bg-white p-8 rounded-[2.5rem] border shadow-xl shadow-slate-200/50 space-y-6 relative overflow-hidden transition-all hover:-translate-y-2 ${isRecommended('WEIGHTED_AVERAGE') ? 'border-amber-400' : 'border-slate-100'}`}>
                            {isRecommended('WEIGHTED_AVERAGE') && (
                                <div className="absolute top-0 right-0 bg-amber-400 text-white px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Star size={10} fill="currentColor" /> System Recommended
                                </div>
                            )}
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Asset Logic</p>
                                <h4 className="text-xl font-black text-slate-800 italic uppercase">Weighted Average</h4>
                            </div>
                            <h5 className="text-4xl font-black text-slate-900 tracking-tighter">
                                Rs.{(valuationData?.weightedAvgValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </h5>
                            <p className="text-[10px] font-semibold text-slate-400 leading-relaxed uppercase italic">
                                Dynamic mean cost distribution across entire node history. Provides maximum stability for longitudinal reporting.
                            </p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default StockLedgerValuation;
