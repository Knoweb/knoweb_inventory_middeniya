import React from 'react';

const AssembleDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Assemble Layout</h1>
      <p className="text-gray-600 mb-8">Process incoming materials from molding, assemble units, and prepare for final finishing.</p>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">WIP Assemblies (Pending Review)</h2>
        
        <table className="w-full text-left bg-gray-50 rounded overflow-hidden shadow-inner">
            <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-600">Batch ID</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Start Date</th>
              <th className="px-6 py-3 text-right font-semibold text-gray-600">Actions</th>
            </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-6 py-4">No incoming batches from Molding yet.</td>
              </tr>
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssembleDashboard;