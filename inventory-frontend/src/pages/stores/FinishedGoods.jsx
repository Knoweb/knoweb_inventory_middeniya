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
      const orgId = user?.orgId;
      
      // Fetch ALL manufacturing records for this organization
      const res = await manufacturingService.getByOrganization(orgId);
      const allRecords = Array.isArray(res.data) ? res.data : (res.data?.content || res.data?.data || []);

      // Group records by batch identifier (workOrderNumber or batchNumber)
      const batchGroups = {};

      allRecords.forEach(record => {
        // Use workOrderNumber as primary key, fallback to batchNumber, fallback to id
        const batchKey = record.workOrderNumber || record.batchNumber || `BATCH_${record.id}`;
        
        if (!batchGroups[batchKey]) {
          batchGroups[batchKey] = [];
        }
        batchGroups[batchKey].push(record);
      });

      // Process each batch group to find finished goods
      const finishedGoodsList = [];

      Object.entries(batchGroups).forEach(([batchKey, records]) => {
        // Sort records by date to get the sequence
        const sortedRecords = [...records].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.created_at || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.created_at || b.updatedAt || 0);
          return dateA - dateB;
        });

        // Check if any record in the group is marked as FINISHED_GOOD
        const finishedRecord = sortedRecords.find(r => r.wipStatus === 'FINISHED_GOOD' || r.status === 'FINISHED_GOOD');
        
        if (!finishedRecord) return; // Skip if no finished good in this batch

        // Get the FIRST Molding record to find the original started quantity
        const moldingRecord = sortedRecords.find(r => r.wipStatus === 'WIP_MOLDING' || r.wipStatus === 'INJECTION_MOLDING');
        const moldingAttr = moldingRecord?.manufacturingAttributes || {};
        
        // Started Qty = quantity from the molding creation (what we started with)
        // Priority: Molding record's quantity field > Molding attributes.quantity > First record quantity > 0
        let startedQty = 0;
        
        if (moldingRecord) {
          startedQty = parseInt(
            moldingRecord?.quantity ||
            moldingAttr?.quantity ||
            moldingAttr?.startedQty ||
            0
          );
        }
        
        // Fallback: If no molding record found, use first record
        if (startedQty === 0 && sortedRecords.length > 0) {
          const firstRecord = sortedRecords[0];
          const firstAttr = firstRecord?.manufacturingAttributes || {};
          startedQty = parseInt(
            firstRecord?.quantity ||
            firstAttr?.quantity ||
            firstAttr?.startedQty ||
            0
          );
        }
        
        // Get the LATEST record in the sequence for final output and scrap values
        const latestRecord = sortedRecords[sortedRecords.length - 1];
        const latestAttr = latestRecord.manufacturingAttributes || {};

        // Final Output = quantity from the LATEST record (what we ended with)
        const finalQuantity = parseInt(latestRecord.quantity || latestAttr.quantity || 0);

        // Extract scrap values from the final record (these should have accumulated values)
        const moldingScrap = parseInt(latestAttr.moldingScrap || 0);
        const assembleScrap = parseInt(latestAttr.assembleScrap || 0);
        const primaryScrap = parseInt(latestAttr.primaryScrap || 0);
        const totalScrap = moldingScrap + assembleScrap + primaryScrap;

        finishedGoodsList.push({
          id: finishedRecord.id,
          baseNumber: finishedRecord.workOrderNumber || finishedRecord.batchNumber || `BATCH-${finishedRecord.id}`,
          itemName: latestAttr.itemName || finishedRecord.itemName || moldingAttr.itemName || 'Finished Component',
          finalOutput: finalQuantity,
          moldingScrap,
          assembleScrap,
          primaryScrap,
          totalScrap,
          startedQty,
          updatedAt: latestRecord.updatedAt || latestRecord.createdAt,
          createdAt: latestRecord.createdAt || latestRecord.created_at,
          status: latestRecord.wipStatus || latestRecord.status,
          allRecords: records.map(r => r.id), // Track all related records for deletion
          isFullyProcessed: latestRecord.wipStatus === 'FINISHED_GOOD'
        });
      });

      // Sort by date, newest first
      finishedGoodsList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      setFinishedBatches(finishedGoodsList);
    } catch (error) {
      console.error('Error fetching finished goods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;
    try {
      // Delete all records associated with this batch group
      if (batchToDelete.allRecords && batchToDelete.allRecords.length > 0) {
        for (const id of batchToDelete.allRecords) {
          try {
            await manufacturingService.delete(id);
          } catch (err) {
            console.warn(`Could not delete record ${id}:`, err);
          }
        }
      } else {
        await manufacturingService.delete(batchToDelete.id);
      }
      fetchFinishedGoods(); // Refresh after deletion
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
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{batch.baseNumber}</h3>
                  <p className="text-sm font-extrabold text-indigo-500 mb-6 uppercase tracking-wider">{batch.itemName}</p>
                  
                  <div className="mt-auto grid grid-cols-3 gap-2">
                    {/* Molding Scrap */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 relative group">
                      <div className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                        <span>Molding Scrap</span>
                      </div>
                      <div className="text-xl font-black text-rose-600">{batch.moldingScrap}</div>
                    </div>

                    {/* Assemble Scrap */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 relative group">
                      <div className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                        <span>Assemble Scrap</span>
                      </div>
                      <div className="text-xl font-black text-rose-600">{batch.assembleScrap}</div>
                    </div>

                    {/* Primary Scrap */}
                    <div className="bg-indigo-50/50 rounded-2xl p-3 border border-indigo-100/50 relative group">
                      <div className="text-[9px] font-black text-indigo-400 mb-2 uppercase tracking-widest">
                        <span>Primary Scrap</span>
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
                    {batchToDelete.baseNumber}
                  </span>
                  ? This will remove all related records. This action cannot be undone.
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
