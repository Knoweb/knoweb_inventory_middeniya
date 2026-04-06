import { useEffect, useState } from 'react';
import { FaBox, FaWarehouse, FaShoppingCart, FaChartLine, FaExclamationTriangle, FaDollarSign } from 'react-icons/fa';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, ArrowLeftRight, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { analyticsService, productService, warehouseService, orderService, inventoryService } from '../services/api';
import CrossAppNavButton from '../components/CrossAppNavButton';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStockItems: 0,
    totalOrders: 0,
    warehouses: 0,
    activeWarehouses: 0,
    inactiveWarehouses: 0,
    lowStockAlerts: 0,
    totalStockValue: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [productMap, setProductMap] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  const asArray = (value) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (Array.isArray(value?.content)) {
      return value.content;
    }
    if (Array.isArray(value?.data)) {
      return value.data;
    }
    if (Array.isArray(value?.items)) {
      return value.items;
    }
    return [];
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const orgId = user.orgId;

      if (!orgId) {
        setError('Organization ID not found. Please login again.');
        setLoading(false);
        return;
      }

      const [
        dashboardData,
        products,
        warehouses,
        purchaseOrders,
        salesOrders,
        stocks,
        transactions
      ] = await Promise.allSettled([
        analyticsService.getDashboard(orgId),
        productService.getAll(),
        warehouseService.getByOrganization(orgId),
        orderService.getPurchaseOrders(),
        orderService.getSalesOrders(),
        inventoryService.getAllStocks(),
        inventoryService.getAllTransactions()
      ]);

      const dashboardMetrics = dashboardData.status === 'fulfilled' ? dashboardData.value.data : {};
      const inventory = dashboardMetrics.inventory || {};
      const salesThisMonth = dashboardMetrics.salesThisMonth || {};

      const productList = products.status === 'fulfilled' ? asArray(products.value.data) : [];
      const warehouseList = warehouses.status === 'fulfilled' ? asArray(warehouses.value.data) : [];
      const purchaseOrderList = purchaseOrders.status === 'fulfilled' ? asArray(purchaseOrders.value.data) : [];
      const salesOrderList = salesOrders.status === 'fulfilled' ? asArray(salesOrders.value.data) : [];
      const stockList = stocks.status === 'fulfilled' ? asArray(stocks.value.data) : [];
      const transactionList = transactions.status === 'fulfilled' ? asArray(transactions.value.data) : [];

      const totalProducts = productList.length;
      const totalWarehouses = warehouseList.length;
      const activeWarehouses = warehouseList.filter(w => w.isActive !== false).length;
      const inactiveWarehouses = totalWarehouses - activeWarehouses;
      const totalPurchaseOrders = purchaseOrderList.length;
      const totalSalesOrders = salesOrderList.length;
      const totalOrders = totalPurchaseOrders + totalSalesOrders;

      let pendingOrdersCount = 0;
      if (purchaseOrderList.length > 0) {
        pendingOrdersCount += purchaseOrderList.filter(
          order => order.status === 'PENDING' || order.status === 'PROCESSING'
        ).length;
      }
      if (salesOrderList.length > 0) {
        pendingOrdersCount += salesOrderList.filter(
          order => order.status === 'PENDING' || order.status === 'PROCESSING'
        ).length;
      }

      const totalStockItems = stockList.length > 0
        ? stockList.reduce((sum, stock) => sum + (stock.quantity || 0), 0)
        : 0;

      const pMap = {};
      if (productList.length > 0) {
        productList.forEach(p => { pMap[p.id] = p.name || p.productName || `Product #${p.id}`; });
      }
      setProductMap(pMap);

      const recentTransactions = transactionList.length > 0
        ? [...transactionList]
          .sort((a, b) => new Date(b.createdAt || b.transactionDate) - new Date(a.createdAt || a.transactionDate))
          .slice(0, 8)
        : [];

      let lowStockCount = 0;
      if (stockList.length > 0) {
        lowStockCount = stockList.filter((stock) => {
          const qty = stock.quantity ?? 0;
          const reorder = stock.reorderLevel ?? stock.reorder_level ?? 10;
          return qty > 0 && qty <= reorder;
        }).length;
      }

      let totalStockValue = 0;
      if (stockList.length > 0) {
        totalStockValue = stockList.reduce((sum, stock) => {
          const qty = stock.quantity ?? 0;
          const price = stock.unitPrice ?? stock.unit_price ?? 0;
          return sum + qty * price;
        }, 0);
      }

      setStats({
        totalProducts: inventory.totalProducts || totalProducts,
        totalStockItems: totalStockItems,
        totalOrders: salesThisMonth.totalOrders || totalOrders,
        warehouses: totalWarehouses,
        activeWarehouses,
        inactiveWarehouses,
        lowStockAlerts: lowStockCount,
        totalStockValue: inventory.totalStockValue || totalStockValue,
        pendingOrders: pendingOrdersCount
      });

      setRecentActivity(recentTransactions);

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard data. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(value).replace('LKR', 'Rs.');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return '—';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTypeMeta = (type) => {
    switch (type) {
      case 'IN': return { Icon: ArrowDownCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Stock In' };
      case 'OUT': return { Icon: ArrowUpCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Stock Out' };
      case 'TRANSFER': return { Icon: ArrowLeftRight, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Transfer' };
      case 'ADJUSTMENT': return { Icon: SlidersHorizontal, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Adjustment' };
      case 'RETURN': return { Icon: RotateCcw, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Return' };
      default: return { Icon: RefreshCw, color: 'text-gray-600', bg: 'bg-gray-100', label: type || '—' };
    }
  };

  const formatQty = (type, qty) => {
    if (!qty && qty !== 0) return '—';
    const isPositive = ['IN', 'ADJUSTMENT', 'RETURN'].includes(type);
    return (isPositive ? '+' : '-') + Math.abs(qty);
  };

  const buildNotes = (txn) => {
    const ref = txn.referenceId;
    const raw = txn.notes;
    if (raw && raw.trim()) return raw;
    if (!ref) return '—';
    if (ref.startsWith('SO-')) return `Sales order fulfillment — #${ref}`;
    if (ref.startsWith('PO-')) return `Purchase received — #${ref}`;
    return `Ref: ${ref}`;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="mb-8 border-b-2 border-gray-100 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome to Inventory Management System</p>
          </div>
          <div className="w-48 h-10 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
          <RefreshCw className="animate-spin mb-4" size={32} />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="mb-8 border-b-2 border-gray-100 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome to Inventory Management System</p>
        </div>
        <CrossAppNavButton />
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 shadow-sm animate-in slide-in-from-top">
          <FaExclamationTriangle className="flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:shadow-md hover:-translate-y-1">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Products</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
          </div>
          <div className="text-blue-500 bg-blue-50 p-3 rounded-lg">
            <FaBox size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:shadow-md hover:-translate-y-1">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Stock Items</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalStockItems.toLocaleString()}</p>
          </div>
          <div className="text-emerald-500 bg-emerald-50 p-3 rounded-lg">
            <FaWarehouse size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:shadow-md hover:-translate-y-1">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
            {stats.pendingOrders > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase mt-1 inline-block">
                {stats.pendingOrders} pending
              </span>
            )}
          </div>
          <div className="text-amber-500 bg-amber-50 p-3 rounded-lg">
            <FaShoppingCart size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:shadow-md hover:-translate-y-1">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Warehouses</h3>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold text-gray-900">{stats.warehouses}</p>
              <div className="w-px h-8 bg-gray-100 mx-1" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-black text-emerald-600 leading-none">{stats.activeWarehouses}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-black text-rose-600 leading-none">{stats.inactiveWarehouses}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-purple-500 bg-purple-50 p-3 rounded-lg flex-shrink-0">
            <FaChartLine size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:shadow-md hover:-translate-y-1">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Low Stock</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.lowStockAlerts}</p>
          </div>
          <div className="text-red-500 bg-red-50 p-3 rounded-lg">
            <FaExclamationTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:shadow-md hover:-translate-y-1">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Stock Value</h3>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalStockValue)}</p>
          </div>
          <div className="text-green-600 bg-green-50 p-3 rounded-lg">
            <FaChartLine size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-95"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center text-gray-400">
            <RefreshCw size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">No recent transactions to display.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentActivity.map((txn, idx) => {
                  const { Icon, color, bg, label } = getTypeMeta(txn.type);
                  const productName = productMap[txn.productId] || txn.productName || `Product #${txn.productId}`;
                  const qty = formatQty(txn.type, txn.quantity);
                  const isPositive = qty.startsWith('+');
                  const dateStr = formatDate(txn.createdAt || txn.transactionDate);
                  const notes = buildNotes(txn);

                  return (
                    <tr key={txn.id ?? idx} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-bold text-[10px] uppercase shadow-sm ${bg} ${color}`}>
                          <Icon size={12} strokeWidth={3} />
                          {label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">
                        {productName}
                      </td>
                      <td className={`px-6 py-4 font-extrabold text-sm tabular-nums ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {qty}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-400 line-clamp-1 max-w-[240px]" title={notes}>
                          {notes}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
