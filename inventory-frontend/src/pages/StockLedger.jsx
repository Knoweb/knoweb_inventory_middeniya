import React, { useState, useEffect } from 'react';
import { ledgerService, productService, warehouseService } from '../services/api';
import {
  BookOpen,
  Package,
  Warehouse,
  BarChart3,
  Calculator,
  Search,
  MapPin,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Layers,
  Archive
} from 'lucide-react';

const StockLedger = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [valuation, setValuation] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [valuationStrategy, setValuationStrategy] = useState('FIFO');
  const [viewType, setViewType] = useState('product'); // product or warehouse

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setError(null);
      const [productsRes, warehousesRes] = await Promise.all([
        productService.getAll(),
        warehouseService.getAll()
      ]);
      const pData = productsRes.data;
      const pList = Array.isArray(pData) ? pData : (pData?.content ?? pData?.data ?? []);
      setProducts(pList);

      const wData = warehousesRes.data;
      const wList = Array.isArray(wData) ? wData : (wData?.content ?? wData?.data ?? []);
      setWarehouses(wList.filter(w => w.isActive !== false));
    } catch (error) {
      console.error('Error fetching options:', error);
      setError("Infrastructure Connectivity Error: Failed to synchronize catalog and warehouse nodes.");
    }
  };

  const fetchLedger = async () => {
    if (!selectedProduct && !selectedWarehouse) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLedgerData([]);
      setValuation(null);

      if (viewType === 'product' && selectedProduct) {
        const [ledgerRes, valuationRes] = await Promise.all([
          ledgerService.getByProduct(selectedProduct),
          ledgerService.getProductValuation(selectedProduct, valuationStrategy)
        ]);
        const lData = ledgerRes.data;
        const lList = Array.isArray(lData) ? lData : (lData?.content ?? lData?.data ?? []);
        setLedgerData(lList);
        setValuation(valuationRes.data);
      } else if (viewType === 'warehouse' && selectedWarehouse) {
        const [ledgerRes, valuationRes] = await Promise.all([
          ledgerService.getByWarehouse(selectedWarehouse),
          ledgerService.getWarehouseValuation(selectedWarehouse, valuationStrategy)
        ]);
        const lData = ledgerRes.data;
        const lList = Array.isArray(lData) ? lData : (lData?.content ?? lData?.data ?? []);
        setLedgerData(lList);
        setValuation(valuationRes.data);
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
      setError(error.userMessage || "Analysis Protocol Failure: Global asset sync is currently offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex justify-between items-start border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Stock Ledger</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3 ml-1">Universal Asset Tracking & Valuation Protocol</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : (error ? 'bg-rose-500' : 'bg-emerald-500')}`} />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {loading ? 'Processing Analysis' : (error ? 'Protocol Error' : 'System Synchronized')}
            </span>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-start gap-4 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="text-rose-500 shrink-0 mt-1" size={24} />
          <div className="space-y-2">
            <h4 className="text-sm font-black text-rose-800 uppercase tracking-widest italic">Analysis Exception Detected</h4>
            <p className="text-xs font-semibold text-rose-600/80 leading-relaxed">{error}</p>
            <button
              onClick={() => error.includes('catalog') ? fetchOptions() : fetchLedger()}
              className="mt-2 px-4 py-2 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-200 transition-colors"
            >
              Attempt Protocol Restart
            </button>
          </div>
        </div>
      )}

      {/* Analysis Protocol (Filters) */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8 animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="w-1.5 h-8 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)]" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Analysis Protocol</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* View Selection */}
          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Structural Pivot</label>
            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              <button
                onClick={() => setViewType('product')}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewType === 'product' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Product
              </button>
              <button
                onClick={() => setViewType('warehouse')}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewType === 'warehouse' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Warehouse
              </button>
            </div>
          </div>

          {/* Node Selection */}
          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Target {viewType === 'product' ? 'Identifier' : 'Node'}
            </label>
            <div className="relative">
              {viewType === 'product' ? (
                <>
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all uppercase tracking-widest appearance-none shadow-inner"
                  >
                    <option value="">Select ID...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} [{p.sku}]</option>)}
                  </select>
                </>
              ) : (
                <>
                  <Warehouse className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all uppercase tracking-widest appearance-none shadow-inner"
                  >
                    <option value="">Select Node...</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Logic Strategy */}
          <div className="space-y-3">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Valuation Logic</label>
            <div className="relative">
              <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <select
                value={valuationStrategy}
                onChange={(e) => setValuationStrategy(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all uppercase tracking-widest appearance-none shadow-inner"
              >
                <option value="FIFO">FIFO (First In, First Out)</option>
                <option value="LIFO">LIFO (Last In, First Out)</option>
                <option value="WEIGHTED_AVERAGE">Weighted Average</option>
              </select>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex flex-col justify-end pb-0.5">
            <button
              onClick={fetchLedger}
              disabled={loading || (!selectedProduct && !selectedWarehouse)}
              className="w-full py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-slate-200 hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <BarChart3 size={14} />}
              Compute Ledger
            </button>
          </div>
        </div>

        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 flex gap-4 items-start">
          <Info className="text-indigo-400 shrink-0" size={20} />
          <div className="space-y-1">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{valuationStrategy} Protocol Activated:</span>
            <p className="text-[11px] font-semibold text-slate-500 leading-relaxed italic">
              {valuationStrategy === 'FIFO' && 'Chronological issuing from oldest nodes. Optimizes for accurate ending inventory value in inflationary markets.'}
              {valuationStrategy === 'LIFO' && 'Reverse chronological issuing from most recent nodes. Maximizes recent cost alignment with revenue streams.'}
              {valuationStrategy === 'WEIGHTED_AVERAGE' && 'Dynamic uniform price calculation. Smooths volatility across entire stock history.'}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Matrix (Valuation Summary) */}
      {valuation && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in zoom-in-95 duration-500">
          <div className="bg-white p-8 rounded-[2rem] border-l-4 border-indigo-500 shadow-xl shadow-slate-200/50 space-y-4">
            <div className="flex justify-between items-start">
              <Archive className="text-slate-200" size={24} />
              <Layers className="text-indigo-500" size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Asset Volume</p>
              <h4 className="text-3xl font-black text-slate-800 italic">{valuation.totalQuantity || 0}</h4>
              <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase italic tracking-tighter">Verified Units in Stack</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border-l-4 border-emerald-500 shadow-xl shadow-slate-200/50 space-y-4">
            <div className="flex justify-between items-start">
              <DollarSign className="text-slate-200" size={24} />
              <TrendingUp className="text-emerald-500" size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Asset Valuation</p>
              <h4 className="text-3xl font-black text-slate-800 italic">
                Rs.{valuation.totalValue ? parseFloat(valuation.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
              </h4>
              <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase italic tracking-tighter">Gross Inventory Equity</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border-l-4 border-amber-500 shadow-xl shadow-slate-200/50 space-y-4">
            <div className="flex justify-between items-start">
              <Calculator className="text-slate-200" size={24} />
              <BarChart3 className="text-amber-500" size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Unit Average</p>
              <h4 className="text-3xl font-black text-slate-800 italic">
                Rs.{valuation.averageCost ? parseFloat(valuation.averageCost).toFixed(2) : '0.00'}
              </h4>
              <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase italic tracking-tighter">Computational Cost / Unit</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border-l-4 border-slate-900 shadow-xl shadow-slate-200/50 space-y-4 flex flex-col justify-center bg-slate-50/50">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em]">Active Logic</p>
            <h4 className="text-2xl font-black text-slate-900 tracking-tighter italic leading-none">{valuationStrategy}</h4>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Protocol Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* Movement Ledger (Table) */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-slate-200">
            <RefreshCw className="animate-spin mb-6" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Compiling Ledger Streams…</p>
          </div>
        ) : ledgerData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-slate-200">
            <div className="p-8 bg-slate-50 rounded-full mb-6">
              <BookOpen size={64} className="opacity-20 text-slate-400" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">No ledger data initialized</h3>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 italic">Select a structural unit to begin analysis</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Timestamp</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Logic Type</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Entity Metadata</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right font-mono">Quantities</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right font-mono">Financials</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right font-mono italic">Node Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ledgerData.map((entry, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-3">
                        <Clock size={14} className="text-slate-300" />
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">
                          {entry.date ? new Date(entry.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className={`px-4 py-1.5 rounded-full inline-flex items-center gap-2 border text-[9px] font-black uppercase tracking-widest ${entry.type === 'IN'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-[0_2px_10px_rgba(16,185,129,0.1)]'
                        : 'bg-rose-50 text-rose-600 border-rose-100 shadow-[0_2px_10px_rgba(239,68,68,0.1)]'
                        }`}>
                        {entry.type === 'IN' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                        {entry.type || entry.transactionType || '-'}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-800 uppercase italic tracking-tight">{entry.productName || entry.productId || '-'}</div>
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">
                          <MapPin size={10} />
                          {entry.warehouseName || entry.warehouseId || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <span className={`text-lg font-black italic tracking-tighter ${entry.type === 'OUT' ? 'text-rose-500' : 'text-slate-800'}`}>
                        {entry.type === 'OUT' && '−'}
                        {entry.quantity || 0}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="space-y-1">
                        <div className="text-xs font-black text-slate-700 tracking-tight">Rs.{parseFloat(entry.unitCost || 0).toFixed(2)}</div>
                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none italic">Total: Rs.{parseFloat(entry.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right bg-slate-50/30">
                      <span className="text-lg font-black text-slate-900 tracking-widest italic">{entry.balance || entry.runningBalance || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Logic Documentation */}
      <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white overflow-hidden relative border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Calculator size={300} />
        </div>

        <header className="mb-12 border-b border-white/10 pb-8 flex justify-between items-end">
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tight">Computational Costing Models</h3>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-3">Advanced Inventory Valuation Standards</p>
          </div>
          <BookOpen className="text-indigo-400" size={32} />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-5 group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 font-black italic">01</div>
              <h4 className="font-black uppercase tracking-widest text-sm italic">FIFO Logic</h4>
            </div>
            <p className="text-xs text-white/50 leading-relaxed font-medium">
              Assumes the oldest inventory items are sold first. This typically results in a higher ending inventory value and lower COGS during periods of inflation, reflective of modern market replacements.
            </p>
          </div>

          <div className="space-y-5 group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 font-black italic">02</div>
              <h4 className="font-black uppercase tracking-widest text-sm italic">LIFO Logic</h4>
            </div>
            <p className="text-xs text-white/50 leading-relaxed font-medium">
              Matches current costs against current revenues by assuming most recent stock is issued first. Significant for tax optimization in specific regulatory frameworks during inflationary cycles.
            </p>
          </div>

          <div className="space-y-5 group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 font-black italic">03</div>
              <h4 className="font-black uppercase tracking-widest text-sm italic">Weighted Average</h4>
            </div>
            <p className="text-xs text-white/50 leading-relaxed font-medium">
              Calculates a moving average cost for all available units. Eliminates individual price volatility and provides a balanced financial perspective on asset equity across the ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockLedger;
