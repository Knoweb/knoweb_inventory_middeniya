import { useEffect, useState } from 'react';
import { retailService, productService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FaTshirt, FaTag, FaStar, FaFire } from 'react-icons/fa';

function Retail() {
  const { user } = useAuth();
  const { confirm } = useNotification();
  const [retailProducts, setRetailProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchSku, setSearchSku] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    orgId: user?.orgId || 1,
    parentSku: '',
    variantSku: '',
    isMasterProduct: false,
    sizeCategory: 'CLOTHING',
    sizeValue: '',
    sizeNumeric: '',
    colorName: '',
    colorCode: '',
    colorFamily: '',
    styleName: '',
    pattern: '',
    material: '',
    season: 'SPRING',
    seasonYear: new Date().getFullYear(),
    collectionName: '',
    isSeasonal: false,
    msrp: '',
    salePrice: '',
    isOnSale: false,
    discountPercentage: '',
    isFeatured: false,
    isNewArrival: false,
    isBestseller: false,
    isClearance: false
  });
  const [saleData, setSaleData] = useState({
    salePrice: '',
    discountPercentage: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchRetailProducts();
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

  const fetchRetailProducts = async () => {
    try {
      let response;
      const orgId = user?.orgId || 1;
      switch (activeTab) {
        case 'clearance':
          response = await retailService.getClearance();
          break;
        case 'on-sale':
          response = await retailService.getOnSale();
          break;
        case 'promotions':
          response = await retailService.getPromotions();
          break;
        case 'featured':
          response = await retailService.getFeatured();
          break;
        case 'new-arrivals':
          response = await retailService.getNewArrivals();
          break;
        case 'bestsellers':
          response = await retailService.getBestsellers();
          break;
        default:
          response = await retailService.getByOrganization(orgId);
      }
      const data = response.data;
      setRetailProducts(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
    } catch (error) {
      console.error('Error fetching retail products:', error);
      setRetailProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const searchVariants = async () => {
    if (searchSku) {
      try {
        const response = await retailService.getVariants(searchSku);
        const data = response.data;
        setRetailProducts(Array.isArray(data) ? data : (data?.content ?? data?.data ?? []));
      } catch (error) {
        console.error('Error searching variants:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await retailService.create(formData);
      setShowModal(false);
      fetchRetailProducts();
      resetForm();
    } catch (error) {
      console.error('Error creating retail product:', error);
      alert('Error creating retail product');
    }
  };

  const handleApplySale = async (e) => {
    e.preventDefault();
    try {
      await retailService.applySale(selectedProduct.id, saleData);
      setShowSaleModal(false);
      fetchRetailProducts();
      setSaleData({ salePrice: '', discountPercentage: '' });
    } catch (error) {
      console.error('Error applying sale:', error);
    }
  };

  const openSaleModal = (product) => {
    setSelectedProduct(product);
    setSaleData({
      salePrice: product.msrp * 0.8, // 20% off by default
      discountPercentage: '20'
    });
    setShowSaleModal(true);
  };

  const handleMarkClearance = async (season, year) => {
    const isConfirmed = await confirm({
      title: 'Initialize Clearance protocol',
      message: `Accelerate stock displacement for all ${season} ${year} assets? This will apply clearance status across the entire collection.`,
      type: 'warning',
      confirmLabel: 'Apply Clearance',
      cancelLabel: 'Abort'
    });
    if (isConfirmed) {
      try {
        await retailService.markAsClearance({ season, year });
        fetchRetailProducts();
      } catch (error) {
        console.error('Error marking clearance:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      orgId: user?.orgId || 1,
      parentSku: '',
      variantSku: '',
      isMasterProduct: false,
      sizeCategory: 'CLOTHING',
      sizeValue: '',
      sizeNumeric: '',
      colorName: '',
      colorCode: '',
      colorFamily: '',
      styleName: '',
      pattern: '',
      material: '',
      season: 'SPRING',
      seasonYear: new Date().getFullYear(),
      collectionName: '',
      isSeasonal: false,
      msrp: '',
      salePrice: '',
      isOnSale: false,
      discountPercentage: '',
      isFeatured: false,
      isNewArrival: false,
      isBestseller: false,
      isClearance: false
    });
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown';
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1><FaTshirt /> Retail Management</h1>
        <p>Size/color variants, seasonal tracking, and promotions</p>
      </div>

      <div className="action-buttons">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Add Retail Variant
        </button>
        <button className="btn btn-secondary" onClick={() => handleMarkClearance('FALL', 2025)}>
          Mark Fall 2025 Clearance
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card" onClick={() => setActiveTab('on-sale')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <h3><FaTag /> On Sale</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {retailProducts.filter(p => p.isOnSale).length}
            </p>
          </div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('clearance')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <h3><FaFire /> Clearance</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
              {retailProducts.filter(p => p.isClearance).length}
            </p>
          </div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('featured')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <h3><FaStar /> Featured</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {retailProducts.filter(p => p.isFeatured).length}
            </p>
          </div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('bestsellers')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <h3><FaFire /> Bestsellers</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {retailProducts.filter(p => p.isBestseller).length}
            </p>
          </div>
        </div>
      </div>

      {/* Search Box */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by Parent SKU..."
            value={searchSku}
            onChange={(e) => setSearchSku(e.target.value)}
            style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button className="btn btn-primary" onClick={searchVariants}>
            Search Variants
          </button>
          <button className="btn btn-secondary" onClick={() => { setSearchSku(''); fetchRetailProducts(); }}>
            Clear
          </button>
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
          className={activeTab === 'on-sale' ? 'active' : ''}
          onClick={() => setActiveTab('on-sale')}
        >
          On Sale
        </button>
        <button
          className={activeTab === 'clearance' ? 'active' : ''}
          onClick={() => setActiveTab('clearance')}
        >
          Clearance
        </button>
        <button
          className={activeTab === 'featured' ? 'active' : ''}
          onClick={() => setActiveTab('featured')}
        >
          Featured
        </button>
        <button
          className={activeTab === 'new-arrivals' ? 'active' : ''}
          onClick={() => setActiveTab('new-arrivals')}
        >
          New Arrivals
        </button>
        <button
          className={activeTab === 'bestsellers' ? 'active' : ''}
          onClick={() => setActiveTab('bestsellers')}
        >
          Bestsellers
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Parent SKU</th>
                <th>Variant SKU</th>
                <th>Color</th>
                <th>Size</th>
                <th>Season</th>
                <th>MSRP</th>
                <th>Sale Price</th>
                <th>Badges</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {retailProducts.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>
                    No retail products found
                  </td>
                </tr>
              ) : (
                retailProducts.map((product) => (
                  <tr key={product.id} style={product.isClearance ? { backgroundColor: '#fee2e2' } : {}}>
                    <td>{getProductName(product.productId)}</td>
                    <td>{product.parentSku}</td>
                    <td>
                      <strong>{product.variantSku}</strong>
                      {product.isMasterProduct && (
                        <span className="badge" style={{ backgroundColor: '#8b5cf6', marginLeft: '0.5rem' }}>
                          Master
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {product.colorCode && (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: product.colorCode,
                            border: '1px solid #ccc',
                            borderRadius: '3px'
                          }}></div>
                        )}
                        {product.colorName}
                      </div>
                    </td>
                    <td>{product.sizeValue}</td>
                    <td>{product.season} {product.seasonYear}</td>
                    <td>Rs.{product.msrp}</td>
                    <td>
                      {product.isOnSale ? (
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                          Rs.{product.salePrice} ({product.discountPercentage}% off)
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {product.isFeatured && (
                        <span className="badge" style={{ backgroundColor: '#3b82f6' }}>Featured</span>
                      )}
                      {product.isNewArrival && (
                        <span className="badge" style={{ backgroundColor: '#10b981', marginLeft: '0.25rem' }}>New</span>
                      )}
                      {product.isBestseller && (
                        <span className="badge" style={{ backgroundColor: '#f59e0b', marginLeft: '0.25rem' }}>Bestseller</span>
                      )}
                      {product.isClearance && (
                        <span className="badge" style={{ backgroundColor: '#ef4444', marginLeft: '0.25rem' }}>Clearance</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openSaleModal(product)}
                      >
                        Apply Sale
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Add Retail Variant</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Product *</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Parent SKU *</label>
                  <input
                    type="text"
                    value={formData.parentSku}
                    onChange={(e) => setFormData({ ...formData, parentSku: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Variant SKU *</label>
                  <input
                    type="text"
                    value={formData.variantSku}
                    placeholder="e.g., TSHIRT-RED-M"
                    onChange={(e) => setFormData({ ...formData, variantSku: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Color Name *</label>
                  <input
                    type="text"
                    value={formData.colorName}
                    onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Color Code (Hex)</label>
                  <input
                    type="color"
                    value={formData.colorCode}
                    onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Color Family</label>
                  <select
                    value={formData.colorFamily}
                    onChange={(e) => setFormData({ ...formData, colorFamily: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="RED">Red</option>
                    <option value="BLUE">Blue</option>
                    <option value="GREEN">Green</option>
                    <option value="BLACK">Black</option>
                    <option value="WHITE">White</option>
                    <option value="GRAY">Gray</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Size Category</label>
                  <select
                    value={formData.sizeCategory}
                    onChange={(e) => setFormData({ ...formData, sizeCategory: e.target.value })}
                  >
                    <option value="CLOTHING">Clothing</option>
                    <option value="SHOES">Shoes</option>
                    <option value="ACCESSORIES">Accessories</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Size Value *</label>
                  <input
                    type="text"
                    value={formData.sizeValue}
                    placeholder="S, M, L, XL, 8, 10, etc."
                    onChange={(e) => setFormData({ ...formData, sizeValue: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Season</label>
                  <select
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  >
                    <option value="SPRING">Spring</option>
                    <option value="SUMMER">Summer</option>
                    <option value="FALL">Fall</option>
                    <option value="WINTER">Winter</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Season Year</label>
                  <input
                    type="number"
                    value={formData.seasonYear}
                    onChange={(e) => setFormData({ ...formData, seasonYear: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Collection Name</label>
                  <input
                    type="text"
                    value={formData.collectionName}
                    onChange={(e) => setFormData({ ...formData, collectionName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Material</label>
                  <input
                    type="text"
                    value={formData.material}
                    placeholder="Cotton, Polyester, etc."
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>MSRP *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.msrp}
                    onChange={(e) => setFormData({ ...formData, msrp: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Sale Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    />
                    {' '}Featured
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isNewArrival}
                      onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                    />
                    {' '}New Arrival
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="modal" onClick={() => setShowSaleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Apply Sale</h2>
              <button className="close-btn" onClick={() => setShowSaleModal(false)}>×</button>
            </div>
            <form onSubmit={handleApplySale}>
              <div className="form-group">
                <label>Original Price (MSRP)</label>
                <input type="text" value={`Rs.${selectedProduct?.msrp}`} disabled />
              </div>
              <div className="form-group">
                <label>Sale Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={saleData.salePrice}
                  onChange={(e) => setSaleData({ ...saleData, salePrice: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Discount Percentage *</label>
                <input
                  type="number"
                  step="0.01"
                  value={saleData.discountPercentage}
                  onChange={(e) => setSaleData({ ...saleData, discountPercentage: e.target.value })}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSaleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Apply Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Retail;
