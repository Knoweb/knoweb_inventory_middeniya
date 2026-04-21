import React, { useState, useEffect } from "react";
import { Package, Layers, Box, CheckCircle2, RefreshCw } from "lucide-react";
import { manufacturingService } from "../../services/api";

const FinishedGoods = () => {
  const [loading, setLoading] = useState(true);
  const [finishedBatches, setFinishedBatches] = useState([]);

  useEffect(() => {
    const fetchFinishedGoods = async () => {
      setLoading(true);
      try {
        const wipRes = await manufacturingService.getWip();
        const wipData = Array.isArray(wipRes.data) ? wipRes.data : (wipRes.data?.content ?? wipRes.data?.data ?? []);
        const finished = wipData.filter(b => b.wipStatus === 'FINISHED_GOOD' || b.status === 'FINISHED_GOOD');
        // Let's reverse to show most recent first
        setFinishedBatches(finished.reverse());
      } catch (error) {
        console.error('Error fetching finished goods:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinishedGoods();
  }, []);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Finished Goods</h1>
          <p className="text-gray-600 mt-1">Batches Passed from Primary Finishing to Stores.</p>
        </div>
        <button 
          onClick={() => {
            setLoading(true);
            manufacturingService.getWip().then(wipRes => {
              const wipData = Array.isArray(wipRes.data) ? wipRes.data : (wipRes.data?.content ?? wipRes.data?.data ?? []);
              const finished = wipData.filter(b => b.wipStatus === 'FINISHED_GOOD' || b.status === 'FINISHED_GOOD');
              setFinishedBatches(finished.reverse());
            }).finally(() => setLoading(false));
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-bold text-sm shadow-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300">
          <RefreshCw size={40} className="animate-spin mb-4" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Finished Goods...</span>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <Package size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manufactured Finished Goods</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Total {finishedBatches.length} Batches Received</p>
            </div>
          </div>

          {finishedBatches.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
              <Package size={48} className="mb-4 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest opacity-40">No Finished Goods Received Yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                          <span className="text-sm font-black text-slate-700">
                            {parseInt(batch.quantity || batch.manufacturingAttributes?.quantity || 0) + 
                             parseInt(batch.manufacturingAttributes?.assembleScrap || 0) + 
                             parseInt(batch.manufacturingAttributes?.primaryScrap || 0)}
                          </span>
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
                          <span className="text-sm font-black text-slate-700">
                            {parseInt(batch.quantity || batch.manufacturingAttributes?.quantity || 0) + 
                             parseInt(batch.manufacturingAttributes?.primaryScrap || 0)}
                          </span>
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
                    {/* Summary Footer */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-2xl p-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Started Qty
                        </span>
                        <span className="text-base font-black text-slate-700">
                          {parseInt(batch.quantity || batch.manufacturingAttributes?.quantity || 0) + 
                           parseInt(batch.manufacturingAttributes?.moldingScrap || 0) + 
                           parseInt(batch.manufacturingAttributes?.assembleScrap || 0) + 
                           parseInt(batch.manufacturingAttributes?.primaryScrap || 0)}
                        </span>
                      </div>
                      <div className="w-px h-8 bg-slate-200"></div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-rose-400/80 uppercase tracking-widest mb-1">
                          Total Scrap
                        </span>
                        <span className="text-base font-black text-rose-600">
                          {parseInt(batch.manufacturingAttributes?.moldingScrap || 0) + 
                           parseInt(batch.manufacturingAttributes?.assembleScrap || 0) + 
                           parseInt(batch.manufacturingAttributes?.primaryScrap || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinishedGoods;
