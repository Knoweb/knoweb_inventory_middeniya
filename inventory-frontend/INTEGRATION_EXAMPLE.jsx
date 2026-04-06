// INTEGRATION EXAMPLE: How to add the form to Manufacturing.jsx

// 1. Add import at the top of Manufacturing.jsx
import ManufacturingProductForm from '../components/ManufacturingProductForm_ReactIcons';

// 2. Add state for showing the form
const [showProductForm, setShowProductForm] = useState(false);

// 3. Add handler for form submission
const handleProductFormSubmit = async (formData) => {
  try {
    // Map form data to your backend API format
    const productData = {
      sku: formData.partNumber,
      name: formData.itemName,
      category: formData.itemType,
      unit: formData.uom,
      price: parseFloat(formData.salesPrice || formData.standardCost),
      costPrice: parseFloat(formData.standardCost),
      reorderLevel: parseInt(formData.minimumStockLevel),
      orgId: user?.orgId,
      industryType: 'MANUFACTURING',
      isActive: true,
      industrySpecificAttributes: {
        itemType: formData.itemType,
        supplier: formData.supplier || null,
      }
    };

    // Create product
    const productResponse = await productService.create(productData);
    
    // If initial stock provided, create stock record
    if (formData.warehouse && formData.quantity) {
      const stockData = {
        productId: productResponse.data.id,
        warehouseId: formData.warehouse,
        quantity: parseInt(formData.quantity),
        location: formData.binLocation || null,
        lotNumber: formData.lotNumber || null,
      };
      
      await inventoryService.createStock(stockData);
    }

    alert('Manufacturing item created successfully!');
    setShowProductForm(false);
    fetchProducts(); // Refresh the products list
  } catch (error) {
    console.error('Error creating item:', error);
    alert('Failed to create item: ' + (error.response?.data?.message || 'Unknown error'));
  }
};

// 4. Add button to open the form (in your JSX, near other action buttons)
<button 
  className="btn-primary"
  onClick={() => setShowProductForm(true)}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }}
>
  <FaPlus /> Create Manufacturing Item
</button>

// 5. Add the form component at the end of your JSX (before closing tags)
{showProductForm && (
  <ManufacturingProductForm 
    onSubmit={handleProductFormSubmit}
    onCancel={() => setShowProductForm(false)}
  />
)}

/*
COMPLETE EXAMPLE - Manufacturing.jsx with Form Integration
*/

import { useEffect, useState } from 'react';
import { manufacturingService, productService, inventoryService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaIndustry, FaCogs, FaPlus, FaBoxes } from 'react-icons/fa';
import ManufacturingProductForm from '../components/ManufacturingProductForm_ReactIcons';

function Manufacturing() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductFormSubmit = async (formData) => {
    try {
      const productData = {
        sku: formData.partNumber,
        name: formData.itemName,
        category: formData.itemType,
        unit: formData.uom,
        price: parseFloat(formData.salesPrice || formData.standardCost),
        costPrice: parseFloat(formData.standardCost),
        reorderLevel: parseInt(formData.minimumStockLevel),
        orgId: user?.orgId,
        industryType: 'MANUFACTURING',
        isActive: true,
        industrySpecificAttributes: {
          itemType: formData.itemType,
          supplier: formData.supplier || null,
        }
      };

      const productResponse = await productService.create(productData);
      
      // Create initial stock if provided
      if (formData.warehouse && formData.quantity) {
        const stockData = {
          productId: productResponse.data.id,
          warehouseId: formData.warehouse,
          quantity: parseInt(formData.quantity),
          location: formData.binLocation || null,
          lotNumber: formData.lotNumber || null,
        };
        
        await inventoryService.createStock(stockData);
      }

      alert('Manufacturing item created successfully!');
      setShowProductForm(false);
      fetchProducts();
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          <FaIndustry /> Manufacturing
        </h1>
        <button 
          className="btn-primary"
          onClick={() => setShowProductForm(true)}
        >
          <FaPlus /> Create Manufacturing Item
        </button>
      </div>

      {/* Your existing content */}
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            {/* Product card content */}
          </div>
        ))}
      </div>

      {/* Manufacturing Product Form */}
      {showProductForm && (
        <ManufacturingProductForm 
          onSubmit={handleProductFormSubmit}
          onCancel={() => setShowProductForm(false)}
        />
      )}
    </div>
  );
}

export default Manufacturing;
