import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import SsoReceiver from './components/Auth/SsoReceiver';
import GlobalLogout from './pages/GlobalLogout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import UnifiedProductRegistration from './pages/UnifiedProductRegistration';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Warehouses from './pages/Warehouses';
import Suppliers from './pages/Suppliers';
import Retail from './pages/Retail';
import Manufacturing from './pages/Manufacturing';
import IndustryConfig from './pages/IndustryConfig';
import Branches from './pages/Branches';
import Notifications from './pages/Notifications';
import Catalog from './pages/Catalog';
import CatalogSettings from './pages/CatalogSettings';
import Analytics from './pages/Analytics';
import StockLedgerValuation from './pages/StockLedgerValuation';
import CompanyProfile from './pages/CompanyProfile';
import Sidebar from './components/Sidebar';

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes - NO SIDEBAR, NO LAYOUT */}
        <Route path="/sso-login" element={<SsoReceiver />} />
        <Route path="/auth/logout" element={<GlobalLogout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes - WITH SIDEBAR AND LAYOUT */}
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="flex h-screen bg-gray-50 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/profile" element={<CompanyProfile />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/register" element={<UnifiedProductRegistration />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/warehouses" element={<Warehouses />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/retail" element={<Retail />} />
                  <Route path="/manufacturing" element={<Manufacturing />} />
                  <Route path="/industry-config" element={<IndustryConfig />} />
                  <Route path="/branches" element={<Branches />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/catalog/settings" element={<CatalogSettings />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/stock-ledger" element={<StockLedgerValuation />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
