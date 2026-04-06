import React, { useState, useEffect } from 'react';
import { branchService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Building2, Edit3, Trash2, Plus, Search, MapPin, Clock, Eye, Globe, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const Branches = () => {
  const { user } = useAuth();
  const { showToast, confirm } = useNotification();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [viewBranch, setViewBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    locationName: '',
    branchCode: '',
    address: '',
    timezone: '',
    orgId: '',
    isActive: true,
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await branchService.getAll();
      const data = response.data;
      setBranches(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
    } catch (error) {
      console.error('Error fetching branches:', error);
      showToast('Failed to fetch branches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!editingBranch && user?.orgId) {
        submitData.orgId = user.orgId;
      }

      if (editingBranch) {
        await branchService.update(editingBranch.id, submitData);
        showToast('Branch updated', 'success');
      } else {
        await branchService.create(submitData);
        showToast('Branch added', 'success');
      }
      setShowModal(false);
      resetForm();
      fetchBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
      showToast('Failed to save branch', 'error');
    }
  };

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      locationName: branch.locationName || '',
      branchCode: branch.branchCode || '',
      address: branch.address || '',
      timezone: branch.timezone || '',
      orgId: branch.orgId || '',
      isActive: branch.isActive !== false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Branch',
      message: 'This will permanently delete this branch. Proceed?',
      type: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    });

    if (isConfirmed) {
      try {
        await branchService.delete(id);
        showToast('Branch deleted', 'warning');
        fetchBranches();
      } catch (error) {
        console.error('Error deleting branch:', error);
        showToast('Failed to delete branch', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      locationName: '',
      branchCode: '',
      address: '',
      timezone: '',
      orgId: '',
      isActive: true,
    });
    setEditingBranch(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredBranches = branches.filter(branch =>
    branch.locationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.branchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-start border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Branches</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3 ml-1">Manage your organization's branch locations</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-3 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          Add New Branch
        </button>
      </header>

      <div className="space-y-8">
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)]" />
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Search Branches</h3>
              <div className="relative mt-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-80 pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all uppercase tracking-widest placeholder:text-slate-300 shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-black pointer-events-none text-slate-300 uppercase tracking-widest">Total Branches</span>
            <span className="text-2xl font-black text-slate-800 italic leading-none mt-1">{branches.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 text-slate-200">
              <RefreshCw className="animate-spin mb-6" size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">Loading branches…</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Branch Details</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Location</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-center">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right font-mono">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBranches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            {branch.locationName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-slate-800 text-lg tracking-tight uppercase italic">{branch.locationName}</div>
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">CODE: {branch.branchCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <MapPin size={16} className="text-indigo-500 shrink-0" />
                            <span className="text-sm font-semibold text-slate-700 tracking-tight leading-relaxed max-w-sm">
                              {branch.address || 'Unmapped Coordinate'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Globe size={14} className="text-slate-300 shrink-0" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {branch.timezone || 'UTC / Universal'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center uppercase">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.2em] border shadow-sm inline-flex items-center gap-2 ${branch.isActive !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${branch.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {branch.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end items-center gap-3">
                          <button
                            onClick={() => setViewBranch(branch)}
                            className="p-3 bg-white text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-slate-100 hover:border-indigo-100 transition-all active:scale-90"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(branch)}
                            className="p-3 bg-white text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-slate-100 hover:border-indigo-100 transition-all active:scale-90"
                            title="Edit"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(branch.id)}
                            className="p-3 bg-white text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-slate-100 hover:border-rose-100 transition-all active:scale-90"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBranches.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-10 py-32 text-center text-slate-300">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-6 bg-slate-50 rounded-full">
                            <Building2 size={48} />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">No branches found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200">
                  <Building2 size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase italic">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 italic">Define a new branch for your organization</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="space-y-5">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Branch Details</h3>
                </div>

                <div className="grid grid-cols-1 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                        Branch Name *
                      </label>
                      <input
                        type="text"
                        name="locationName"
                        value={formData.locationName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all uppercase tracking-widest shadow-sm"
                        placeholder="e.g. COLOMBO HQ"
                        required
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                        Branch Code *
                      </label>
                      <input
                        type="text"
                        name="branchCode"
                        value={formData.branchCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all uppercase tracking-widest shadow-sm"
                        placeholder="e.g. BR-01"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Location Info</h3>
                </div>

                <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                      Physical Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 min-h-[80px] transition-all shadow-sm"
                      placeholder="Street, City, coordinates..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1 text-indigo-400">
                        <Clock size={11} /> Time Zone
                      </label>
                      <select
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all shadow-sm appearance-none"
                      >
                        <option value="">Select Zone</option>
                        <option value="Asia/Colombo">Asia/Colombo</option>
                        <option value="UTC">UTC / Universal</option>
                        <option value="Asia/Singapore">Asia/Singapore</option>
                      </select>
                    </div>
                    <div className="flex items-end pb-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all shadow-sm"
                        />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Active</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-8 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-3"
                >
                  <CheckCircle2 size={16} />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analytics / View Modal */}
      {viewBranch && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setViewBranch(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-white" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 p-10 text-white relative">
              <div className="absolute top-8 right-8">
                <button onClick={() => setViewBranch(null)} className="text-white/30 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <div className="p-4 bg-indigo-500 text-white rounded-2xl w-fit shadow-2xl shadow-indigo-500/20 mb-6">
                <Building2 size={24} />
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tight leading-none">Branch Info</h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-white/10 px-3 py-1 rounded-full border border-white/10">{viewBranch.branchCode}</span>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${viewBranch.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  {viewBranch.isActive !== false ? '● active' : '○ inactive'}
                </span>
              </div>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-indigo-500 border border-slate-100 shadow-sm"><MapPin size={18} /></div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">Address</label>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{viewBranch.address || 'No address captured'}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 border border-slate-100 shadow-sm"><Clock size={18} /></div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">Time Zone</label>
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">{viewBranch.timezone || 'Universal/UTC'}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewBranch(null)}
                className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
