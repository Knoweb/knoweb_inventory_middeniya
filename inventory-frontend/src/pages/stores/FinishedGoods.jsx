import React, { useState, useEffect } from "react";
import { Package, Layers, Box, CheckCircle2, RefreshCw, Trash2 } from "lucide-react";
import { manufacturingService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const FinishedGoods = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [finishedBatches, setFinishedBatches] = useState([]);
  const [batchToDelete, setBatchToDelete] = useState(null);

  const fetchFinishedGoods = async () => {
    setLoading(true);
    try {
      // 1. Fetch ALL manufacturing products for this org to ensure we don't miss SCRAPPED fragments
      const orgId = user?.orgId;
      const res = await manufacturingService.getByOrganization(orgId);
      const allData = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      
      // 1. Enhanced Union-Find to group by ALL possible links
      const parent = {};
      const find = (i) => {
        if (parent[i] === undefined || parent[i] === i) return i;
        return parent[i] = find(parent[i]);
      };
      const union = (i, j) => {
        const rootI = find(i);
        const rootJ = find(j);
        if (rootI !== rootJ) parent[rootI] = rootJ;
      };

      // Link by hierarchy (Parent/Root) and by IDs
      allData.forEach(batch => {
        if (batch.parentProductId) union(batch.id, batch.parentProductId);
        if (batch.rootProductId) union(batch.id, batch.rootProductId);
      });

      // Link by String Identifiers (Work Order and Batch)
      const identifierMap = {};
      allData.forEach(batch => {
        const ids = [
          batch.workOrderNumber ? `WO_${batch.workOrderNumber}` : null,
          batch.batchNumber ? `BN_${String(batch.batchNumber).split('-QC')[0].replace(/-[0-9]{4}$/, '').trim()}` : null
        ].filter(Boolean);

        ids.forEach(id => {
          if (!identifierMap[id]) identifierMap[id] = batch.id;
          else union(batch.id, identifierMap[id]);
        });
      });

      const groupedMap = {};
      allData.forEach(batch => {
        const rootId = find(batch.id);
        const attr = batch.manufacturingAttributes || {};
        
        if (!groupedMap[rootId]) {
          groupedMap[rootId] = {
            id: rootId,
            baseNumber: batch.workOrderNumber || batch.batchNumber || `WO-${rootId}`,
            itemName: attr.itemName || batch.itemName || 'Finished Component',
            updatedAt: batch.updatedAt || batch.createdAt,
            allFragments: [],
            hasFinishedGoods: false
          };
        }

        const group = groupedMap[rootId];
        const status = batch.wipStatus || batch.status;

        if (status === 'FINISHED_GOOD') group.hasFinishedGoods = true;
        group.allFragments.push(batch);
        
        const currentBatchDate = new Date(batch.updatedAt || batch.createdAt);
        const groupDate = new Date(group.updatedAt);
        if (currentBatchDate > groupDate) {
          group.updatedAt = batch.updatedAt || batch.createdAt;
          // Prefer Work Order for the title if available
          if (batch.workOrderNumber) group.baseNumber = batch.workOrderNumber;
        }
      });

      const aggregated = Object.values(groupedMap)
        .filter(group => group.hasFinishedGoods)
        .map(group => {
          let finalOutput = 0;
          let maxObservedQty = 0;
          
          // Map fragments for parent lookup
          const fragmentMap = {};
          group.allFragments.forEach(f => { fragmentMap[f.id] = f; });

          const getStageDeltaSum = (stageKey) => {
            let stageTotal = 0;
            const attrKey = stageKey.toLowerCase() + 'Scrap';
            
            // To avoid double-counting inherited values from a missing parent
            // we only treat the fragment with the LARGEST quantity as the "Original Root"
            // if multiple fragments claim to have no parent in this list.
            const roots = group.allFragments.filter(f => !f.parentProductId || !fragmentMap[f.parentProductId]);
            const mainRootId = roots.length > 0 
              ? roots.reduce((prev, current) => (parseInt(prev.quantity || 0) > parseInt(current.quantity || 0)) ? prev : current).id 
              : null;

            group.allFragments.forEach(f => {
              const attr = f.manufacturingAttributes || {};
              const currentVal = parseInt(attr[attrKey] || 0) + (stageKey === 'PRIMARY' ? parseInt(attr['scrapRecorded'] || 0) : 0);
              
              if (f.id === mainRootId) {
                // Main root: Count the entire value
                stageTotal += currentVal;
              } else if (f.parentProductId && fragmentMap[f.parentProductId]) {
                // Normal child: Count only the increase from its parent
                const parentAttr = fragmentMap[f.parentProductId].manufacturingAttributes || {};
                const parentVal = parseInt(parentAttr[attrKey] || 0) + (stageKey === 'PRIMARY' ? parseInt(parentAttr['scrapRecorded'] || 0) : 0);
                stageTotal += Math.max(0, currentVal - parentVal);
              } else if (!f.parentProductId || !fragmentMap[f.parentProductId]) {
                // Parallel branch/split that happened before our data window:
                // If it's NOT the main root, its initial value is likely inherited.
                // We should only count its scrap if it has a SCRAPPED status.
                const status = f.wipStatus || f.status;
                if (status === 'SCRAPPED' && (attr.lastStage === stageKey || attr.sentToQcFrom === stageKey || attr.bornInStage === stageKey)) {
                  // If the scrap counter is 0 but it's a scrapped fragment, use its quantity
                  stageTotal += (currentVal > 0) ? 0 : parseInt(f.quantity || attr.quantity || 0);
                }
                // Any counter increase on this parallel branch? Hard to know without parent.
                // But usually, deltas are captured in the children of this branch.
              }
            });
            return stageTotal;
          };

          const moldingScrap = getStageDeltaSum('MOLDING');
          const assembleScrap = getStageDeltaSum('ASSEMBLE');
          const primaryScrap = getStageDeltaSum('PRIMARY');

          group.allFragments.forEach(f => {
            const status = f.wipStatus || f.status;
            const attr = f.manufacturingAttributes || {};
            const qty = parseInt(f.quantity || attr.quantity || 0);

            if (status === 'FINISHED_GOOD') finalOutput += qty;
            if (qty > maxObservedQty) maxObservedQty = qty;
          });

          const totalScrap = moldingScrap + assembleScrap + primaryScrap;
          const startedQty = Math.max(maxObservedQty, finalOutput + totalScrap);

          return {
            ...group,
            startedQty,
            finalOutput,
            totalScrap,
            moldingScrap,
            assembleScrap,
            primaryScrap,
            originalRecords: group.allFragments.map(f => f.id)
          };
        })
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
          onClick={fetchFinishedGoods}
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
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${batch.isFullyProcessed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {batch.isFullyProcessed ? 'Complete' : 'Processing'}
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        FINISHED_GOOD
                      </span>
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
                        <span>Molding Scrap</span>
                        <Layers size={10} className="opacity-50" />
                      </div>
                      <div className="text-xl font-black text-rose-600">{batch.moldingScrap}</div>
                    </div>

                    {/* Assemble Stats */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 relative group">
                      <div className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center justify-between">
                        <span>Assemble Scrap</span>
                        <Box size={10} className="opacity-50" />
                      </div>
                      <div className="text-xl font-black text-rose-600">{batch.assembleScrap}</div>
                    </div>

                    {/* Primary Stats */}
                    <div className="bg-indigo-50/50 rounded-2xl p-3 border border-indigo-100/50 relative group">
                      <div className="text-[9px] font-black text-indigo-400 mb-2 uppercase tracking-widest flex items-center justify-between">
                        <span>Primary Scrap</span>
                        <CheckCircle2 size={10} className="opacity-50" />
                      </div>
                      <div className="text-xl font-black text-rose-600">{batch.primaryScrap}</div>
                    </div>
                  </div>
                  
                  {/* Summary Footer */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-2xl p-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Started Qty
                      </span>
                      <span className="text-base font-black text-slate-700">
                        {batch.startedQty}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                        Final Output
                      </span>
                      <span className="text-base font-black text-indigo-600">
                        {batch.finalOutput}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-rose-400/80 uppercase tracking-widest mb-1">
                        Total Scrap
                      </span>
                      <span className="text-base font-black text-rose-600">
                        {batch.totalScrap}
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
