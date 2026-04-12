import React from "react";
import { Warehouse } from "lucide-react";

const StoresDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Stock Keeper Dashboard</h1>
      <p className="text-gray-600 mb-8">Manage raw materials, record stock-in, and segregate damaged goods.</p>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-indigo-50/50 rounded-full flex items-center justify-center mb-6">
          <Warehouse className="w-12 h-12 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Welcome to Stores Operations</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Please use the navigation menu on the left (Sidebar) to access Purchase Orders, Stock In / Adjustments, and the Stock Ledger.
        </p>
      </div>
    </div>
  );
};

export default StoresDashboard;

