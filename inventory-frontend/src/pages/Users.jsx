import React, { useState, useEffect } from 'react';
import { identityUserService, authService } from '../services/api';
import { FaUser, FaEdit, FaTrash, FaPlus, FaSearch, FaBuilding, FaBriefcase } from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';
import { Trash2, RefreshCw, CheckCircle2, X, AlertCircle, UserMinus } from 'lucide-react';

const Users = () => {
  const { showToast, confirm } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'USER',
    organizationId: '',
    branchId: '',
    active: true,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await identityUserService.getAll();
      const data = response.data;
      setUsers(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Synchronization protocol failed', 'error');
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
      setIsSubmitting(true);
      if (editingUser) {
        await identityUserService.update(editingUser.id, formData);
        setSuccessMessage('Identity Profile Successfully Synchronized');
      } else {
        await authService.register(formData);
        setSuccessMessage('New Identity Established in Central Grid');
      }
      setShowModal(false);
      resetForm();
      setShowSuccessModal(true);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      showToast(error.response?.data?.message || 'Biometric/Identity validation failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      password: '',
      role: user.role || 'USER',
      organizationId: user.organizationId || '',
      branchId: user.branchId || '',
      active: user.active !== false,
    });
    setShowModal(true);
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      setIsSubmitting(true);
      await identityUserService.delete(userToDelete.id);
      setSuccessMessage('Identity Purged from Active Grid');
      setShowDeleteModal(false);
      setUserToDelete(null);
      setShowSuccessModal(true);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Identity revocation protocol failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'USER',
      organizationId: '',
      branchId: '',
      active: true,
    });
    setEditingUser(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
            Manage system users and permissions
          </p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <FaPlus /> Add User
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <FaSearch style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
          }} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: 'white',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          Loading users...
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Organization</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaUser style={{ color: '#3b82f6' }} />
                        <span style={{ fontWeight: '600' }}>{user.username}</span>
                      </div>
                    </td>
                    <td>{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: user.role === 'ADMIN' ? '#8b5cf6' :
                          user.role === 'MANAGER' ? '#3b82f6' : '#6b7280'
                      }}>
                        {user.role || 'USER'}
                      </span>
                    </td>
                    <td>
                      {user.organizationId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaBuilding style={{ color: '#9ca3af', fontSize: '0.875rem' }} />
                          <span>{user.organizationId}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      {user.branchId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaBriefcase style={{ color: '#9ca3af', fontSize: '0.875rem' }} />
                          <span>{user.branchId}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: user.active !== false ? '#10b981' : '#6b7280'
                      }}>
                        {user.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-icon" onClick={() => handleEdit(user)} title="Edit">
                          <FaEdit />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => confirmDelete(user)}
                          title="Delete"
                          style={{ color: '#ef4444' }}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingUser}
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
                {!editingUser && (
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingUser}
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Role *</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} required>
                    <option value="USER">User</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Organization ID</label>
                  <input
                    type="number"
                    name="organizationId"
                    value={formData.organizationId}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Branch ID</label>
                  <input
                    type="number"
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="active"
                      checked={formData.active}
                      onChange={handleInputChange}
                    />
                    <span>Active User</span>
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update' : 'Create'} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal (Matching design) */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowSuccessModal(false)}>
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="pt-10 pb-8 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Protocol Success</h3>
              <p className="text-center px-10 text-slate-500 font-bold leading-relaxed mb-10">
                {successMessage}
              </p>
              
              <div className="w-full px-12">
                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200"
                >
                  Confirm & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (matching design) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="pt-10 pb-4 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center mb-8">
                <UserMinus className="w-10 h-10 text-rose-500" />
              </div>
              
              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Purge Identity</h3>
              <p className="text-center px-10 text-slate-500 font-bold leading-relaxed mb-10">
                Are you sure you want to permanently revoke all access for <strong>{userToDelete?.username}</strong>? This action cannot be undone.
              </p>
              
              <div className="w-full px-8 flex gap-4 mb-8">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-slate-50 text-slate-600 font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-rose-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:grayscale"
                >
                  {isSubmitting ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Purge
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
