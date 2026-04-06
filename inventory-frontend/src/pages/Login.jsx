import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Lock, User, Eye, EyeOff } from 'lucide-react';
import { getUserFromToken } from '../utils/jwtHelper';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔐 SSO Auto-Redirect: Check for existing token on component mount
  useEffect(() => {
    console.log('🔍 SSO Check: Inspecting for existing token...');

    // Step 1: Check if token is passed in URL (e.g., ?token=XYZ)
    const searchParams = new URLSearchParams(location.search);
    const urlToken = searchParams.get('token');

    if (urlToken) {
      console.log('✅ SSO Token found in URL:', urlToken.substring(0, 20) + '...');

      // CRITICAL: Use 'knoweb_token' to match AuthContext expectations
      localStorage.setItem('knoweb_token', urlToken);

      // ✅ DECODE JWT TOKEN to extract user data (instead of relying on URL params)
      const userData = getUserFromToken(urlToken);

      if (!userData) {
        console.error('❌ Failed to decode JWT token');
        setError('Invalid SSO token. Please try logging in again.');
        return;
      }

      console.log('✅ Decoded User Data from JWT:', userData);

      // CRITICAL: Use 'user' key to match AuthContext expectations
      localStorage.setItem('user', JSON.stringify(userData));

      if (userData.tenantId) {
        localStorage.setItem('tenantId', userData.tenantId);
      }

      console.log('🚀 Redirecting to dashboard (/)...');
      // Force page reload to reinitialize AuthContext
      window.location.href = '/';
      return;
    }

    // Step 2: Check if token already exists in localStorage
    // Check both possible token keys for backward compatibility
    const existingToken = localStorage.getItem('knoweb_token') || localStorage.getItem('token');

    if (existingToken && existingToken !== 'undefined' && existingToken !== 'null') {
      console.log('✅ Existing token found in localStorage');

      // Migrate old 'token' to 'knoweb_token' if needed
      if (!localStorage.getItem('knoweb_token') && localStorage.getItem('token')) {
        console.log('🔄 Migrating token key from "token" to "knoweb_token"');
        localStorage.setItem('knoweb_token', existingToken);
        localStorage.removeItem('token');

        // ✅ Decode JWT to get user data if user object doesn't exist
        if (!localStorage.getItem('user')) {
          console.log('🔍 No user object found - decoding JWT token...');
          const userData = getUserFromToken(existingToken);
          if (userData) {
            console.log('✅ User data extracted from JWT:', userData);
            localStorage.setItem('user', JSON.stringify(userData));
            if (userData.tenantId) {
              localStorage.setItem('tenantId', userData.tenantId);
            }
          }
        }
      }

      console.log('🚀 Auto-redirecting to dashboard (/)...');
      // Force page reload to reinitialize AuthContext
      window.location.href = '/';
      return;
    }

    console.log('ℹ️ No valid token found. Redirecting to Main Dashboard Login.');
    const HOST = window.location.hostname;
    const PROTOCOL = window.location.protocol;
    const IS_LOCAL = HOST === 'localhost' || HOST === '127.0.0.1';
    const mainDashboardUrl = `${PROTOCOL}//${HOST}:${IS_LOCAL ? '5173' : '3000'}`;
    window.location.href = `${mainDashboardUrl}/login`;
  }, [location, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    const result = await login(formData.username, formData.password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tighter text-blue-900">KNOWEB</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Company Login</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div>
            <label className={labelClass}>Username</label>
            <div className="relative">
              <User className={iconClass} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="dulaj prabashana"
                disabled={loading}
                className={inputClass}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <Lock className={iconClass} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={loading}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
