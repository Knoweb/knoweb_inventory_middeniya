import { useEffect, useState } from 'react';
import { customerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Plus, User, Box, Edit3, Trash2, Search, AlertCircle } from 'lucide-react';

function Customers() {
  const { user } = useAuth();
  const { showToast, confirm } = useNotification();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({ customerName: '', vatNumber: '', phoneNumber: '', address: '' });
  const [contactDetails, setContactDetails] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (user?.orgId) {
      fetchCustomers();
    }
  }, [user]);

  const fetchCustomers = async () => {
    try {
      const orgId = user?.orgId || 1;
      const response = await customerService.getByOrganization(orgId);
      const data = response.data;
      setCustomers(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ customerName: '', vatNumber: '', phoneNumber: '', address: '' });
    setContactDetails([]);
    setIsEditing(false);
    setEditId(null);
  };

  const openAddModal = () => { resetForm(); setShowModal(true); };

  const handleEdit = (customer) => {
    const contactInfo = customer.contactInfo || {};
    const details = [];
    Object.keys(contactInfo).forEach(k => {
      if (k === 'email' || k === 'phone') return;
      details.push({ key: k, value: contactInfo[k] });
    });
    setFormData({ customerName: customer.customerName || customer.name || '', vatNumber: customer.vatNumber || '', phoneNumber: customer.phoneNumber || '', address: customer.address || '' });
    setContactDetails(details);
    setIsEditing(true);
    setEditId(customer.id);
    setShowModal(true);
  };

  const addContactField = () => setContactDetails(prev => [...prev, { key: '', value: '' }]);

  const updateContactField = (index, field, value) => {
    setContactDetails(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const removeContactField = (index) => setContactDetails(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const contactInfoPayload = {};
      contactDetails.forEach(d => { if (d.key && d.value) contactInfoPayload[d.key] = d.value; });

      const payload = {
        customerName: formData.customerName,
        vatNumber: formData.vatNumber,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        contactInfo: contactInfoPayload
      };

      if (isEditing) {
        await customerService.update(editId, payload);
        showToast('Customer updated', 'success');
      } else {
        await customerService.create(payload);
        showToast('Customer added', 'success');
      }
      setShowModal(false);
      fetchCustomers();
      resetForm();
    } catch (err) {
      console.error(err);
      showToast('Failed to save customer', 'error');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({ title: 'Delete Customer', message: 'This will permanently delete this customer.', type: 'danger' });
    if (!confirmed) return;
    try { await customerService.delete(id); showToast('Customer deleted', 'warning'); fetchCustomers(); } catch (err) { console.error(err); showToast('Failed to delete customer', 'error'); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-4">
      <div className="animate-spin text-indigo-500" style={{width:40, height:40, border:'4px solid rgba(99,102,241,0.2)', borderTopColor:'#6366f1', borderRadius: '50%'}} />
      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Loading customers...</span>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Customers</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3 ml-1">Manage your organization's customers</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-3 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          Add New Customer
        </button>
      </header>

      <div className="space-y-8">
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)]" />
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Search Customers</h3>
                <div className="relative mt-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input
                    type="text"
                    placeholder="Search by name, VAT or phone..."
                    className="w-full md:w-80 pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all uppercase tracking-widest placeholder:text-slate-300 shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black pointer-events-none text-slate-300 uppercase tracking-widest">Total Customers</span>
              <span className="text-2xl font-black text-slate-800 italic leading-none mt-1">{customers.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Customer Info</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Contact Details</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right font-mono">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            {(customer.customerName || customer.name || '').charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-slate-800 text-lg tracking-tight uppercase italic">{customer.customerName || customer.name}</div>
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">ID: #{String(customer.id).padStart(4, '0')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="space-y-3">
                          {customer.vatNumber && (
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-20 shrink-0">VAT</span>
                              <span className="text-sm font-semibold text-slate-700 tracking-tight">{customer.vatNumber}</span>
                            </div>
                          )}

                          {customer.phoneNumber && (
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-20 shrink-0">Phone</span>
                              <span className="text-sm font-semibold text-slate-700 tracking-tight">{customer.phoneNumber}</span>
                            </div>
                          )}

                          {customer.address && (
                            <div className="flex items-start gap-3">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-20 shrink-0">Address</span>
                              <span className="text-sm font-semibold text-slate-700 tracking-tight">{customer.address}</span>
                            </div>
                          )}

                          {customer.contactInfo && Object.entries(customer.contactInfo).map(([key, value]) => {
                            if (!value) return null;
                            return (
                              <div key={key} className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-20 shrink-0">{key}</span>
                                <span className="text-sm font-semibold text-slate-700 tracking-tight">{String(value)}</span>
                              </div>
                            );
                          })}

                          {(!customer.contactInfo || Object.keys(customer.contactInfo).length === 0) && !customer.vatNumber && !customer.phoneNumber && !customer.address && (
                            <span className="text-slate-300 text-[11px] font-black uppercase tracking-widest italic flex items-center gap-2">
                              <AlertCircle size={14} /> Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end items-center gap-3 transition-all">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="p-3 bg-white text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-slate-100 hover:border-indigo-100 transition-all active:scale-90"
                            title="Edit"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-3 bg-white text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-slate-100 hover:border-rose-100 transition-all active:scale-90"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-10 py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-6 bg-slate-50 rounded-full text-slate-200">
                            <User size={48} />
                          </div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">No customers found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <header className="px-8 py-6 border-b border-emerald-50 flex items-center justify-between bg-white shrink-0 z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm border border-emerald-100">
                  <User size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase italic">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 italic">Create or update customer details</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90">×</button>
            </header>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input required value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="mt-1 block w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">VAT Number</label>
                  <input value={formData.vatNumber} onChange={e => setFormData({ ...formData, vatNumber: e.target.value })} className="mt-1 block w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} className="mt-1 block w-full border rounded px-3 py-2" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="mt-1 block w-full border rounded px-3 py-2" />
                </div>

                <div className="col-span-2 flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
