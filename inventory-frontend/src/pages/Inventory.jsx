import { useEffect, useState, useCallback } from 'react';
import { inventoryService } from '../services/api';
import StockTransactionForm from '../components/StockTransactionForm';
import { Package, Plus, Search, RefreshCw, ArrowDownLeft, ArrowUpRight, Repeat, Scale, Undo2, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_META = {
  IN: { label: 'Stock In', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <ArrowDownLeft size={14} />, border: 'border-emerald-100' },
  OUT: { label: 'Stock Out', color: 'text-rose-600', bg: 'bg-rose-50', icon: <ArrowUpRight size={14} />, border: 'border-rose-100' },
  TRANSFER: { label: 'Transfer', color: 'text-amber-600', bg: 'bg-amber-50', icon: <Repeat size={14} />, border: 'border-amber-100' },
  ADJUSTMENT: { label: 'Adjustment', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <Scale size={14} />, border: 'border-indigo-100' },
  RETURN: { label: 'Return', color: 'text-cyan-600', bg: 'bg-cyan-50', icon: <Undo2 size={14} />, border: 'border-cyan-100' },
};

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || { label: type, color: 'text-slate-600', bg: 'bg-slate-50', icon: <Package size={14} />, border: 'border-slate-100' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${meta.bg} ${meta.color} ${meta.border} shadow-sm`}>
      {meta.icon} {meta.label}
    </span>
  );
}

function StockLevelBar({ quantity, reorderLevel }) {
  if (!reorderLevel || reorderLevel === 0) return <span className="text-sm font-black text-slate-700">{quantity ?? 0}</span>;

  const maxScale = reorderLevel * 2;
  const pct = Math.min(100, Math.round((quantity / maxScale) * 100));

  const colorClass = quantity <= 0 ? 'bg-rose-500' : quantity <= reorderLevel ? 'bg-amber-500' : 'bg-emerald-500';
  const textColorClass = quantity <= 0 ? 'text-rose-600' : quantity <= reorderLevel ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="flex flex-col gap-1.5 min-w-[100px]" title={`Stock: ${quantity} / Reorder Level: ${reorderLevel}`}>
      <span className={`text-[11px] font-black ${textColorClass}`}>{quantity ?? 0} <span className="text-[9px] text-slate-300 font-bold">/ {reorderLevel}</span></span>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
        <div className={`h-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

function Inventory() {
  const [stocks, setStocks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stocks');
  const [showForm, setShowForm] = useState(false);
  const [txFilter, setTxFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stocksRes, txRes] = await Promise.all([
        inventoryService.getAllStocks(),
        inventoryService.getAllTransactions(),
      ]);
      const sData = stocksRes.data;
      const tData = txRes.data;
      setStocks(Array.isArray(sData) ? sData : (sData?.content ?? sData?.data ?? []));
      setTransactions(Array.isArray(tData) ? tData : (tData?.content ?? tData?.data ?? []));
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalItems = stocks.length;
  const totalQty = stocks.reduce((s, x) => s + (x.quantity || 0), 0);
  const lowStockCount = stocks.filter(x => (x.reorderLevel && x.quantity <= x.reorderLevel) || x.reorderLevel === null || x.reorderLevel === undefined).length;
  const outOfStockCount = stocks.filter(x => (x.quantity || 0) <= 0).length;

  const filteredTx = transactions.filter(tx => {
    const matchType = txFilter === 'ALL' || tx.type === txFilter;
    const matchSearch = !searchTerm ||
      String(tx.productId).includes(searchTerm) ||
      String(tx.warehouseId).includes(searchTerm) ||
      (tx.referenceId || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const filteredStocks = stocks.filter(s =>
    !searchTerm ||
    String(s.productId).includes(searchTerm) ||
    String(s.warehouseId).includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <RefreshCw className="animate-spin mb-4" size={32} />
        <p className="text-sm font-medium tracking-wide uppercase">Processing Warehouse Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
            <Package size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Inventory Management</h1>
            <p className="text-sm text-slate-500 font-medium">Track stock levels, movements, and transactions across all warehouses</p>
          </div>
        </div>
        <button
          className="px-8 py-3 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} /> New Transaction
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 group hover:shadow-md transition-all">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold group-hover:scale-110 transition-transform"><Package size={20} /></div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total SKUs</span>
            <span className="text-xl font-black text-slate-800">{totalItems}</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 group hover:shadow-md transition-all">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold group-hover:scale-110 transition-transform">🔢</div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Units</span>
            <span className="text-xl font-black text-slate-800">{totalQty.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 group hover:shadow-md transition-all">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-500 font-bold group-hover:scale-110 transition-transform"><AlertCircle size={20} /></div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Low Stock</span>
            <span className={`text-xl font-black ${lowStockCount > 0 ? 'text-amber-500' : 'text-slate-800'}`}>
              {lowStockCount}
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 group hover:shadow-md transition-all">
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-500 font-bold group-hover:scale-110 transition-transform"><XCircle size={20} /></div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Out of Stock</span>
            <span className={`text-xl font-black ${outOfStockCount > 0 ? 'text-rose-500' : 'text-slate-800'}`}>
              {outOfStockCount}
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 group hover:shadow-md transition-all">
          <div className="p-2.5 rounded-lg bg-cyan-50 text-cyan-600 font-bold group-hover:scale-110 transition-transform"><CheckCircle2 size={20} /></div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Movement Log</span>
            <span className="text-xl font-black text-slate-800">{transactions.length}</span>
          </div>
        </div>
      </div>

      {/* ── Main Card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

        {/* ── Toolbar ── */}
        <div className="p-4 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4 bg-slate-50/30">
          <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl shadow-inner">
            <button
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'stocks' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setActiveTab('stocks')}
            >
              🏷️ Stock Levels
              <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'stocks' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>{stocks.length}</span>
            </button>
            <button
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'transactions' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setActiveTab('transactions')}
            >
              📋 Transactions
              <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'transactions' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>{transactions.length}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
              <input
                type="text"
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none w-64 transition-all focus:w-80 shadow-sm"
                placeholder="Search by product or warehouse ID…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {activeTab === 'transactions' && (
              <select
                className="text-xs font-black text-slate-700 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 p-2 outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors uppercase tracking-tighter"
                value={txFilter}
                onChange={e => setTxFilter(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="IN">📥 Stock In</option>
                <option value="OUT">📤 Stock Out</option>
                <option value="TRANSFER">🔄 Transfer</option>
                <option value="ADJUSTMENT">⚖️ Adjustment</option>
                <option value="RETURN">↩️ Return</option>
              </select>
            )}
            <button
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all shadow-sm active:rotate-180 duration-500"
              onClick={fetchData}
              title="Refresh data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* ── Table Content ── */}
        <div className="overflow-x-auto">
          {activeTab === 'stocks' ? (
            filteredStocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-300">
                <div className="text-6xl mb-4 opacity-50">📭</div>
                <p className="font-black uppercase tracking-[0.2em] text-sm">No stock records found</p>
                <button className="mt-4 px-6 py-2 bg-indigo-50 text-indigo-600 font-black text-[10px] rounded-lg uppercase tracking-widest hover:bg-indigo-100 transition-colors" onClick={() => setShowForm(true)}>+ Add First Transaction</button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Warehouse</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Avail.</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Resv.</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Level Stats</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStocks.map((stock, idx) => {
                    const isLow = stock.reorderLevel && stock.quantity <= stock.reorderLevel && stock.quantity > 0;
                    const isOut = (stock.quantity || 0) <= 0;
                    const isUnconfigured = stock.reorderLevel === null || stock.reorderLevel === undefined;

                    const status = isOut ? 'out' : (isLow || isUnconfigured) ? 'low' : 'ok';
                    const statusMeta = {
                      ok: { label: 'In Stock', color: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
                      low: { label: 'Low Stock', color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' },
                      out: { label: 'Out of Stock', color: 'text-rose-700', bg: 'bg-rose-100', dot: 'bg-rose-500' },
                    }[status];

                    return (
                      <tr key={stock.id} className={`hover:bg-slate-50 transition-colors group ${isOut ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                        <td className="px-6 py-4 text-[10px] font-black text-slate-300 uppercase tracking-tighter">{idx + 1}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-700">{stock.productName || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="opacity-50">🏢</span>
                            <span className="text-sm font-semibold text-slate-700">{stock.warehouseName || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`${statusMeta.bg} ${statusMeta.color} px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm border border-white/50`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot} ${status === 'low' || status === 'out' ? 'animate-pulse' : ''}`} />
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-black text-slate-800">{stock.availableQuantity ?? 0}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm font-black ${(stock.reservedQuantity || 0) > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>{stock.reservedQuantity ?? 0}</span>
                        </td>
                        <td className="px-6 py-4"><StockLevelBar quantity={stock.quantity} reorderLevel={stock.reorderLevel} /></td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-400 italic tracking-tighter uppercase whitespace-nowrap">{formatDate(stock.updatedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : (
            filteredTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-300">
                <div className="text-6xl mb-4 opacity-50">📋</div>
                <p className="font-black uppercase tracking-[0.2em] text-sm">No transactions found</p>
                <button className="mt-4 px-6 py-2 bg-indigo-50 text-indigo-600 font-black text-[10px] rounded-lg uppercase tracking-widest hover:bg-indigo-100 transition-colors" onClick={() => setShowForm(true)}>+ Record Transaction</button>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Seq</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">TX ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Locative</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Delta</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTx.map((tx, idx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-[10px] font-black text-slate-300 uppercase tracking-tighter">{idx + 1}</td>
                      <td className="px-6 py-4"><span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded shadow-inner tracking-widest">#{tx.id}</span></td>
                      <td className="px-6 py-4"><TypeBadge type={tx.type} /></td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-700">{tx.productName || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="opacity-50">🏢</span>
                          <span className="text-sm font-semibold text-slate-700">{tx.warehouseName || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-black ${tx.type === 'IN' || tx.type === 'RETURN' ? 'text-emerald-600'
                          : tx.type === 'OUT' || tx.type === 'TRANSFER' ? 'text-rose-600'
                            : 'text-slate-400'
                          }`}>
                          {tx.type === 'OUT' || tx.type === 'TRANSFER' ? '−' : '+'}{tx.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-400 tracking-tighter max-w-[150px] truncate">{tx.referenceId || '—'}</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-400 italic tracking-tighter uppercase whitespace-nowrap">{formatDate(tx.createdAt || tx.transactionDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* ── Table Footer ── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
            Computed Analysis: Rendering {activeTab === 'stocks' ? filteredStocks.length : filteredTx.length} of {activeTab === 'stocks' ? stocks.length : transactions.length} distinct entries
          </span>
          <div className="flex gap-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-indigo-500 animate-ping' : 'bg-emerald-500'}`} />
          </div>
        </div>
      </div>

      {/* ── Stock Transaction Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <StockTransactionForm
              onClose={() => setShowForm(false)}
              onSuccess={() => {
                setShowForm(false);
                fetchData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
