import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, Play, CheckCircle2, Sparkles, Info } from 'lucide-react';
import { manufacturingService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const PrimaryDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  
  // Modal states
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [formData, setFormData] = useState({
    processedQuantity: 0,
    scrapQuantity: 0,
    qualityCheckPassed: true,
    remarks: ''
  });

  const fetchWipBatches = async () => {
    try {
      setLoading(true);
      const response = await manufacturingService.getWip();
      // Filter for batches currently in PRIMARY stage
      const primaryBatches = (response.data || []).filter(b => b.currentStage === 'PRIMARY' || b.stage === 'PRIMARY' || b.status === 'WIP_PRIMARY' || b.wipStatus === 'WIP_PRIMARY');
      setBatches(primaryBatches);
    } catch (error) {
      console.error('Error fetching WIP batches:', error);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWipBatches();
  }, []);

  const handleOpenAdvance = (batch) => {
    setSelectedBatch(batch);
    setFormData({
      processedQuantity: batch.quantity || 0,
      scrapQuantity: 0,
      qualityCheckPassed: true,
      remarks: ''
    });
    setShowAdvanceModal(true);
  };

  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        currentStage: 'PRIMARY',
        targetStage: 'FINISHED_GOODS', // Assuming next is finished goods or QC
        processedQuantity: parseInt(formData.processedQuantity),
        scrapQuantity: parseInt(formData.scrapQuantity),
        operatorId: user?.id || 'EMP-UNKNOWN',
        qualityCheckPassed: formData.qualityCheckPassed,
        remarks: formData.remarks
      };
      
      const newStatus = formData.qualityCheckPassed ? 'FINISHED_GOOD' : 'REWORK';
      await manufacturingService.updateWipStatus(selectedBatch.id, newStatus);
      showToast('Batch successfully finished and moved to Inventory!', 'success');
      setShowAdvanceModal(false);
      fetchWipBatches();
    } catch (error) {
      console.error('Error advancing batch:', error);
      showToast('Failed to advance batch to Stores.', 'error');
      setShowAdvanceModal(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-4">
      <RefreshCw className="animate-spin text-amber-500" size={40} />
      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Loading Primary Batches...</span>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 p-6">
      <header className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Primary / Finishing</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3 ml-1">Final Polish & Packaging</p>
        </div>
        <button
          onClick={fetchWipBatches}
          className="p-4 bg-white text-slate-400 hover:text-amber-600 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-200 transition-all active:scale-95"
        >
          <RefreshCw size={20} />
        </button>
      </header>

      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden p-8">
        <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shadow-sm">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Active Finishing Queue</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending Final Packaging</p>
            </div>
          </div>
        </div>
        
        {batches.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
            <CheckCircle2 size={48} className="mb-4 opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest opacity-40">No Units in Primary Phase</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch, idx) => (
              <div key={batch.id || idx} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-200/20 hover:border-amber-200 transition-all group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {batch.status || 'WIP_PRIMARY'}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty: {batch.manufacturingAttributes?.quantity || batch.quantity || 0}</span>
                </div>
                
                {/* Fixed the escaping issue securely for the batch number display */}
                <h3 className="text-xl font-bold text-slate-800 mb-1">{batch.manufacturingAttributes?.batchNumber || batch.batchNumber || `BATCH-${batch.id}`}</h3>
                <p className="text-sm font-semibold text-slate-500 mb-8">{batch.manufacturingAttributes?.itemName || batch.itemName || 'Finished Unit'}</p>
                
                <div className="mt-auto">
                  <button 
                    onClick={() => handleOpenAdvance(batch)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200 hover:bg-amber-500 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group-hover:scale-[1.02] active:scale-95"
                  >
                    Complete Batch <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdvanceModal && selectedBatch && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && setShowAdvanceModal(false)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white">
            <header className="px-8 py-6 border-b border-amber-50 flex items-center gap-4 bg-white shrink-0">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm border border-amber-100">
                <Play size={22} className="ml-0.5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase italic">Complete Finishing</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 italic">Move {selectedBatch.batchNumber} to Finished Goods</p>
              </div>
            </header>

            <form onSubmit={handleAdvanceSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Processed Qty</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition-all"
                    value={formData.processedQuantity}
                    onChange={(e) => setFormData({...formData, processedQuantity: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Scrap Qty</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-4 py-3.5 bg-rose-50/50 border border-rose-100 rounded-xl text-sm font-bold text-rose-700 outline-none focus:ring-4 focus:ring-rose-50 focus:border-rose-400 transition-all"
                    value={formData.scrapQuantity}
                    onChange={(e) => setFormData({...formData, scrapQuantity: e.target.value})}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-3">
                  <Info size={16} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">QC Passed (Ready for Inventory)</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.qualityCheckPassed}
                  onChange={(e) => setFormData({...formData, qualityCheckPassed: e.target.checked})}
                  className="w-5 h-5 accent-amber-600 rounded bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Remarks</label>
                <textarea
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition-all resize-none min-h-[100px]"
                  placeholder="Enter any notes about this finishing run..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                ></textarea>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-4 bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-amber-200 hover:bg-slate-900 transition-all active:scale-95 flex items-center gap-3"
                >
                  <ArrowRight size={16} />
                  Send to Stores
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrimaryDashboard;
