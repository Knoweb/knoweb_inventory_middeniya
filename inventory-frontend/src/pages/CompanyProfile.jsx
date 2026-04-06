import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Mail, Phone, MapPin, Globe, ShieldCheck, Calendar, Users, Package } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const CompanyProfile = () => {
    const { user } = useAuth();
    const [organizationData, setOrganizationData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrganizationDetails();
    }, [user]);

    const fetchOrganizationDetails = async () => {
        try {
            const effectiveOrgId = user?.orgId || user?.orgid;
            const token = localStorage.getItem('knoweb_token');
            if (effectiveOrgId && token) {
                const response = await axios.get(`${API_BASE_URL}/api/organizations/${effectiveOrgId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setOrganizationData(response.data);
            }
        } catch (error) {
            console.error('Error fetching organization details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const profileData = organizationData || {
        name: user?.orgName || 'Organization',
        email: user?.email,
        industryType: user?.industryType,
        logoUrl: user?.companyLogo
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700">
            {/* Optimized Premium Header Section */}
            <div className="relative overflow-hidden bg-slate-950 rounded-[2rem] p-6 md:p-8 shadow-2xl border border-white/5 group">
                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-600/15 rounded-full blur-[100px] group-hover:bg-indigo-600/25 transition-colors duration-700" />
                <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-600/5 rounded-full blur-[60px]" />
                
                <div className="relative flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-10">
                    {/* Iconic Company Logo (Smaller) */}
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-[1.5rem] bg-slate-900 flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden">
                            {profileData.logoUrl ? (
                                <img 
                                    src={`${API_BASE_URL}${profileData.logoUrl}`}
                                    alt="Company Logo" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Building2 className="w-10 h-10 text-indigo-400 mb-1" />
                                    <span className="text-[8px] font-black text-indigo-500/50 tracking-tighter uppercase">EST. 2026</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Compact Elite Company Info */}
                    <div className="flex-1 text-center md:text-left space-y-3">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-sm">
                                {profileData.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-3">
                                <span className="px-4 py-1.5 bg-indigo-500/10 backdrop-blur-md text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 shadow-lg">
                                    {profileData.industryType || 'STANDARD'} SYSTEM
                                </span>
                                {(profileData.isActive !== false) && (
                                    <span className="px-4 py-1.5 bg-emerald-500/10 backdrop-blur-md text-emerald-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-lg flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                                        ACTIVE
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Information Architecture Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                {/* Refined Contact Card */}
                <div className="group bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 hover:border-indigo-500/20 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <Mail className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Contact Channels</h2>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex items-center gap-5 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Corporate Email</p>
                                <p className="text-base font-bold text-slate-900">{profileData.email || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Support Phone</p>
                                <p className="text-base font-bold text-slate-900">{profileData.contactPhone || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registered Address</p>
                                <p className="text-base font-bold text-slate-900 leading-relaxed">{profileData.registeredAddress || 'No Address Provided'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legacy & Legal Details */}
                <div className="group bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 hover:border-indigo-500/20 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <ShieldCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Entity Details</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Industry Type</p>
                            <p className="text-lg font-black text-slate-800">{profileData.industryType || 'GENERAL'}</p>
                        </div>

                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tax Identifier</p>
                            <p className="text-lg font-black text-slate-800">{profileData.taxId || 'UNREGISTERED'}</p>
                        </div>

                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Business Reg No</p>
                            <p className="text-lg font-black text-slate-800">{profileData.registrationNo || 'N/A'}</p>
                        </div>

                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Member Since</p>
                            <p className="text-lg font-black text-slate-800">
                                {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Session Analytics Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-white/5 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px]" />
                <div className="relative flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-white/10 rounded-2xl blur opacity-25"></div>
                            <div className="relative w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-white font-black text-2xl border border-white/10">
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Active Session Profile</h3>
                            <p className="text-slate-400 text-sm">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Identified As</p>
                            <p className="text-sm font-bold text-white">{user?.username || 'Authorized Official'}</p>
                        </div>
                        <div className="h-10 w-px bg-white/10 hidden sm:block" />
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-300">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyProfile;
