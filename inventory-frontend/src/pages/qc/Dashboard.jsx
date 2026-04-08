import React from 'react';

const QCDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Quality Control (QC) Dashboard</h1>
      <p className="text-gray-600 mb-8">Inspect flagged inventory and review damage segregation.</p>
      
      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Pending Inspections (QC Hold Area)</h2>
        
        <table className="w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
          <thead className="bg-slate-100 text-left border-b border-slate-200">
            <tr>
                <th className="px-6 py-3 font-semibold text-gray-600">PO Number</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Item Received</th>
                <th className="px-6 py-3 font-semibold text-red-600">Quantity Damaged</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Reason</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-600">Decide</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50 border-b border-gray-100">
                <td className="px-6 py-4">PO-2026-0142</td>
                <td className="px-6 py-4">RAW-PLAST-001</td>
                <td className="px-6 py-4 font-bold text-red-500">20</td>
                <td className="px-6 py-4 text-sm text-gray-500">Moisture exposure</td>
                <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <button className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-100 text-sm">Scrap</button>
                    <button className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-100 text-sm">Repair / Add to Stock</button>
                </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QCDashboard;