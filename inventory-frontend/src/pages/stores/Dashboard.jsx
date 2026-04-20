import React, { useState, useEffect } from "react";
import { Warehouse, ShoppingCart, AlertTriangle, Activity, RefreshCw } from "lucide-react";
import { inventoryService, orderService } from "../../services/api";

const StoresDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [ordersRes, stocksRes, txRes] = await Promise.allSettled([
          orderService.getPurchaseOrders(),
          inventoryService.getAllStocks(),
          inventoryService.getAllTransactions()
        ]);

        // Process Orders
        if (ordersRes.status === "fulfilled") {
          const ordersData = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : (ordersRes.value.data?.content ?? ordersRes.value.data?.data ?? []);
          setTotalOrders(ordersData.length);
          setPendingOrders(ordersData.filter(o => o.status === "PENDING").length);
        }

        // Process Stocks (Low stock & valuation)
        if (stocksRes.status === "fulfilled") {
          const stocksData = Array.isArray(stocksRes.value.data) ? stocksRes.value.data : (stocksRes.value.data?.content ?? stocksRes.value.data?.data ?? []);
          
          let countLow = 0;
          let totalVal = 0;

          stocksData.forEach(item => {
            const qty = Number(item.quantity) || 0;
            const threshold = Number(item.minimumStockLevel) || Number(item.reorderLevel) || 10;
            const price = Number(item.unitPrice) || Number(item.cost) || 0;
            
            if (qty < threshold) countLow++;
            totalVal += qty * price;
          });

          setLowStockCount(countLow);
          setTotalValue(totalVal);
        }

        // Process Recent Activity
        if (txRes.status === "fulfilled") {
          let txData = Array.isArray(txRes.value.data) ? txRes.value.data : (txRes.value.data?.content ?? txRes.value.data?.data ?? []);
          
          // Sort by creation date descending
          txData.sort((a, b) => new Date(b.createdAt || b.transactionDate) - new Date(a.createdAt || a.transactionDate));
          setRecentActivity(txData.slice(0, 6)); // top 6
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Stock Keeper Dashboard</h1>
      <p className="text-gray-600 mb-8">Overview of raw materials, recent activities, and purchase orders.</p>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300">
          <RefreshCw size={40} className="animate-spin mb-4" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Dashboard Metrics...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Purchase Orders Widget */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                <div className="text-4xl font-black text-slate-800 tracking-tight">{totalOrders}</div>
                {pendingOrders > 0 && (
                  <div className="mt-2 inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-md">
                    {pendingOrders} Pending
                  </div>
                )}
              </div>
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                <ShoppingCart size={32} />
              </div>
            </div>

            {/* Low Stock Alerts Widget */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Low Stock Alerts</p>
                <div className={`text-4xl font-black tracking-tight ${lowStockCount > 0 ? "text-rose-600" : "text-slate-800"}`}>
                  {lowStockCount}
                </div>
                {lowStockCount > 0 && (
                  <div className="mt-2 inline-flex items-center px-2 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-widest rounded-md">
                    Requires Attention
                  </div>
                )}
              </div>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${lowStockCount > 0 ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-400"}`}>
                <AlertTriangle size={32} />
              </div>
            </div>

            {/* Total Stock Value Widget (Optional / Secondary metric) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Stock Valuation</p>
                <div className="text-3xl font-black text-slate-800 tracking-tight mt-1">
                  Rs.{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="mt-2 inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-md">
                  Active Value
                </div>
              </div>
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                <Warehouse size={32} />
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
            <div className="px-6 py-5 border-b border-slate-50 flex items-center gap-3">
              <Activity className="text-indigo-500" size={20} />
              <h2 className="text-lg font-black text-slate-800">Recent Activity</h2>
            </div>
            
            {recentActivity.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
                No recent inventory transactions to display.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentActivity.map((tx, idx) => (
                  <div key={tx.id || idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Transaction Type Indicator */}
                      {tx.type === "STOCK_IN" || tx.transactionType === "IN" || String(tx.type).includes("IN") ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-[10px] uppercase tracking-tighter">IN</div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-black text-[10px] uppercase tracking-tighter">OUT</div>
                      )}
                      
                      <div>
                        <p className="text-sm font-bold text-slate-800 truncate max-w-[250px] md:max-w-md">
                          {tx.productName || tx.itemName || `Product #${tx.productId}`}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {new Date(tx.createdAt || tx.transactionDate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-700">
                        {tx.type === "STOCK_IN" || tx.transactionType === "IN" || String(tx.type).includes("IN") ? "+" : "-"}{tx.quantity} Units
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                         {tx.referenceNote || tx.description || "System Updated"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default StoresDashboard;



