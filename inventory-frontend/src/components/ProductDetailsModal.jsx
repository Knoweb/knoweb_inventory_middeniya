import React from 'react';
import { FaBox, FaTags, FaHashtag, FaMoneyBillWave, FaRuler, FaExclamationTriangle, FaPills, FaSnowflake } from 'react-icons/fa';

export default function ProductDetailsModal({ isOpen, onClose, product, isPharmacy }) {
    if (!isOpen || !product) return null;

    const unit = product.unit || 'UNIT';
    const genericName = product.industrySpecificAttributes?.genericName || product.genericName || '-';
    const isPrescription = product.industrySpecificAttributes?.isPrescriptionRequired || product.isPrescriptionRequired || false;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                            <FaBox size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-800">{product.name || 'Unnamed Product'}</h2>
                            <p className="text-xs font-mono text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded inline-block mt-1">{product.sku || product.productId || 'N/A'}</p>
                        </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 text-3xl leading-none transition-colors" onClick={onClose}>&times;</button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><FaTags /> Category</p>
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider border border-gray-200">{product.category || '-'}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><FaHashtag /> Brand</p>
                            <p className="font-bold text-gray-800">{product.brand || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><FaMoneyBillWave /> Price</p>
                            <p className="font-black text-gray-900 text-lg">Rs. {product.price?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><FaRuler /> Unit</p>
                            <p className="font-bold text-gray-800">{unit}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><FaExclamationTriangle /> Reorder Level</p>
                            <p className={`font-bold ${product.reorderLevel <= 10 ? 'text-red-600' : 'text-gray-800'}`}>{product.reorderLevel || 'Not Set'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                            {product.isActive !== false ? (
                                <span className="px-3 py-1 rounded bg-green-100 text-green-700 text-xs font-black uppercase inline-block">Active</span>
                            ) : (
                                <span className="px-3 py-1 rounded bg-red-100 text-red-700 text-xs font-black uppercase inline-block">Inactive</span>
                            )}
                        </div>
                    </div>

                    {product.description && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200 leading-relaxed shadow-sm">{product.description}</p>
                        </div>
                    )}

                    {isPharmacy && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h3 className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-4">Pharmacy Details</h3>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100/50">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Generic Name</p>
                                    <p className="font-bold text-gray-800 text-sm">{genericName}</p>
                                </div>
                                {product.activeIngredient && (
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Ingredient</p>
                                        <p className="font-bold text-gray-800 text-sm">{product.activeIngredient}</p>
                                    </div>
                                )}
                                {product.strength && (
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Strength</p>
                                        <p className="font-bold text-gray-800 text-sm">{product.strength}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Attributes</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {isPrescription && <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase flex items-center gap-1"><FaPills size={10} /> Rx</span>}
                                        {product.requiresRefrigeration && <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-700 text-[10px] font-black uppercase flex items-center gap-1"><FaSnowflake size={10} /> Cold</span>}
                                        {!isPrescription && !product.requiresRefrigeration && <span className="text-xs text-gray-400 font-bold">-</span>}
                                    </div>
                                </div>
                                {product.expiryDate && (
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expiry & Batch</p>
                                        <div className="flex flex-col text-sm">
                                            <span className="font-bold text-gray-800">EXP: {product.expiryDate}</span>
                                            <span className="text-gray-500 font-mono text-xs">Batch: {product.batchNumber || '-'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors text-sm active:scale-95" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}