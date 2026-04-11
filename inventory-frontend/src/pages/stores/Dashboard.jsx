import React from 'react';
import { useNavigate } from 'react-router-dom';

const StoresDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Stock Keeper Dashboard</h1>
      <p className="text-gray-600 mb-8">Manage raw materials, record stock-in, and segregate damaged goods.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Stock In / Receiving</h2>
          <p className="text-sm text-gray-500 mb-4">Create new batches from incoming purchase orders.</p>
          <button 
            onClick={() => navigate('/stores/receiving')}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-blue-700 transition-colors"
          >
            Record Stock In
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Purchase Orders</h2>
          <p className="text-sm text-gray-500 mb-4">Manage multi-item purchase orders and suppliers.</p>
          <button 
            onClick={() => navigate('/stores/purchase-orders')}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-blue-700 transition-colors"
          >
            View POs
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Current Stock & Ledger</h2>
          <p className="text-sm text-gray-500 mb-4">View current inventory levels, expiry alerts, and stock valuations.</p>
          <button 
            onClick={() => navigate('/stock-ledger')}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-blue-700 transition-colors"
          >
            View Ledger
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoresDashboard;