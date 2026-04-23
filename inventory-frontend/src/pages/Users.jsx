import React, { useState, useEffect } from 'react';
import { identityUserService, authService } from '../services/api';
import { FaUser, FaEdit, FaTrash, FaPlus, FaSearch, FaBuilding, FaBriefcase } from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';

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
      if (editingUser) {
        await identityUserService.update(editingUser.id, formData);
        showToast('User profile synchronization complete', 'success');
      } else {
        await authService.register(formData);
        showToast('New user identity successfully established', 'success');
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      showToast(error.response?.data?.message || 'Biometric/Identity validation failed', 'error');
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

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Purge User Identity',
      message: 'This operation will permanently revoke all access for this identity. Confirm protocol execution?',
      type: 'danger',
      confirmLabel: 'Purge Identity',
      cancelLabel: 'Retain User'
    });

    if (isConfirmed) {
      try {
        await identityUserService.delete(id);
        showToast('User identity purged from live grid', 'warning');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Identity revocation protocol failed', 'error');
      }
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
                          onClick={() => handleDelete(user.id)}
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
    </div>
  );
};

export default Users;
