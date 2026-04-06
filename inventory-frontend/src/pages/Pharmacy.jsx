import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pharmacyService, productService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaPills, FaExclamationTriangle, FaSnowflake, FaBan } from 'react-icons/fa';

function Pharmacy() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pharmacyProducts, setPharmacyProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expiringDays, setExpiringDays] = useState(30);


  useEffect(() => {
    fetchProducts();
    fetchPharmacyProducts();
  }, [activeTab, expiringDays]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      const data = response.data;
      setProducts(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchPharmacyProducts = async () => {
    try {
      let response;
      const orgId = user?.orgId || 1;
      switch (activeTab) {
        case 'expiring':
          response = await pharmacyService.getExpiring(expiringDays);
          break;
        case 'expired':
          response = await pharmacyService.getExpired();
          break;
        case 'prescription':
          response = await pharmacyService.getPrescription(true);
          break;
        case 'controlled':
          response = await pharmacyService.getControlled('II');
          break;
        case 'refrigerated':
          response = await pharmacyService.getRefrigerated();
          break;
        case 'recalled':
          response = await pharmacyService.getRecalled();
          break;
        default:
          response = await pharmacyService.getByOrganization(orgId);
      }
      const data = response.data;
      setPharmacyProducts(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
    } catch (error) {
      console.error('Error fetching pharmacy products:', error);
      setPharmacyProducts([]);
    } finally {
      setLoading(false);
    }
  };



  const handleRecall = async (id) => {
    const reason = prompt('Enter recall reason:');
    if (reason) {
      try {
        await pharmacyService.recall(id, reason);
        fetchPharmacyProducts();
        alert('Product recalled successfully');
      } catch (error) {
        console.error('Error recalling product:', error);
      }
    }
  };

  const handleUpdateExpiry = async () => {
    try {
      await pharmacyService.updateExpiryStatuses();
      fetchPharmacyProducts();
      alert('Expiry statuses updated successfully');
    } catch (error) {
      console.error('Error updating expiry statuses:', error);
    }
  };



  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown';
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1><FaPills /> Pharmacy Management</h1>
        <p>Batch tracking, expiry dates, and prescription management</p>
      </div>

      <div className="action-buttons">
        <button className="btn btn-primary" onClick={() => navigate('/products/register')}>
          Register New Product
        </button>
        <button className="btn btn-secondary" onClick={handleUpdateExpiry}>
          Update Expiry Statuses
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card" onClick={() => setActiveTab('expiring')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <h3><FaExclamationTriangle /> Expiring Soon</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {pharmacyProducts.filter(p => p.daysUntilExpiry <= 30 && !p.isExpired).length}
            </p>
          </div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('expired')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <h3><FaBan /> Expired</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
              {pharmacyProducts.filter(p => p.isExpired).length}
            </p>
          </div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('prescription')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <h3><FaPills /> Prescription</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {pharmacyProducts.filter(p => p.isPrescriptionRequired).length}
            </p>
          </div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('refrigerated')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <h3><FaSnowflake /> Refrigerated</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {pharmacyProducts.filter(p => p.requiresRefrigeration).length}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => setActiveTab('all')}
        >
          All Products
        </button>
        <button
          className={activeTab === 'expiring' ? 'active' : ''}
          onClick={() => setActiveTab('expiring')}
        >
          Expiring Soon
        </button>
        <button
          className={activeTab === 'expired' ? 'active' : ''}
          onClick={() => setActiveTab('expired')}
        >
          Expired
        </button>
        <button
          className={activeTab === 'prescription' ? 'active' : ''}
          onClick={() => setActiveTab('prescription')}
        >
          Prescription Only
        </button>
        <button
          className={activeTab === 'controlled' ? 'active' : ''}
          onClick={() => setActiveTab('controlled')}
        >
          Controlled
        </button>
        <button
          className={activeTab === 'recalled' ? 'active' : ''}
          onClick={() => setActiveTab('recalled')}
        >
          Recalled
        </button>
      </div>

      {activeTab === 'expiring' && (
        <div style={{ margin: '1rem 0' }}>
          <label>Show items expiring within: </label>
          <select value={expiringDays} onChange={(e) => setExpiringDays(e.target.value)}>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Batch#</th>
                <th>Ingredient</th>
                <th>Strength</th>
                <th>Expiry Date</th>
                <th>Days Until Expiry</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pharmacyProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                    No pharmacy products found
                  </td>
                </tr>
              ) : (
                pharmacyProducts.map((product) => (
                  <tr key={product.id} style={product.isExpired ? { backgroundColor: '#fee2e2' } : product.daysUntilExpiry <= 30 ? { backgroundColor: '#fef3c7' } : {}}>
                    <td>{getProductName(product.productId)}</td>
                    <td>{product.batchNumber}</td>
                    <td>{product.activeIngredient}</td>
                    <td>{product.strength}</td>
                    <td>{product.expiryDate}</td>
                    <td>
                      <span style={{
                        color: product.isExpired ? '#ef4444' : product.daysUntilExpiry <= 30 ? '#f59e0b' : '#10b981'
                      }}>
                        {product.daysUntilExpiry} days
                      </span>
                    </td>
                    <td>
                      {product.isPrescriptionRequired && (
                        <span className="badge" style={{ backgroundColor: '#3b82f6' }}>
                          {product.prescriptionType}
                        </span>
                      )}
                      {product.requiresRefrigeration && (
                        <span className="badge" style={{ backgroundColor: '#06b6d4', marginLeft: '0.5rem' }}>
                          <FaSnowflake /> Cold
                        </span>
                      )}
                    </td>
                    <td>
                      {product.isRecalled ? (
                        <span className="badge" style={{ backgroundColor: '#ef4444' }}>RECALLED</span>
                      ) : product.isExpired ? (
                        <span className="badge" style={{ backgroundColor: '#ef4444' }}>EXPIRED</span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#10b981' }}>Active</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRecall(product.id)}
                        disabled={product.isRecalled}
                      >
                        Recall
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}

export default Pharmacy;
