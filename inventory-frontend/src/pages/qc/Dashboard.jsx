import React, { useState, useEffect } from 'react';
import apiClient, { manufacturingService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, AlertTriangle, CheckCircle, Trash2, X, FileEdit, Info, AlertCircle, History } from 'lucide-react';

const QCDashboard = () => {
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [completedInspections, setCompletedInspections] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState(''); // 'SCRAP' or 'REPAIR'
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPendingInspections = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const orgId = user.orgId || 1;

      // 1. Fetch pending directly from the pending endpoint
      const pendingRes = await manufacturingService.getPendingInspection();
      setInspections(Array.isArray(pendingRes.data) ? pendingRes.data : []);

      // 2. Fetch history by getting all items and filtering completed
      const allRes = await manufacturingService.getByOrganization(orgId);
      const allItems = Array.isArray(allRes.data) ? allRes.data : (allRes.data?.content || []);
      
      const completed = allItems.filter(i => i.inspectionStatus === 'PASSED' || i.inspectionStatus === 'FAILED');
      
      // Sort so newest inspections are at top
      setCompletedInspections(completed.reverse());
    } catch (err) {
      console.error("QC API unavailable.", err);
      setInspections([]);
      setCompletedInspections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingInspections();
  }, []);

  const openDecisionModal = (item, type) => {
    setSelectedItem(item);
    setActionType(type);
    setRemarks('');
    setShowModal(true);
  };

  const handleConfirmDecision = async () => {
    if (!remarks.trim()) {
      alert("Please provide remarks for this QC decision.");
      return;
    }
    
    try {
      setSubmitting(true);
      await manufacturingService.updateInspection(selectedItem.id, {
        status: actionType === "SCRAP" ? "FAILED" : "PASSED",
        grade: actionType === "SCRAP" ? "REJECT" : "B",
        defectCount: selectedItem.defectCount || selectedItem.manufacturingAttributes?.quantityDamaged || 0,
        remarks: remarks,
        action: actionType,
        processedBy: user?.username || 'QC_ADMIN'
      });
      setInspections(prev => prev.filter(i => i.id !== selectedItem.id));
      setShowModal(false);
      setSubmitting(false);
    } catch (err) {
      console.error("QC Decide API failed:", err);
      alert("Failed to submit decision to Backend API.");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Quality Control (QC) Dashboard</h1>
      </div>
      <p className="text-gray-600 mb-8 ml-14">Inspect flagged inventory and review damage segregation.</p>
      
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm ml-14">
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
             Pending Inspections (QC Hold Area)
             {inspections.length > 0 && (
               <span className="bg-red-100 text-red-600 text-sm py-1 px-3 rounded-full font-bold ml-2">
                 {inspections.length} Items Waiting
               </span>
             )}
          </h2>
          <div className="flex gap-4 items-center">
            <div className="flex space-x-2 bg-gray-100 p-1.5 rounded-lg border border-gray-200">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide rounded transition-all ${
                  activeTab === 'active'
                    ? 'bg-white text-indigo-600 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide rounded transition-all ${
                  activeTab === 'history'
                    ? 'bg-white text-indigo-600 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                History
              </button>
            </div>
            <button onClick={fetchPendingInspections} className="text-sm text-indigo-600 hover:underline font-medium">
              Refresh Data
            </button>
          </div>
        </div>
        
        {loading ? (
             <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : activeTab === 'history' ? (
          completedInspections.length === 0 ? (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center">
              <History className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">No inspection history yet.</p>
              <p className="text-sm mt-1 text-gray-500">Completed inspections will appear here.</p>
            </div>
          ) : (
            <table className="w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
              <thead className="bg-slate-100 text-left border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">PO Number</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Item</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Decision</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">QC Grade</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody>
                {completedInspections.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-100/50 border-b border-gray-100 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-700">{item.workOrderNumber || `PO-${item.id}`}</td>
                    <td className="px-6 py-4"><span className="bg-white border border-gray-200 text-gray-800 px-2.5 py-1 rounded text-sm font-medium">{item.materialCode || item.itemName || 'Item'}</span></td>
                    <td className="px-6 py-4"><span className={`text-xs font-bold uppercase px-3 py-1 rounded ${item.inspectionStatus === 'PASSED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.inspectionStatus === 'PASSED' ? 'Approved' : 'Scrapped'}</span></td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{item.qualityGrade || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.defectDescription || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : inspections.length === 0 ? (
          <div className="py-12 text-center text-gray-500 flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
            <p className="text-lg font-medium text-gray-700">No pending QC inspections found.</p>
            <p className="text-sm mt-1 text-gray-500">All incoming inventory is cleared and matched.</p>
          </div>
        ) : (
          <table className="w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
            <thead className="bg-slate-100 text-left border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">PO Number</th>
                <th className="px-6 py-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Item Received</th>
                <th className="px-6 py-4 font-bold text-red-600 uppercase text-xs tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/> Quantity Damaged</th>
                <th className="px-6 py-4 font-semibold text-gray-600 uppercase text-xs tracking-wider">Reason</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-600 uppercase text-xs tracking-wider">Action / Decide</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((item) => (
                <tr key={item.id} className="hover:bg-slate-100/50 border-b border-gray-100 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-700">{item.workOrderNumber || item.manufacturingAttributes?.poNumber || `PO-${item.id}`}</td>
                  <td className="px-6 py-4"><span className="bg-white border border-gray-200 text-gray-800 px-2.5 py-1 rounded text-sm font-medium shadow-sm">{item.materialCode || item.itemName || item.manufacturingAttributes?.itemName || 'WIP-ITEM'}</span></td>
                  <td className="px-6 py-4 font-bold text-red-500 text-lg">{item.defectCount || item.manufacturingAttributes?.quantityDamaged || item.scrapQuantity || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.defectDescription || item.notes || item.reason || 'Pending Inspection'}</td>
                  <td className="px-6 py-4 flex gap-2 justify-end">
                    <button onClick={() => openDecisionModal(item, "SCRAP")} className="bg-white text-red-600 border border-red-200 px-3 py-1.5 flex items-center gap-1.5 rounded hover:bg-red-50 text-sm font-medium transition-colors shadow-sm">
                      <Trash2 className="w-4 h-4" /> Scrap
                    </button>
                    <button onClick={() => openDecisionModal(item, "REPAIR")} className="bg-indigo-600 text-white border border-indigo-700 px-4 py-1.5 flex items-center gap-1.5 rounded hover:bg-indigo-700 text-sm font-medium transition-colors shadow-sm">
                      <FileEdit className="w-4 h-4" /> Add to Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden translate-y-0 opacity-100 transition-all">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                {actionType === "SCRAP" ? (
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><Trash2 className="w-5 h-5"/></div>
                ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><FileEdit className="w-5 h-5"/></div>
                )}
                <div>
                    <h3 className="font-bold text-lg text-gray-800 leading-tight">
                    {actionType === "SCRAP" ? "Confirm Inventory Scrap" : "Approve Restock"}
                    </h3>
                    <p className="text-xs text-gray-500">QC Enforcement Action</p>
                </div>
              </div>
              <button disabled={submitting} onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4 mb-5 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                      <p className="text-sm text-gray-800 font-medium">Reviewing <span className="text-red-500 font-bold">{selectedItem.defectCount || selectedItem.manufacturingAttributes?.quantityDamaged || 0}</span> Damaged Items</p>
                      <p className="text-xs text-gray-600 mt-1">PO: <strong>{selectedItem.workOrderNumber || selectedItem.manufacturingAttributes?.poNumber || `PO-${selectedItem.id}`}</strong> &nbsp;|&nbsp; Code: <strong>{selectedItem.materialCode || selectedItem.itemName || selectedItem.manufacturingAttributes?.itemName || 'WIP-ITEM'}</strong></p>
                      <p className="text-xs bg-amber-100/50 text-amber-800 inline-block px-2 py-0.5 rounded mt-2 border border-amber-200">Reason: {selectedItem.defectDescription || selectedItem.notes || selectedItem.reason || 'Pending Inspection'}</p>
                  </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  QC Inspection Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                  placeholder={actionType === "SCRAP" ? "Provide reason why this cannot be salvaged..." : "Explain rework taken to validate these items for production..."}
                ></textarea>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg flex items-start gap-3 border border-slate-200">
                 <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />
                 <p className="text-xs text-slate-600 leading-relaxed font-medium">
                   {actionType === "SCRAP" 
                      ? "Scrapping these items will permanently deduct them from expected stock valuation."
                      : "Approving repair will immediately inject these items into Active Stock."}
                 </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 bg-white border border-gray-200 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={submitting || !remarks.trim()}
                className={"px-6 py-2 text-white font-medium rounded-lg flex items-center gap-2 transition-all shadow-sm text-sm " + (
                    actionType === "SCRAP" 
                        ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:shadow-none" 
                        : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:shadow-none"
                )}
              >
                {submitting ? (
                    'Processing...'
                ) : (
                    actionType === "SCRAP" ? "Confirm Scrap Action" : "Approve Restock Action"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QCDashboard;
