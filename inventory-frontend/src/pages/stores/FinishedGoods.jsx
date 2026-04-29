import React, { useState, useEffect } from "react";
import { Package, Layers, Box, CheckCircle2, RefreshCw, Trash2 } from "lucide-react";
import { manufacturingService } from "../../services/api";

const FinishedGoods = () => {
  const [loading, setLoading] = useState(true);
  const [finishedBatches, setFinishedBatches] = useState([]);
  const [batchToDelete, setBatchToDelete] = useState(null);

  const fetchFinishedGoods = async () => {
    setLoading(true);
    try {
      const wipRes = await manufacturingService.getWip();
      const wipData = Array.isArray(wipRes.data) ? wipRes.data : (wipRes.data?.content ?? wipRes.data?.data ?? []);
      
      // AGGREGATION LOGIC: Group ALL records by Base Batch Number first
      const groupedMap = {};

      wipData.forEach(batch => {
        const fullNumber = batch.manufacturingAttributes?.batchNumber || batch.batchNumber || batch.workOrderNumber || `BATCH-${batch.id}`;
        const baseNumber = String(fullNumber).replace(/-QC$/, '').trim();
        
        if (!groupedMap[baseNumber]) {
          groupedMap[baseNumber] = {
            id: batch.id,
            baseNumber: baseNumber,
            itemName: batch.manufacturingAttributes?.itemName || batch.itemName || 'Finished Component',
            updatedAt: batch.updatedAt || batch.createdAt,
            totalQuantity: 0,
            moldingPassed: 0,
            moldingScrap: 0,
            assemblePassed: 0,
            assembleScrap: 0,
            primaryPassed: 0,
            primaryScrap: 0,
            originalRecords: [],
            isFullyProcessed: true, // Optimistic start
            hasFinishedGoods: false
          };
        }

        const attr = batch.manufacturingAttributes || {};
        const group = groupedMap[baseNumber];
        const status = batch.wipStatus || batch.status;

        // Check if this specific fragment is "Finished"
        const isFinished = status === 'FINISHED_GOOD' || status === 'SCRAPPED';
        
        // If ANY fragment is still in progress, the whole batch is not fully processed
        if (!isFinished) {
          group.isFullyProcessed = false;
        }

        // If at least one fragment reached Finished Good, we mark it as having output
        if (status === 'FINISHED_GOOD') {
          group.hasFinishedGoods = true;
        }

        // Accumulate Final Output quantity ONLY for records that actually reached stores
        if (status === 'FINISHED_GOOD') {
          group.totalQuantity += parseInt(batch.quantity || attr.quantity || 0);
        }
        
        // Accumulate totals for stage metrics
        group.moldingPassed += parseInt(attr.moldingPassedQty || 0);
        group.moldingScrap += parseInt(attr.moldingScrap || 0);
        group.assemblePassed += parseInt(attr.assemblePassedQty || 0);
        group.assembleScrap += parseInt(attr.assembleScrap || 0);
        group.primaryPassed += parseInt(attr.primaryPassedQty || 0);
        group.primaryScrap += parseInt(attr.primaryScrap || 0);
        
        const currentBatchDate = new Date(batch.updatedAt || batch.createdAt);
        const groupDate = new Date(group.updatedAt);
        if (currentBatchDate > groupDate) group.updatedAt = batch.updatedAt || batch.createdAt;
        
        group.originalRecords.push(batch.id);
      });

      // FILTERING: Only show groups that are fully processed AND have at least some finished goods
      const aggregated = Object.values(groupedMap)
        .filter(group => group.isFullyProcessed && group.hasFinishedGoods)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      setFinishedBatches(aggregated);
    } catch (error) {
      console.error('Error fetching finished goods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;
    try {
      // Delete all records associated with this base batch
      if (batchToDelete.originalRecords && batchToDelete.originalRecords.length > 0) {
        for (const id of batchToDelete.originalRecords) {
          await manufacturingService.delete(id);
        }
      } else {
        await manufacturingService.delete(batchToDelete.id);
      }
      fetchFinishedGoods();
    } catch (error) {
      console.error('Error deleting batch:', error);
    } finally {
      setBatchToDelete(null);
    }
  };

  useEffect(() => {
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
                      <div className="flex items-start gap-4">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-right">
                          <div>ID: {batch.id}</div>
                          <div>{new Date(batch.updatedAt || batch.createdAt).toLocaleDateString()}</div>
                        </div>
                        <button
                          onClick={() => setBatchToDelete(batch)}
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                          title="Delete Batch"
                        >
                          <Trash2 size={16} />
                        </button>                        </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{batch.baseNumber}</h3>
                  <p className="text-sm font-extrabold text-indigo-500 mb-6 uppercase tracking-wider">{batch.itemName}</p>
                  
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
                          <span className="text-sm font-black text-slate-700">{batch.moldingPassed}</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold text-rose-500/70 uppercase">Scrap Limit</span>
                          <span className="text-sm font-black text-rose-600">{batch.moldingScrap}</span>
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
                          <span className="text-sm font-black text-slate-700">{batch.assemblePassed}</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold text-rose-500/70 uppercase">Scrap Limit</span>
                          <span className="text-sm font-black text-rose-600">{batch.assembleScrap}</span>
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
                          <span className="text-sm font-black text-indigo-700">{batch.totalQuantity}</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold text-rose-500/70 uppercase">Scrap Limit</span>
                          <span className="text-sm font-black text-rose-600">{batch.primaryScrap}</span>
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
                          {batch.moldingPassed + batch.moldingScrap}
                        </span>
                      </div>
                      <div className="w-px h-8 bg-slate-200"></div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-rose-400/80 uppercase tracking-widest mb-1">
                          Total Scrap
                        </span>
                        <span className="text-base font-black text-rose-600">
                          {batch.moldingScrap + batch.assembleScrap + batch.primaryScrap}
                        </span>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>
      )}

      {batchToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6">
                <Trash2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Delete Finished Good</h2>
              <p className="text-slate-500 mt-3 font-medium">
                Are you sure you want to permanently delete{" "}
                <span className="font-bold text-slate-700">
                  {batchToDelete.manufacturingAttributes?.batchNumber || batchToDelete.batchNumber || batchToDelete.workOrderNumber || `BATCH-${batchToDelete.id}`}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-4 w-full mt-8">
              <button
                onClick={() => setBatchToDelete(null)}
                className="flex-1 px-4 py-3 rounded-2xl font-black text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors uppercase tracking-wider text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBatch}
                className="flex-1 px-4 py-3 rounded-2xl font-black text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-200 hover:shadow-rose-300 transition-all active:scale-95 uppercase tracking-wider text-sm flex justify-center items-center gap-2"
              >
                <Trash2 size={18} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinishedGoods;
