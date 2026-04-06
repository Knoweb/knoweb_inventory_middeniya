import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Building2,
  Image as ImageIcon,
  ChevronDown,
  FileText,
  Mail,
  Phone,
  Smartphone,
  Globe,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  UploadCloud,
  X
} from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  
  // Extract system parameter from URL, default to 'GINUMA', convert to uppercase
  const selectedSystem = (searchParams.get('system') || 'GINUMA').toUpperCase();

  const [formData, setFormData] = useState({
    companyName: '',
    companyLogo: '',
    industryType: '',
    registrationNo: '',
    tinNo: '',
    isVatRegistered: false,
    vatNo: '',
    email: '',
    contactPhone: '',
    mobileNumber: '',
    website: '',
    registeredAddress: '',
    factoryAddress: '',
    country: '',
    currency: '',
    password: '',
    confirmPassword: '',
    firstName: 'Admin',
    lastName: 'User'
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo size should be less than 2MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVatChange = (isRegistered) => {
    setFormData({
      ...formData,
      isVatRegistered: isRegistered
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      let logoUrl = '';

      // Step 1: Upload Logo if selected
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        const uploadRes = await axios.post(`${API_BASE_URL}/api/organizations/logo/upload`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (uploadRes.data && uploadRes.data.url) {
          logoUrl = uploadRes.data.url;
        }
      }

      // Step 2: Call Unified Registration Orchestrator
      const { confirmPassword, ...registerData } = formData;
      const payload = {
        ...registerData,
        companyLogo: logoUrl,
        selectedSystem: selectedSystem  // Add selected system from URL parameter
      };

      // Call the new unified registration endpoint
      const response = await axios.post('http://localhost:8088/api/auth/register/unified', payload);

      // Check for successful registration
      if (response.data.success === true) {
        alert('Registration successful! Please login to continue.');
        navigate('/login');
      } else {
        setError(response.data.message || 'Registration failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('Registration/Upload error:', err);
      let errorMessage = 'Failed to complete registration. Check your connection.';

      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tighter text-blue-900">KNOWEB</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Company Registration</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className={labelClass}>Company Name *</label>
            <div className="relative">
              <Building2 className={iconClass} />
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Enter company name"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Company Logo</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
              >
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <div className="flex text-sm text-gray-600">
                    <span className="relative font-bold text-blue-600 hover:text-blue-500">
                      Choose File
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mt-2">MAX 2MB • PNG, JPG</p>
                </div>
              </div>
            ) : (
              <div className="relative mt-1 group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-contain bg-gray-50 border border-gray-200 rounded-xl"
                />
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Company Category *</label>
            <div className="relative">
              <Briefcase className={iconClass} />
              <select
                name="industryType"
                value={formData.industryType}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                <option value="GENERAL">General</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="RETAIL">Retail</option>
                <option value="MANUFACTURING">Manufacturing</option>
                <option value="ECOMMERCE">E-commerce</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Registration No.</label>
              <div className="relative">
                <FileText className={iconClass} />
                <input
                  type="text"
                  name="registrationNo"
                  value={formData.registrationNo}
                  onChange={handleChange}
                  placeholder="Enter registration no"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>TIN No.</label>
              <div className="relative">
                <FileText className={iconClass} />
                <input
                  type="text"
                  name="tinNo"
                  value={formData.tinNo}
                  onChange={handleChange}
                  placeholder="Enter TIN no"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 py-2">
            <span className="text-sm font-semibold text-gray-700">VAT Registered?</span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.isVatRegistered}
                  onChange={() => handleVatChange(true)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!formData.isVatRegistered}
                  onChange={() => handleVatChange(false)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">No</span>
              </label>
            </div>
          </div>

          {formData.isVatRegistered && (
            <div>
              <label className={labelClass}>VAT No. *</label>
              <div className="relative">
                <FileText className={iconClass} />
                <input
                  type="text"
                  name="vatNo"
                  value={formData.vatNo}
                  onChange={handleChange}
                  placeholder="Enter VAT no"
                  className={inputClass}
                  required
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email Address *</label>
              <div className="relative">
                <Mail className={iconClass} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className={inputClass}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Phone Number *</label>
              <div className="relative">
                <Phone className={iconClass} />
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Mobile Number</label>
              <div className="relative">
                <Smartphone className={iconClass} />
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Website</label>
              <div className="relative">
                <Globe className={iconClass} />
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Registered Address *</label>
              <div className="relative">
                <MapPin className={iconClass} />
                <input
                  type="text"
                  name="registeredAddress"
                  value={formData.registeredAddress}
                  onChange={handleChange}
                  placeholder="Enter registered address"
                  className={inputClass}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Factory Address</label>
              <div className="relative">
                <MapPin className={iconClass} />
                <input
                  type="text"
                  name="factoryAddress"
                  value={formData.factoryAddress}
                  onChange={handleChange}
                  placeholder="Enter factory address"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Country *</label>
              <div className="relative">
                <Globe className={iconClass} />
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Country</option>
                  <option value="Sri Lanka">Sri Lanka</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Currency *</label>
              <div className="relative">
                <ChevronDown className={iconClass} />
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Currency</option>
                  <option value="LKR">LKR - Sri Lankan Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Password *</label>
              <div className="relative">
                <Lock className={iconClass} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className={inputClass}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Confirm Password *</label>
              <div className="relative">
                <Lock className={iconClass} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className={inputClass}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
              }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating Account...
              </div>
            ) : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
