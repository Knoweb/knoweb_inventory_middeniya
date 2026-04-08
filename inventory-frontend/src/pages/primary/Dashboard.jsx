import React from 'react';

const PrimaryDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Primary / Finishing Dashboard</h1>
      <p className="text-gray-600 mb-8">Final step of manufacturing. Verify assembled goods, log final scraps, and transition to Finished Goods stock.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Incoming Batches (From Assembly)</h2>
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded p-8 text-center text-gray-500">
                No active assembly batches pending final finish.
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Recent Finished Goods</h2>
            <div className="bg-gray-50 rounded p-4 text-sm scroll-y">
                <ul>
                    <li className="flex justify-between py-2 border-b border-gray-200">
                        <span className="font-semibold text-green-700">Finished Batches sent to stores.</span>
                    </li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrimaryDashboard;