import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Box,
    Warehouse,
    ShoppingCart,
    Truck,
    Building2,
    Bell,
    BookOpen,
    LineChart,
    Settings,
    LogOut,
    ShoppingBag,
    Database,
    MonitorPlay,
    Activity,
    Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Debug: Log user object to see if companyLogo exists
    React.useEffect(() => {
        console.log('Sidebar - User object:', user);
        console.log('Sidebar - Company Logo:', user?.companyLogo);
        if (user?.companyLogo) {
            const fullLogoUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${user.companyLogo}`;
            console.log('Sidebar - Full Logo URL:', fullLogoUrl);
        }
    }, [user]);

    const handleLogout = () => {
        const HOST = window.location.hostname;
        const PROTOCOL = window.location.protocol;
        const IS_LOCAL = HOST === 'localhost' || HOST === '127.0.0.1';

        const URLS = {
            main: `${PROTOCOL}//${HOST}:${IS_LOCAL ? '5173' : '3000'}`,
            ginuma: `${PROTOCOL}//${HOST}:${IS_LOCAL ? '5176' : '3001'}`,
            inventory: `${PROTOCOL}//${HOST}:${IS_LOCAL ? '5174' : '3002'}`
        };

        // SSO Logout Chain: Current (Inventory) -> Ginuma -> Main Dashboard Login
        const ginumaLogoutUrl = `${URLS.ginuma}/account/auth/logout`;
        const finalReturnUrl = `${URLS.main}/login`;

        // The Inventory GlobalLogout component handles clearing storage
        // We just need to trigger it with the next step in the returnTo chain
        const inventoryLogoutUrl = `/auth/logout`;
        const returnTo = `${ginumaLogoutUrl}?returnTo=${encodeURIComponent(finalReturnUrl)}`;

        window.location.href = `${inventoryLogoutUrl}?returnTo=${encodeURIComponent(returnTo)}`;
    };

    const getIndustryMenuItems = () => {
        if (!user?.industryType) return [];
        const industryType = user.industryType.toUpperCase();
        switch (industryType) {
            case 'RETAIL':
                return [{ path: '/retail', icon: ShoppingBag, label: 'Retail Ops' }];
            default:
                return [];
        }
    };

    const industryMenuItems = getIndustryMenuItems();

    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 relative group ${isActive
            ? 'bg-indigo-600 text-white shadow-[0_8px_30px_rgb(79,70,229,0.3)] scale-[1.02]'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 hover:translate-x-1'
        }`;

    const iconClass = "w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300";

    return (
        <aside className="bg-slate-950 border-r border-slate-900 h-screen flex flex-col w-72 overflow-y-auto sticky top-0 custom-scrollbar shadow-2xl">
            <div className="px-8 py-8 mb-2 relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

                {/* Company Logo */}
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-[0_8px_30px_rgb(79,70,229,0.4)] border border-indigo-500/20 overflow-hidden">
                        {user?.companyLogo ? (
                            <img
                                src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${user.companyLogo}`}
                                alt="Company Logo"
                                className="w-full h-full object-cover"
                                onLoad={() => {
                                    console.log('✅ Logo loaded successfully!');
                                }}
                                onError={(e) => {
                                    console.error('❌ Failed to load logo from:', e.target.src);
                                    console.error('Check if this URL is accessible:', e.target.src);
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = `
                                        <svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    `;
                                }}
                            />
                        ) : (
                            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase flex flex-col gap-1">
                        KNOWEB <span className="text-indigo-500 text-[10px] font-black tracking-[0.5em] px-1 py-0.5 rounded border border-indigo-500/20 bg-indigo-500/5 w-fit">INVENTORY</span>
                    </h2>
                </div>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-x-hidden">
                <NavLink to="/" className={navLinkClass}>
                    <LayoutDashboard className={iconClass} />
                    <span>Control Panel</span>
                    <div className="absolute right-4 w-1 h-1 rounded-full bg-indigo-400 opacity-0 group-[.active]:opacity-100 shadow-[0_0_8px_rgb(129,140,248)]" />
                </NavLink>

                <NavLink to="/products" className={navLinkClass}>
                    <MonitorPlay className={iconClass} />
                    <span>Unit Management</span>
                </NavLink>



                <NavLink to="/inventory" className={navLinkClass}>
                    <Database className={iconClass} />
                    <span>Live Stock</span>
                    <span className="absolute right-4 text-[8px] font-black bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE</span>
                </NavLink>

                <NavLink to="/orders" className={navLinkClass}>
                    <ShoppingCart className={iconClass} />
                    <span>Order Ledger</span>
                </NavLink>

                <NavLink to="/warehouses" className={navLinkClass}>
                    <Warehouse className={iconClass} />
                    <span>Warehouses</span>
                </NavLink>

                <NavLink to="/suppliers" className={navLinkClass}>
                    <Truck className={iconClass} />
                    <span>Supply Chain</span>
                </NavLink>


                {industryMenuItems.length > 0 && (
                    <div className="mt-12">
                        <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.45em] px-6 mb-5 flex items-center gap-3">
                            <span className="w-4 h-[1px] bg-slate-800" /> VERTICALS
                        </h3>
                        {industryMenuItems.map((item, idx) => (
                            <NavLink key={idx} to={item.path} className={navLinkClass}>
                                <item.icon className={iconClass} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </div>
                )}

                <div className="mt-12">
                    <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.45em] px-6 mb-5 flex items-center gap-3">
                        <span className="w-4 h-[1px] bg-slate-800" /> SYSTEM ARCH
                    </h3>

                    <NavLink to="/branches" className={navLinkClass}>
                        <Building2 className={iconClass} />
                        <span>Branchers</span>
                    </NavLink>

                    <NavLink to="/catalog/settings" className={navLinkClass}>
                        <Layers className={iconClass} />
                        <span>Catalog</span>
                    </NavLink>

                    <NavLink to="/notifications" className={navLinkClass}>
                        <Bell className={iconClass} />
                        <span>Notifications</span>
                        <span className="absolute right-4 w-2 h-2 rounded-full bg-rose-500 border-2 border-slate-950 shadow-[0_0_10px_rgb(244,63,94)] animate-pulse" />
                    </NavLink>

                    <NavLink to="/analytics" className={navLinkClass}>
                        <Activity className={iconClass} />
                        <span>Analytics</span>
                    </NavLink>

                    <NavLink to="/stock-ledger" className={navLinkClass}>
                        <BookOpen className={iconClass} />
                        <span>Audit Vault</span>
                    </NavLink>

                </div>
            </nav>

            <div className="p-4 mt-auto border-t border-slate-900 group">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 w-full px-6 py-5 text-slate-500 font-black text-[10px] uppercase tracking-[0.35em] rounded-2xl hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300 group"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
                    <span>Disconnect</span>
                </button>
                <button
                    onClick={() => navigate('/profile')}
                    className="w-full px-6 pb-4 pt-2 hover:transform hover:scale-[1.02] transition-all duration-200"
                >
                    <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800 shadow-inner hover:border-indigo-500/30 hover:bg-slate-900/70 cursor-pointer transition-all duration-300">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xs border border-indigo-500/20">
                            {user?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-white text-[11px] font-black truncate tracking-wide leading-none">{user?.orgName || 'Independent Node'}</span>
                            <div className="flex flex-col mt-0.5">
                                <span className="text-slate-500 text-[8px] font-bold truncate tracking-tight">{user?.email || user?.username}</span>
                                <span className="text-indigo-400 text-[8px] font-black uppercase tracking-[0.2em] mt-0.5">{user?.industryType || 'Standard'} SYSTEM</span>
                            </div>
                        </div>
                    </div>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
