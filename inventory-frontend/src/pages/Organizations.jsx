import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { Building2, Plus, Globe, Mail, Phone, ShieldCheck, X, RefreshCw, Layers, CheckCircle2, AlertCircle, Trash2, MapPin, ExternalLink } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

function Organizations() {
  const { confirm } = useNotification();
  const [organizations, setOrganizations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [activeTab, setActiveTab] = useState('organizations');

  const [orgFormData, setOrgFormData] = useState({
    name: '',
    industryType: 'RETAIL',
    subscriptionTier: 'STARTER',
    contactEmail: '',
    contactPhone: '',
    taxId: '',
    isActive: true
  });

  const [branchFormData, setBranchFormData] = useState({
    orgId: '',
    locationName: '',
    address: '',
    timezone: 'UTC',
    isActive: true
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      fetchBranches(selectedOrgId);
    }
  }, [selectedOrgId]);

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/organizations`);
      const data = response.data;
      const list = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
      setOrganizations(list);
      if (list.length > 0 && !selectedOrgId) {
        setSelectedOrgId(list[0].id);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (orgId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/branches/organization/${orgId}`);
      const data = response.data;
      const list = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
      setBranches(list);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/organizations`, orgFormData);
      setShowOrgModal(false);
      fetchOrganizations();
      resetOrgForm();
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    try {
      const branchData = { ...branchFormData, orgId: selectedOrgId };
      await axios.post(`${API_BASE_URL}/api/branches`, branchData);
      setShowBranchModal(false);
      fetchBranches(selectedOrgId);
      resetBranchForm();
    } catch (error) {
      console.error('Error creating branch:', error);
    }
  };

  const handleDeleteOrg = async (id) => {
    const isConfirmed = await confirm({
      title: 'Deactivate Organization',
      message: 'This will irreversibly disconnect the organization node and all associated branches from the main grid. Continue?',
      type: 'danger',
      confirmLabel: 'Deactivate Node',
      cancelLabel: 'Abort'
    });
    if (isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/organizations/${id}`);
        fetchOrganizations();
      } catch (error) {
        console.error('Error deleting organization:', error);
      }
    }
  };

  const handleDeleteBranch = async (id) => {
    const isConfirmed = await confirm({
      title: 'Disconnect Branch Node',
      message: 'This will terminate all real-time synchronization for this specific geographical branch. Confirm disconnection?',
      type: 'danger',
      confirmLabel: 'Disconnect',
      cancelLabel: 'Retain'
    });
    if (isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/branches/${id}`);
        fetchBranches(selectedOrgId);
      } catch (error) {
        console.error('Error deleting branch:', error);
      }
    }
  };

  const resetOrgForm = () => {
    setOrgFormData({
      name: '',
      industryType: 'RETAIL',
      subscriptionTier: 'STARTER',
      contactEmail: '',
      contactPhone: '',
      taxId: '',
      isActive: true
    });
  };

  const resetBranchForm = () => {
    setBranchFormData({
      orgId: '',
      locationName: '',
      address: '',
      timezone: 'UTC',
      isActive: true
    });
  };

  const getTierColors = (tier) => {
    switch (tier) {
      case 'ENTERPRISE': return 'bg-indigo-500 text-white shadow-indigo-100';
      case 'PROFESSIONAL': return 'bg-sky-500 text-white shadow-sky-100';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-40 text-slate-300">
      <RefreshCw size={48} className="animate-spin mb-4" />
      <span className="text-[10px] font-black uppercase tracking-[0.4em]">Scaling Clusters…</span>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="border-b border-slate-100 pb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Organization Control</h1>
        <p className="text-sm font-medium text-slate-500 mt-1 italic">Multi-tenant architect and ecological node management</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/20 flex flex-wrap items-center justify-between gap-6">
          <div className="flex gap-1.5 p-1.5 bg-slate-100/60 rounded-2xl shadow-inner">
            <button onClick={() => setActiveTab('organizations')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all ${activeTab === 'organizations' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>
              <Layers size={14} /> Organizations
            </button>
            <button onClick={() => setActiveTab('branches')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all ${activeTab === 'branches' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}>
              <Globe size={14} /> Remote Nodes
            </button>
          </div>

          <button
            onClick={() => activeTab === 'organizations' ? setShowOrgModal(true) : setShowBranchModal(true)}
            className={`px-6 py-3 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 ${activeTab === 'organizations' ? 'bg-indigo-600 shadow-indigo-100' : 'bg-emerald-600 shadow-emerald-100'
              }`}
          >
            <Plus size={16} /> Register {activeTab === 'organizations' ? 'Entity' : 'Node'}
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'organizations' ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Entity</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Identifier</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Industry Cluster</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Level</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Point</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Integrity</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Utility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {organizations.map((org) => (
                    <tr key={org.id} onClick={() => setSelectedOrgId(org.id)} className={`hover:bg-slate-50/50 transition-colors cursor-pointer group ${selectedOrgId === org.id ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 text-indigo-500 group-hover:scale-110 transition-transform">
                            <Building2 size={16} />
                          </div>
                          <span className="font-black text-slate-800 tracking-tight">{org.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 tracking-widest">{org.tenantId}</code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest rounded-full border border-slate-200">
                          {org.industryType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${getTierColors(org.subscriptionTier)}`}>
                          {org.subscriptionTier}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <Mail size={12} className="text-slate-300" /> {org.contactEmail}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                            <Phone size={10} className="text-slate-300" /> {org.contactPhone || '—'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${org.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {org.isActive ? 'Verified' : 'Inert'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteOrg(org.id); }} className="p-2.5 bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-all border border-rose-100/50 shadow-sm opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Context Provider:</label>
                <select
                  value={selectedOrgId || ''}
                  onChange={(e) => setSelectedOrgId(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all flex-1"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Label</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Spatial Reference</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporal Logic</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Logic Utility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {branches.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-20 text-center text-slate-300 italic text-sm">No remote sensors detected in this sector.</td>
                      </tr>
                    ) : (
                      branches.map((branch) => (
                        <tr key={branch.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 shadow-inner group-hover:scale-110 transition-transform">
                                <MapPin size={16} />
                              </div>
                              <span className="font-black text-slate-800 tracking-tight">{branch.locationName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-500 italic pr-10 truncate max-w-[250px]">{branch.address}</td>
                          <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">{branch.timezone}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${branch.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                              {branch.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDeleteBranch(branch.id)} className="p-2.5 bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-all border border-rose-100/50 shadow-sm opacity-0 group-hover:opacity-100">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Org Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowOrgModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Register Master Entity</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Multi-tenant environment instantiation</p>
              </div>
              <button onClick={() => setShowOrgModal(false)} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={32} /></button>
            </div>
            <form onSubmit={handleOrgSubmit} className="p-10 space-y-8">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Public Name *</label>
                <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all" value={orgFormData.name} onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })} required placeholder="e.g. Cyberdyne Systems Inc." />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Vertical Sector *</label>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat" value={orgFormData.industryType} onChange={(e) => setOrgFormData({ ...orgFormData, industryType: e.target.value })} required>
                    <option value="RETAIL">Retail</option>
                    <option value="PHARMACY">Pharmacy</option>
                    <option value="MANUFACTURING">Manufacturing</option>
                    <option value="LOGISTICS">Logistics</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol Tier</label>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat" value={orgFormData.subscriptionTier} onChange={(e) => setOrgFormData({ ...orgFormData, subscriptionTier: e.target.value })}>
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Signal (Email)</label>
                  <input type="email" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400" value={orgFormData.contactEmail} onChange={(e) => setOrgFormData({ ...orgFormData, contactEmail: e.target.value })} placeholder="admin@node.com" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Voice Terminal (Phone)</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400" value={orgFormData.contactPhone} onChange={(e) => setOrgFormData({ ...orgFormData, contactPhone: e.target.value })} placeholder="+1 (555) 000-0000" />
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-8 border-t border-slate-100">
                <button type="button" onClick={() => setShowOrgModal(false)} className="px-8 py-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">Abort</button>
                <button type="submit" className="px-12 py-3.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Commit Entity</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowBranchModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Deploy Remote Node</h2>
                <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70">Expanding structural reach</p>
              </div>
              <button onClick={() => setShowBranchModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={32} /></button>
            </div>
            <form onSubmit={handleBranchSubmit} className="p-10 space-y-8">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Location Identity *</label>
                <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 transition-all" value={branchFormData.locationName} onChange={(e) => setBranchFormData({ ...branchFormData, locationName: e.target.value })} required placeholder="e.g. Eastern Seaboard Hub" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Spatial Mapping (Address)</label>
                <textarea className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 min-h-[100px]" value={branchFormData.address} onChange={(e) => setBranchFormData({ ...branchFormData, address: e.target.value })} rows="3" placeholder="Street, Sector, Galaxy Unit…" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Temporal Logic (Timezone)</label>
                <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat" value={branchFormData.timezone} onChange={(e) => setBranchFormData({ ...branchFormData, timezone: e.target.value })}>
                  <option value="UTC">UTC (Universal)</option>
                  <option value="Asia/Colombo">Asia/Colombo (LKT)</option>
                  <option value="America/New_York">New York (EST)</option>
                  <option value="America/Los_Angeles">Los Angeles (PST)</option>
                </select>
              </div>
              <div className="flex gap-4 justify-end pt-8 border-t border-slate-100">
                <button type="button" onClick={() => setShowBranchModal(false)} className="px-8 py-3 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">Abort</button>
                <button type="submit" className="px-12 py-3.5 bg-emerald-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95">Deploy Node</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Organizations;
