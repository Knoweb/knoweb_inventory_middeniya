import { useState, useMemo } from 'react';
import { Search, Eye, CheckCircle2, Package, XCircle, Building2, Undo2 } from 'lucide-react';

const STATUS_META = {
    PENDING: { label: 'Pending', icon: '🕐', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
    APPROVED: { label: 'Approved', icon: '✅', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
    RECEIVED: { label: 'Received', icon: '📦', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    CANCELLED: { label: 'Cancelled', icon: '❌', cls: 'bg-rose-50 text-rose-700 border-rose-100' },
    RETURNED: { label: 'Returned', icon: '↩️', cls: 'bg-purple-50 text-purple-700 border-purple-100' },
};

const formatCurrency = (value) =>
    new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
    }).format(value ?? 0).replace('LKR', 'Rs.');

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-CA');
};

const initials = (name = '') =>
    name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');

function PurchaseOrdersTable({
    orders = [],
    suppliers = [],
    products = [],
    warehouses = [],
    onView,
    onApprove,
    onReceive,
    onCancel,
    onReturn,
    loading = false,
}) {
    const [search, setSearch] = useState('');

    const supplierMap = useMemo(() => {
        const map = {};
        const list = Array.isArray(suppliers) ? suppliers : (suppliers?.content ?? suppliers?.data ?? []);
        list.forEach((s) => { map[s.id] = s.name; });
        return map;
    }, [suppliers]);

    const productMap = useMemo(() => {
        const map = {};
        const list = Array.isArray(products) ? products : (products?.content ?? products?.data ?? []);
        list.forEach((p) => { map[String(p.id)] = p.name; });
        return map;
    }, [products]);

    const warehouseMap = useMemo(() => {
        const map = {};
        const list = Array.isArray(warehouses) ? warehouses : (warehouses?.content ?? warehouses?.data ?? []);
        list.forEach((w) => {
            map[w.id] = w.name || w.warehouseName || `Warehouse #${w.id}`;
        });
        return map;
    }, [warehouses]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = Array.isArray(orders) ? orders : (orders?.content ?? orders?.data ?? []);
        if (!q) return list;
        return list.filter((o) => {
            const supplierName = (supplierMap[o.supplierId] || `Supplier #${o.supplierId}`).toLowerCase();
            return (
                String(o.id).includes(q) ||
                supplierName.includes(q) ||
                (o.status || '').toLowerCase().includes(q)
            );
        });
    }, [orders, search, supplierMap]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-slate-50">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                    <input
                        type="text"
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none w-64 shadow-sm transition-all focus:w-80"
                        placeholder="Search orders (ID, Supplier, Status)…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Found {filtered.length} matching / {orders.length} total
                </span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                        <div className="animate-spin mb-4"><Package size={32} /></div>
                        <p className="text-xs font-black uppercase tracking-widest">Hydrating Orders…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                        <div className="text-5xl mb-4 opacity-50">📋</div>
                        <p className="text-xs font-black uppercase tracking-widest">{search ? 'No orders match search telemetry.' : 'No active purchase records.'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Reference</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Inventory</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fulfillment Loc.</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valuation</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lifecycle</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((order, idx) => {
                                    const supplierName = supplierMap[order.supplierId] || `Supplier #${order.supplierId}`;
                                    const statusMeta = STATUS_META[order.status] || {
                                        label: order.status,
                                        icon: '❓',
                                        cls: 'bg-slate-50 text-slate-400',
                                    };
                                    const isPending = order.status === 'PENDING';
                                    const isApproved = order.status === 'APPROVED';
                                    const isDone = order.status === 'RECEIVED' || order.status === 'CANCELLED' || order.status === 'RETURNED';

                                    return (
                                        <tr key={order.id ?? idx} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded shadow-inner tracking-widest">
                                                    #PO-{String(order.id).padStart(3, '0')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 flex items-center justify-center border border-slate-200 shadow-sm">
                                                        {initials(supplierName)}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-800">{supplierName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[220px]">
                                                    {(order.items || []).length === 0 ? (
                                                        <span className="text-[10px] text-slate-300 italic">No Items</span>
                                                    ) : (
                                                        (order.items || []).map((it, i) => (
                                                            <span key={i} className="px-2 py-1 bg-indigo-50/50 text-indigo-600 text-[9px] font-black uppercase rounded-lg border border-indigo-100/50 whitespace-nowrap">
                                                                {productMap[String(it.productId)] || `#${it.productId}`}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {order.warehouseId ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 text-[10px] font-black uppercase rounded-full border border-sky-100">
                                                        <Building2 size={10} /> {warehouseMap[order.warehouseId] || `WH-${order.warehouseId}`}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300 italic">Not Assigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formatDate(order.createdAt)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-slate-900 tracking-tight">
                                                    {formatCurrency(order.totalAmount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm inline-flex items-center gap-1.5 ${statusMeta.cls}`}>
                                                    <span className="text-xs">{statusMeta.icon}</span> {statusMeta.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                                                        onClick={() => onView?.(order)}
                                                        title="View details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    {isPending && (
                                                        <button
                                                            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all font-black text-[10px] flex items-center gap-1.5"
                                                            onClick={() => onApprove?.(order.id)}
                                                        >
                                                            <CheckCircle2 size={14} /> APPROVE
                                                        </button>
                                                    )}

                                                    {isApproved && (
                                                        <button
                                                            className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all font-black text-[10px] flex items-center gap-1.5"
                                                            onClick={() => onReceive?.(order.id)}
                                                        >
                                                            <Package size={14} /> RECEIVE
                                                        </button>
                                                    )}
                                                    
                                                    {order.status === 'RECEIVED' && (
                                                        <button
                                                            className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-100 transition-all font-black text-[10px] flex items-center gap-1.5"
                                                            onClick={() => onReturn?.(order.id)}
                                                            title="Return items to supplier"
                                                        >
                                                            <Undo2 size={14} /> RETURN
                                                        </button>
                                                    )}

                                                    {!isDone && (
                                                        <button
                                                            className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100 shadow-sm transition-all"
                                                            onClick={() => onCancel?.(order.id)}
                                                            title="Cancel order"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!loading && filtered.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 rounded-lg text-center font-black text-[10px] text-slate-400 uppercase tracking-[0.3em]">
                    End of Ledger — {filtered.length} total entries visualized
                </div>
            )}
        </div>
    );
}

export default PurchaseOrdersTable;
