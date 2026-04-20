import React, { useState, useEffect } from "react";
import { Warehouse, ShoppingCart, AlertTriangle, Activity, RefreshCw, Layers, CheckCircle2, Package, Box } from "lucide-react";
import { inventoryService, orderService, manufacturingService } from "../../services/api";

const StoresDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [finishedBatches, setFinishedBatches] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [ordersRes, stocksRes, txRes, wipRes] = await Promise.allSettled([
          orderService.getPurchaseOrders(),
          inventoryService.getAllStocks(),
          inventoryService.getAllTransactions(),
          manufacturingService.getWip()
        ]);

        // Process Wip Batches (Finished Goods)
        if (wipRes.status === "fulfilled") {
          const wipData = Array.isArray(wipRes.value.data) ? wipRes.value.data : (wipRes.value.data?.content ?? wipRes.value.data?.data ?? []);
          const finished = wipData.filter(b => b.wipStatus === 'FINISHED_GOOD' || b.status === 'FINISHED_GOOD');
          setFinishedBatches(finished);
        }

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Stock Keeper Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of raw materials, recent activities, and purchase orders.</p>
        </div>

        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Activity size={18} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('finished_goods')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'finished_goods'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Package size={18} />
            Finished Goods
            {finishedBatches.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ml-1 ${activeTab === 'finished_goods' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                {finishedBatches.length}
              </span>
            )}
          </button>
        </div>
      </div>
      <div className="mb-8"></div>
      
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
      
      {!loading && activeTab === 'finished_goods' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <Package size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manufactured Finished Goods</h2>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Batches Passed from Primary Finishing to Stores</p>
              </div>
            </div>

            {finishedBatches.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                <Package size={48} className="mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest opacity-40">No Finished Goods Received Yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {finishedBatches.map((batch, idx) => (
                  <div key={batch.id || idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {batch.status || batch.wipStatus || 'FINISHED_GOOD'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-right">
                        <div>ID: {batch.id}</div>
                        <div>{new Date(batch.updatedAt || batch.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-1">
                      {batch.manufacturingAttributes?.batchNumber || batch.batchNumber || batch.workOrderNumber || `BATCH-${batch.id}`}
                    </h3>
                    <p className="text-sm font-extrabold text-indigo-500 mb-6 uppercase tracking-wider">
                      {batch.manufacturingAttributes?.itemName || batch.itemName || 'Finished Component'}
                    </p>
                    
                    <div className="mt-auto grid grid-cols-3 gap-2">
                      {/* Molding Stats */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 relative group">
                        <div className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center justify-between">
                          <span>Molding</span>
                          <Layers size={10} className="opacity-50" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Process Qty</span>
                            <span className="text-sm font-black text-slate-700">{batch.quantity || batch.manufacturingAttributes?.quantity || 0}</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-rose-500/70 uppercase">Scrap Limit</span>
                            <span className="text-sm font-black text-rose-600">{batch.manufacturingAttributes?.moldingScrap || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Assemble Stats */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 relative group">
                        <div className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center justify-between">
                          <span>Assemble</span>
                          <Box size={10} className="opacity-50" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Process Qty</span>
                            <span className="text-sm font-black text-slate-700">{batch.quantity || batch.manufacturingAttributes?.quantity || 0}</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-rose-500/70 uppercase">Scrap Limit</span>
                            <span className="text-sm font-black text-rose-600">{batch.manufacturingAttributes?.assembleScrap || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Primary Stats */}
                      <div className="bg-indigo-50/50 rounded-2xl p-3 border border-indigo-100/50 relative group">
                        <div className="text-[9px] font-black text-indigo-400 mb-2 uppercase tracking-widest flex items-center justify-between">
                          <span>Primary</span>
                          <CheckCircle2 size={10} className="opacity-50" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-indigo-500 uppercase">Final Output</span>
                            <span className="text-sm font-black text-indigo-700">{batch.quantity || batch.manufacturingAttributes?.quantity || 0}</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-rose-500/70 uppercase">Scrap Limit</span>
                            <span className="text-sm font-black text-rose-600">{batch.manufacturingAttributes?.primaryScrap || 0}</span>
                          </div>
                        </div>
                      </div>
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

