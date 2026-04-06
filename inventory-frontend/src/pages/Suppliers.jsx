import { useEffect, useState } from 'react';
import { supplierService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FaEdit, FaTrash, FaEnvelope, FaPhone, FaPlus, FaMinus } from 'react-icons/fa';
import { RefreshCw, Plus, X, User, Mail, Phone, Globe, MapPin, Tag, Trash2, Edit3, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

function Suppliers() {
  const { user } = useAuth();
  const { showToast, confirm } = useNotification();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    orgId: user?.orgId || 1
  });

  // Dynamic additional attributes (for JSONB flexibility)
  const [contactDetails, setContactDetails] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (user?.orgId) {
      fetchSuppliers();
    }
  }, [user]);

  const fetchSuppliers = async () => {
    try {
      const orgId = user?.orgId || 1;
      const response = await supplierService.getByOrganization(orgId);
      const sData = response.data;
      setSuppliers(Array.isArray(sData) ? sData : (sData?.content ?? sData?.data ?? []));
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      showToast('Failed to fetch suppliers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier) => {
    const { contactInfo = {}, name, orgId, id } = supplier;
    const { email, phone, ...others } = contactInfo || {};

    const otherDetails = Object.entries(others).map(([key, value]) => ({ key, value }));

    setFormData({
      name: name,
      email: email || '',
      phone: phone || '',
      orgId: orgId || (user?.orgId || 1)
    });
    setContactDetails(otherDetails);

    setIsEditing(true);
    setEditId(id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const contactInfoPayload = {
        email: formData.email,
        phone: formData.phone
      };

      contactDetails.forEach(detail => {
        if (detail.key && detail.value) {
          contactInfoPayload[detail.key] = detail.value;
        }
      });

      const payload = {
        name: formData.name,
        orgId: formData.orgId,
        contactInfo: contactInfoPayload
      };

      if (isEditing) {
        await supplierService.update(editId, payload);
        showToast('Supplier updated', 'success');
      } else {
        await supplierService.create(payload);
        showToast('Supplier added', 'success');
      }

      setShowModal(false);
      fetchSuppliers();
      resetForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
      showToast('Failed to save supplier', 'error');
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Supplier',
      message: 'This will permanently delete this supplier. Proceed?',
      type: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    });

    if (isConfirmed) {
      try {
        await supplierService.delete(id);
        showToast('Supplier deleted', 'warning');
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        showToast('Failed to delete supplier', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      orgId: user?.orgId || 1
    });
    setContactDetails([]);
    setIsEditing(false);
    setEditId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const addContactDetail = () => {
    setContactDetails([...contactDetails, { key: '', value: '' }]);
  };

  const removeContactDetail = (index) => {
    setContactDetails(contactDetails.filter((_, i) => i !== index));
  };

  const updateContactDetail = (index, field, value) => {
    const updatedDetails = [...contactDetails];
    updatedDetails[index][field] = value;
    setContactDetails(updatedDetails);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-4">
      <RefreshCw className="animate-spin text-indigo-500" size={40} />
      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Loading suppliers...</span>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex justify-between items-end border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Suppliers</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3 ml-1">Manage your organization's supply partners</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-3 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          Add New Supplier
        </button>
      </header>

      <div className="space-y-8">
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)]" />
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Search Suppliers</h3>
                <div className="relative mt-2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="w-full md:w-80 pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all uppercase tracking-widest placeholder:text-slate-300 shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black pointer-events-none text-slate-300 uppercase tracking-widest">Total Suppliers</span>
              <span className="text-2xl font-black text-slate-800 italic leading-none mt-1">{suppliers.length}</span>
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Supplier Info</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Contact Details</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right font-mono">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            {supplier.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-slate-800 text-lg tracking-tight uppercase italic">{supplier.name}</div>
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">ID: #{String(supplier.id).padStart(4, '0')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="space-y-3">
                          {supplier.contactInfo && Object.entries(supplier.contactInfo).map(([key, value]) => {
                            if (!value) return null;
                            return (
                              <div key={key} className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] w-20 shrink-0">{key}</span>
                                <span className="text-sm font-semibold text-slate-700 tracking-tight">
                                  {String(value)}
                                </span>
                              </div>
                            );
                          })}

                          {(!supplier.contactInfo || Object.keys(supplier.contactInfo).length === 0) && (
                            <span className="text-slate-300 text-[11px] font-black uppercase tracking-widest italic flex items-center gap-2">
                              <AlertCircle size={14} /> Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end items-center gap-3 transition-all">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="p-3 bg-white text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-slate-100 hover:border-indigo-100 transition-all active:scale-90"
                            title="Edit"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="p-3 bg-white text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-slate-100 hover:border-rose-100 transition-all active:scale-90"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-10 py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-6 bg-slate-50 rounded-full text-slate-200">
                            <User size={48} />
                          </div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic">No suppliers found</p>
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200">
                  <User size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase italic">{isEditing ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 italic">Register a new supply partner for your organization</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="space-y-5">
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Supplier Information</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                        Supplier Name *
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all uppercase tracking-widest shadow-sm"
                        placeholder="e.g. GLOBAL LOGISTICS"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1 text-indigo-400">
                          Email
                        </label>
                        <input
                          type="email"
                          className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all shadow-sm"
                          placeholder="partner@domain.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1 text-emerald-400">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all shadow-sm"
                          placeholder="+1 (555) 000-0000"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Additional Details</h3>
                    </div>
                    <button
                      type="button"
                      onClick={addContactDetail}
                      className="px-3 py-1.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 hover:bg-slate-800 transition-all active:scale-95"
                    >
                      <Plus size={10} /> Add
                    </button>
                  </div>

                  <div className="space-y-3">
                    {contactDetails.map((detail, index) => (
                      <div key={index} className="flex gap-3 items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100 group animate-in slide-in-from-left-4 duration-300 shadow-inner">
                        <input
                          type="text"
                          className="flex-1 px-4 py-2 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-slate-600 outline-none focus:border-indigo-400 uppercase tracking-widest shadow-sm"
                          placeholder="KEY"
                          value={detail.key}
                          onChange={(e) => updateContactDetail(index, 'key', e.target.value)}
                        />
                        <input
                          type="text"
                          className="flex-[2] px-4 py-2 bg-white border border-slate-100 rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:border-indigo-400 shadow-sm"
                          placeholder="VALUE"
                          value={detail.value}
                          onChange={(e) => updateContactDetail(index, 'value', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeContactDetail(index)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-90"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {contactDetails.length === 0 && (
                      <div className="py-10 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                        <Tag size={20} className="mb-2 opacity-20" />
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">No additional details added</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-slate-100 flex gap-4 justify-end bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-3"
                >
                  <CheckCircle2 size={16} />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;
