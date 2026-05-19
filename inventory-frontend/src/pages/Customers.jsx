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

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', orgId: user?.orgId || 1 });
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
    setFormData({ name: '', email: '', phone: '', orgId: user?.orgId || 1 });
    setContactDetails([]);
    setIsEditing(false);
    setEditId(null);
  };

  const openAddModal = () => { resetForm(); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const contactInfoPayload = { email: formData.email, phone: formData.phone };
      contactDetails.forEach(d => { if (d.key && d.value) contactInfoPayload[d.key] = d.value; });

      const payload = { name: formData.name, orgId: formData.orgId, contactInfo: contactInfoPayload };
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
                <td className="py-4">{c.name}</td>
                <td>{c.contactInfo && Object.entries(c.contactInfo).map(([k,v]) => <div key={k}><strong>{k}:</strong> {String(v)}</div>)}</td>
                <td className="py-4 text-right">
                  <button onClick={() => {/* implement edit */}} className="mr-2">Edit</button>
                  <button onClick={() => handleDelete(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Customers;
