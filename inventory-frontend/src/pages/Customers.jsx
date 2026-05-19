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

  const [formData, setFormData] = useState({ customerName: '', vatNumber: '', phoneNumber: '', address: '', orgId: user?.orgId || 1 });
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
    setFormData({ customerName: '', vatNumber: '', phoneNumber: '', address: '', orgId: user?.orgId || 1 });
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
    setFormData({ customerName: customer.customerName || customer.name || '', vatNumber: customer.vatNumber || '', phoneNumber: customer.phoneNumber || '', address: customer.address || '', orgId: customer.orgId || user?.orgId || 1 });
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
        orgId: formData.orgId,
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

  if (loading) return (<div>Loading customers...</div>);

  return (
    <div>
      <header className="flex justify-between items-end border-b pb-6">
        <div>
          <h1 className="text-3xl font-black">Customers</h1>
          <p className="text-sm text-gray-500">Manage your organization's customers</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 text-white rounded">Add New Customer</button>
      </header>

      <div className="mt-6">
        <table className="w-full">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-b">
                <td className="py-4">{c.customerName || c.name}</td>
                <td>
                  {c.vatNumber && <div><strong>VAT:</strong> {c.vatNumber}</div>}
                  {c.phoneNumber && <div><strong>Phone:</strong> {c.phoneNumber}</div>}
                  {c.address && <div><strong>Address:</strong> {c.address}</div>}
                  {c.contactInfo && Object.entries(c.contactInfo).map(([k,v]) => <div key={k}><strong>{k}:</strong> {String(v)}</div>)}
                </td>
                <td className="py-4 text-right">
                  <button onClick={() => handleEdit(c)} className="mr-2 text-indigo-600">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-rose-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowModal(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white rounded-lg w-full max-w-2xl p-6 z-10 shadow-lg">
            <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h2>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Organization ID</label>
                <input value={formData.orgId} onChange={e => setFormData({ ...formData, orgId: Number(e.target.value) })} className="mt-1 block w-full border rounded px-3 py-2" />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Additional Contact Fields</h3>
                <button type="button" onClick={addContactField} className="text-sm text-indigo-600">+ Add field</button>
              </div>
              <div className="mt-2 space-y-2">
                {contactDetails.map((d, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input placeholder="Key (e.g. address)" value={d.key} onChange={e => updateContactField(idx, 'key', e.target.value)} className="flex-1 border rounded px-2 py-1" />
                    <input placeholder="Value" value={d.value} onChange={e => updateContactField(idx, 'value', e.target.value)} className="flex-1 border rounded px-2 py-1" />
                    <button type="button" onClick={() => removeContactField(idx)} className="text-rose-600">Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Customers;
