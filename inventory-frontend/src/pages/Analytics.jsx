import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  Clock,
  LayoutDashboard,
  Package,
  TrendingUp,
  FileText,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { analyticsService, pharmacyService, auditService } from '../services/api';


const Analytics = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    kpis: {
      revenue: 0,
      orders: 0,
      lowStock: 0,
      expiringSoon: 0
    },
    salesTrend: [],
    categories: [],
    inventoryItems: [],
    salesOrders: [],
    auditLogs: []
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'inventory', label: 'Inventory Reports', icon: <Package size={18} /> },
    { id: 'sales', label: 'Sales Reports', icon: <TrendingUp size={18} /> },
    { id: 'audit', label: 'Audit Logs', icon: <FileText size={18} /> },
  ];

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const orgId = user.orgId;

        if (!orgId) return;

        const [dashboardRes, pharmacyRes, salesRes, inventoryRes, auditRes] = await Promise.all([
          analyticsService.getDashboard(orgId),
          pharmacyService.getStats(orgId),
          analyticsService.getSalesAnalytics(orgId),
          analyticsService.getInventoryAnalytics(orgId),
          auditService.getByOrganization(orgId)
        ]);

        const dashboard = dashboardRes.data || {};
        const pharmacy = pharmacyRes.data || {};

        const salesData = salesRes.data;
        const salesRaw = Array.isArray(salesData) ? salesData : (salesData?.content ?? salesData?.data ?? []);

        const inventoryData = inventoryRes.data;
        const inventoryRaw = Array.isArray(inventoryData) ? inventoryData : (inventoryData?.content ?? inventoryData?.data ?? []);

        const auditData = auditRes.data;
        const auditRaw = Array.isArray(auditData) ? auditData : (auditData?.content ?? auditData?.data ?? []);

        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const trendData = last7Days.map(date => {
          const dayTotal = salesRaw
            .filter(s => {
              const sDate = s.saleDate ||
                (s.createdAt ? s.createdAt.substring(0, 10) : null) ||
                (s.created_at ? s.created_at.substring(0, 10) : null);
              return sDate === date;
            })
            .reduce((sum, s) => sum + (s.totalAmount || 0), 0);

          const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
          return { name: dayName, sales: dayTotal, fullDate: date };
        });

        const categoryMap = {};
        inventoryRaw.forEach(item => {
          const cat = item.category || 'Other';
          categoryMap[cat] = (categoryMap[cat] || 0) + (item.stockValue || 0);
        });

        const catData = Object.entries(categoryMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
          .map((c, i) => ({
            ...c,
            color: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][i]
          }));

        setData({
          kpis: {
            revenue: dashboard.salesThisMonth?.totalSales || 0,
            orders: dashboard.salesThisMonth?.totalOrders || 0,
            lowStock: dashboard.lowStockAlerts || 0,
            expiringSoon: pharmacy.expiringSoon || 0
          },
          salesTrend: trendData,
          categories: catData.length > 0 ? catData : [
            { name: 'No Data', value: 0, color: '#e5e7eb' }
          ],
          inventoryItems: inventoryRaw,
          salesOrders: salesRaw,
          auditLogs: auditRaw
        });

      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all group">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Monthly Revenue</h3>
            <p className="text-2xl font-black text-slate-800">Rs.{parseFloat(data.kpis.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all group">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Orders</h3>
            <p className="text-2xl font-black text-slate-800">{data.kpis.orders}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all group">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Low Stock</h3>
            <p className="text-2xl font-black text-slate-800">{data.kpis.lowStock}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all group">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Expiring Soon</h3>
            <p className="text-2xl font-black text-slate-800">{data.kpis.expiringSoon}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">7-Day Sales Trend</h4>
          <div className="w-full h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <RefreshCw size={24} className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Processing Trend...</span>
              </div>
            ) : (
              <ResponsiveContainer>
                <LineChart data={data.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      padding: '12px'
                    }}
                    labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#6366f1"
                    strokeWidth={4}
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Top Categories by Value</h4>
          <div className="w-full h-[300px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <RefreshCw size={24} className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Analyzing Inventory...</span>
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={data.categories} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      padding: '10px'
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  >
                    {data.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventoryReports = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Products</span>
          <span className="text-3xl font-black text-slate-800 tracking-tight">{data.inventoryItems.length}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col border-l-4 border-l-indigo-500">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Inventory Value</span>
          <span className="text-3xl font-black text-slate-800 tracking-tight">
            Rs.{data.inventoryItems.reduce((sum, item) => sum + (item.stockValue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Low Stock Priority</span>
          <span className={`text-3xl font-black tracking-tight ${data.kpis.lowStock > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {data.kpis.lowStock}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Inventory Breakdown</h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time asset tracking across organization</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valuation</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.inventoryItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{item.productName || item.name || `Product ${item.productId}`}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{item.productSku || item.sku || `SKU-${item.productId}`}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 italic">{item.category || 'General'}</td>
                  <td className="px-6 py-4 text-sm font-black text-slate-700">{item.stockQuantity !== undefined ? item.stockQuantity : item.quantity}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${(item.isLowStock || (item.quantity <= item.reorderLevel))
                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                      {(item.isLowStock || (item.quantity <= item.reorderLevel)) ? '⚠️ Low Stock' : '✅ Healthy'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-800">Rs.{(item.stockValue !== undefined ? item.stockValue : (item.quantity * (item.unitPrice || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-400 italic">{item.lastMovementDate || item.updatedAt ? new Date(item.lastMovementDate || item.updatedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSalesReports = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Transactions</span>
          <span className="text-3xl font-black text-slate-800 tracking-tight">{data.salesOrders.length}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col border-l-4 border-l-indigo-500">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Merchandise Volume</span>
          <span className="text-3xl font-black text-slate-800 tracking-tight">Rs.{data.salesOrders.reduce((sum, s) => sum + (s.totalAmount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Ticket</span>
          <span className="text-3xl font-black text-slate-800 tracking-tight">
            Rs.{(data.salesOrders.length > 0
              ? data.salesOrders.reduce((sum, s) => sum + (s.totalAmount || 0), 0) / data.salesOrders.length
              : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Sales Analytics</h3>
          <p className="text-xs text-slate-400 mt-0.5">Historical lookup and performance metrics</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Reference</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cart Summary</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stakeholder</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.salesOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4"><span className="text-xs font-black text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded shadow-inner tracking-widest">#{order.orderId || order.id}</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${['DELIVERED', 'PAID', 'COMPLETED'].includes((order.orderStatus || order.status || '').toUpperCase())
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${['DELIVERED', 'PAID', 'COMPLETED'].includes((order.orderStatus || order.status || '').toUpperCase())
                        ? 'bg-emerald-500'
                        : 'bg-amber-500 animate-pulse'
                        }`} />
                      {order.orderStatus || order.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[10px] font-black text-slate-500 uppercase">
                        {(() => {
                          const count = order.totalItems !== undefined
                            ? order.totalItems
                            : (order.items && Array.isArray(order.items))
                              ? order.items.reduce((sum, i) => sum + (i.quantity || 0), 0)
                              : 0;
                          return `${count} Units Total`;
                        })()}
                      </div>
                      {order.items && Array.isArray(order.items) && (
                        <div className="flex gap-1.5 flex-wrap">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <span key={idx} className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {item.product_name || item.productName || `ID-${item.productId}`}
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">+{order.items.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-800 tracking-tight">Rs.{(order.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{order.customerName || order.customer_name || 'Walk-in'}</td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-400 italic">{new Date(order.saleDate || order.createdAt || order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.salesOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-400 italic text-sm">No sales transactions available to analyze.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Security Activity Feed</h3>
          <p className="text-xs text-slate-400 mt-0.5">Automated logging of system mutations</p>
        </div>
        <div className="divide-y divide-slate-50">
          {data.auditLogs.map((log) => (
            <div key={log.id} className="px-8 py-5 hover:bg-indigo-50/20 transition-colors group">
              <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">{new Date(log.timestamp || log.createdAt).toLocaleString()}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors underline decoration-slate-200 underline-offset-4 decoration-2">{log.username || `User #${log.userId}`}</span>
                <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">{log.action}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ON {log.entity} #{log.entityId}</span>
              </div>
              {log.description && <div className="mt-2 text-xs text-slate-500 font-medium bg-slate-50/50 p-2 rounded-lg border border-slate-100 italic">"{log.description}"</div>}
            </div>
          ))}
          {data.auditLogs.length === 0 && (
            <div className="px-6 py-16 text-center text-slate-400 italic text-sm">No administrative logs found.</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <header className="border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analytics & Business Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium italic">Comprehensive system health and performance reporting</p>
      </header>

      <nav className="flex gap-8 border-b border-slate-100 overflow-x-auto scrollbar-hide mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`pb-4 px-1 text-xs font-black uppercase tracking-[0.15em] flex items-center gap-2.5 transition-all relative whitespace-nowrap ${activeTab === tab.id
              ? 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-indigo-600 after:rounded-t-full ring-offset-4'
              : 'text-slate-400 hover:text-slate-600'
              }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-[60vh]">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'inventory' && renderInventoryReports()}
        {activeTab === 'sales' && renderSalesReports()}
        {activeTab === 'audit' && renderAuditLogs()}
      </div>
    </div>
  );
};

export default Analytics;
