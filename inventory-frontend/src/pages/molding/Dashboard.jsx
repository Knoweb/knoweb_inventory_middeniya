import React from 'react';

const MoldingDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Injection Molding Layout</h1>
      <p className="text-gray-600 mb-8">Track plastic molding WIP batches, manage raw material input, and advance stage.</p>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-semibold text-gray-800">WIP Kanban Board - Molding Phase</h2>
            <button className="bg-green-600 text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-green-700">Pull Materials</button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded p-4 shadow-inner min-h-[300px]">
                <h3 className="font-bold text-sm text-gray-500 uppercase mb-4 tracking-wider">Queue</h3>
                {/* WIP Items would go here */}
                <div className="bg-white p-3 rounded shadow-sm text-sm border-l-4 border-yellow-400 mb-2">Batch #BATCH-PL-001 (Waiting)</div>
            </div>
            <div className="bg-gray-50 rounded p-4 shadow-inner min-h-[300px]">
                <h3 className="font-bold text-sm text-gray-500 uppercase mb-4 tracking-wider">In Progress</h3>
                 <div className="bg-white p-3 rounded shadow-sm text-sm border-l-4 border-blue-400 mb-2">Batch #BATCH-PL-002 (Molding)</div>
            </div>
            <div className="bg-gray-50 rounded p-4 shadow-inner min-h-[300px]">
                <h3 className="font-bold text-sm text-gray-500 uppercase mb-4 tracking-wider">Ready for Assemble</h3>
                <div className="bg-white p-3 rounded shadow-sm text-sm border-l-4 border-green-400 flex flex-col gap-2">
                    <span>Batch #BATCH-PL-000 (Complete)</span>
                    <button className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs py-1 rounded w-full hover:bg-indigo-100 transition-colors">Advance Batch →</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MoldingDashboard;