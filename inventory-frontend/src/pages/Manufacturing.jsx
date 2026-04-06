import { useEffect, useState } from 'react';
import { manufacturingService, productService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaIndustry, FaCogs, FaClipboardCheck, FaExclamationCircle, FaBoxes, FaCheckCircle } from 'react-icons/fa';
import ManufacturingProductForm from '../components/ManufacturingProductForm_ReactIcons';

function Manufacturing() {
  const { user } = useAuth();
  const [manufacturingProducts, setManufacturingProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('wip');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inspectionData, setInspectionData] = useState({
    status: 'PASSED',
    grade: 'A',
    defectCount: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchManufacturingProducts();
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      const data = response.data;
      setProducts(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchManufacturingProducts = async () => {
    try {
      let response;
      const orgId = user?.orgId || 1;
      switch (activeTab) {
        case 'raw-materials':
          response = await manufacturingService.getRawMaterials(orgId);
          break;
        case 'wip':
          response = await manufacturingService.getWip(orgId);
          break;
        case 'wip-active':
          response = await manufacturingService.getActiveWip();
          break;
        case 'wip-overdue':
          response = await manufacturingService.getOverdueWip();
          break;
        case 'finished-goods':
          response = await manufacturingService.getFinishedGoods(orgId);
          break;
        case 'pending-inspection':
          response = await manufacturingService.getPendingInspection();
          break;
        case 'rework':
          response = await manufacturingService.getReworkRequired();
          break;
        default:
          response = await manufacturingService.getWip(orgId);
      }
      const data = response.data;
      setManufacturingProducts(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
    } catch (error) {
      console.error('Error fetching manufacturing products:', error);
      setManufacturingProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductFormSubmit = async (formData) => {
    try {
      // Map form data to product API format
      const productData = {
        sku: formData.partNumber,
        name: formData.itemName,
        category: formData.itemType,
        unit: formData.uom,
        price: parseFloat(formData.salesPrice || formData.standardCost || 0),
        reorderLevel: parseInt(formData.minimumStockLevel || 0),
        orgId: user?.orgId || 1,
        industryType: 'MANUFACTURING'
      };

      const response = await productService.create(productData);

      // If initial stock provided, create stock record
      if (formData.warehouse && formData.quantity) {
        // Note: You may need to implement stock creation via inventory service
        console.log('Initial stock:', {
          productId: response.data.id,
          warehouse: formData.warehouse,
          binLocation: formData.binLocation,
          lotNumber: formData.lotNumber,
          quantity: formData.quantity
        });
      }

      setShowModal(false);
      fetchProducts();
      alert('Manufacturing item created successfully!');
    } catch (error) {
      console.error('Error creating manufacturing item:', error);
      alert('Error creating manufacturing item: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateWipStatus = async (id, newStatus) => {
    try {
      await manufacturingService.updateWipStatus(id, newStatus);
      fetchManufacturingProducts();
    } catch (error) {
      console.error('Error updating WIP status:', error);
    }
  };

  const openInspectionModal = (product) => {
    setSelectedProduct(product);
    setInspectionData({
      status: 'PASSED',
      grade: 'A',
      defectCount: 0
    });
    setShowInspectionModal(true);
  };

  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    try {
      await manufacturingService.updateInspection(selectedProduct.id, inspectionData);
      setShowInspectionModal(false);
      fetchManufacturingProducts();
    } catch (error) {
      console.error('Error updating inspection:', error);
    }
  };



  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown';
  };

  const getStatusColor = (status) => {
    const colors = {
      'QUEUED': '#6b7280',
      'IN_PROGRESS': '#3b82f6',
      'ON_HOLD': '#f59e0b',
      'COMPLETED': '#10b981',
      'SCRAPPED': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getInspectionColor = (status) => {
    const colors = {
      'PENDING': '#f59e0b',
      'IN_PROGRESS': '#3b82f6',
      'PASSED': '#10b981',
      'FAILED': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1><FaIndustry /> Manufacturing</h1>
        <p>WIP tracking, BOM management, and quality control</p>
      </div>

      <div className="action-buttons">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Add Manufacturing Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card" onClick={() => setActiveTab('wip-active')} style={{ cursor: 'pointer', transition: 'transform 0.2s', borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-info">
            <h3><FaCogs style={{ color: '#3b82f6' }} /> Active WIP</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {manufacturingProducts.filter(p => p.wipStatus === 'IN_PROGRESS' || p.wipStatus === 'ON_HOLD').length}
            </p>
          </div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('wip-overdue')} style={{ cursor: 'pointer', transition: 'transform 0.2s', borderLeft: '4px solid #ef4444' }}>
          <div className="stat-info">
            <h3><FaExclamationCircle style={{ color: '#ef4444' }} /> Overdue</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
              {manufacturingProducts.filter(p => p.estimatedCompletionDate && new Date(p.estimatedCompletionDate) < new Date()).length}
            </p>
          </div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('pending-inspection')} style={{ cursor: 'pointer', transition: 'transform 0.2s', borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-info">
            <h3><FaClipboardCheck style={{ color: '#f59e0b' }} /> Inspection</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {manufacturingProducts.filter(p => p.inspectionStatus === 'PENDING').length}
            </p>
          </div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('rework')} style={{ cursor: 'pointer', transition: 'transform 0.2s', borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-info">
            <h3><FaExclamationCircle style={{ color: '#f59e0b' }} /> Rework</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {manufacturingProducts.filter(p => p.reworkRequired).length}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'raw-materials' ? 'active' : ''}
          onClick={() => setActiveTab('raw-materials')}
        >
          Raw Materials
        </button>
        <button
          className={activeTab === 'wip' ? 'active' : ''}
          onClick={() => setActiveTab('wip')}
        >
          All WIP
        </button>
        <button
          className={activeTab === 'wip-active' ? 'active' : ''}
          onClick={() => setActiveTab('wip-active')}
        >
          Active WIP
        </button>
        <button
          className={activeTab === 'wip-overdue' ? 'active' : ''}
          onClick={() => setActiveTab('wip-overdue')}
        >
          Overdue
        </button>
        <button
          className={activeTab === 'finished-goods' ? 'active' : ''}
          onClick={() => setActiveTab('finished-goods')}
        >
          Finished Goods
        </button>
        <button
          className={activeTab === 'pending-inspection' ? 'active' : ''}
          onClick={() => setActiveTab('pending-inspection')}
        >
          Inspection
        </button>
        <button
          className={activeTab === 'rework' ? 'active' : ''}
          onClick={() => setActiveTab('rework')}
        >
          Rework
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Work Order</th>
                <th>Production Line</th>
                <th>WIP Status</th>
                <th>Completion %</th>
                <th>Inspection</th>
                <th>Quality Grade</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {manufacturingProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                    No manufacturing products found
                  </td>
                </tr>
              ) : (
                manufacturingProducts.map((product) => (
                  <tr key={product.id} style={{
                    backgroundColor: product.wipStatus === 'SCRAPPED' ? '#fee2e2' :
                      product.reworkRequired ? '#fef3c7' :
                        product.wipStatus === 'COMPLETED' ? '#d1fae5' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}>
                    <td>
                      <strong>{getProductName(product.productId)}</strong>
                      <br />
                      <small style={{ color: '#6b7280' }}>
                        {product.partNumber && `Part: ${product.partNumber}`}
                        {product.lotNumber && ` | Lot: ${product.lotNumber}`}
                      </small>
                    </td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: product.productType === 'RAW_MATERIAL' ? '#6b7280' :
                          product.productType === 'WIP' ? '#3b82f6' :
                            product.productType === 'FINISHED_GOOD' ? '#10b981' : '#8b5cf6',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {product.productType === 'RAW_MATERIAL' && <FaBoxes />}
                        {product.productType === 'WIP' && <FaCogs />}
                        {product.productType === 'FINISHED_GOOD' && <FaCheckCircle />}
                        {product.productType}
                      </span>
                    </td>
                    <td>{product.workOrderNumber || '-'}</td>
                    <td>{product.productionLine || '-'}</td>
                    <td>
                      {product.wipStatus ? (
                        <span className="badge" style={{ backgroundColor: getStatusColor(product.wipStatus) }}>
                          {product.wipStatus}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {product.completionPercentage ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '100px',
                            height: '8px',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${product.completionPercentage}%`,
                              height: '100%',
                              backgroundColor: '#3b82f6'
                            }}></div>
                          </div>
                          <span>{product.completionPercentage}%</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {product.inspectionStatus ? (
                        <span className="badge" style={{ backgroundColor: getInspectionColor(product.inspectionStatus) }}>
                          {product.inspectionStatus}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {product.qualityGrade || '-'}
                      {product.reworkRequired && (
                        <span className="badge" style={{ backgroundColor: '#ef4444', marginLeft: '0.5rem' }}>
                          Rework Required
                        </span>
                      )}
                    </td>
                    <td>
                      {product.wipStatus && product.wipStatus !== 'COMPLETED' && (
                        <select
                          value={product.wipStatus}
                          onChange={(e) => handleUpdateWipStatus(product.id, e.target.value)}
                          style={{ padding: '0.25rem', marginRight: '0.5rem' }}
                        >
                          <option value="QUEUED">Queued</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="ON_HOLD">On Hold</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="SCRAPPED">Scrapped</option>
                        </select>
                      )}
                      {product.inspectionStatus === 'PENDING' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openInspectionModal(product)}
                        >
                          Inspect
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manufacturing Item Definition Form */}
      {showModal && (
        <ManufacturingProductForm
          onCancel={() => setShowModal(false)}
          onSubmit={handleProductFormSubmit}
        />
      )}

      {/* Inspection Modal */}
      {showInspectionModal && selectedProduct && (
        <div className="modal" onClick={() => setShowInspectionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Update Inspection</h2>
              <button className="close-btn" onClick={() => setShowInspectionModal(false)}>×</button>
            </div>
            <form onSubmit={handleInspectionSubmit}>
              <div className="form-group">
                <label>Product</label>
                <input
                  type="text"
                  value={getProductName(selectedProduct.productId)}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Inspection Status *</label>
                <select
                  value={inspectionData.status}
                  onChange={(e) => setInspectionData({ ...inspectionData, status: e.target.value })}
                  required
                >
                  <option value="PASSED">Passed</option>
                  <option value="FAILED">Failed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                </select>
              </div>
              <div className="form-group">
                <label>Quality Grade *</label>
                <select
                  value={inspectionData.grade}
                  onChange={(e) => setInspectionData({ ...inspectionData, grade: e.target.value })}
                  required
                >
                  <option value="A">A - Excellent</option>
                  <option value="B">B - Good</option>
                  <option value="C">C - Acceptable</option>
                  <option value="REJECT">Reject</option>
                </select>
              </div>
              <div className="form-group">
                <label>Defect Count</label>
                <input
                  type="number"
                  min="0"
                  value={inspectionData.defectCount}
                  onChange={(e) => setInspectionData({ ...inspectionData, defectCount: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInspectionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Manufacturing;
