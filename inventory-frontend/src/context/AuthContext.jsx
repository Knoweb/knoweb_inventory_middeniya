import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { authService } from '../services/api';
import { getUserFromToken } from '../utils/jwtHelper';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('knoweb_token'));

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      const storedToken = localStorage.getItem('knoweb_token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken) {
        try {
          let userData = null;
          
          // Try to parse stored user object first
          if (storedUser) {
            try {
              userData = JSON.parse(storedUser);
              console.log('📦 Loaded user from localStorage:', userData);
            } catch (e) {
              console.warn('Failed to parse stored user:', e);
            }
          }
          
          // ✅ DECODE JWT TOKEN if user is missing OR has null critical fields
          // Check case-insensitively for fields from localStorage
          const hasCriticalInfo = userData && 
            userData.id && 
            (userData.tenantId || userData.tenantid) && 
            (userData.industryType || userData.industrytype);

          if (!hasCriticalInfo) {
            console.log('🔍 User data incomplete or missing - decoding JWT token...');
            const decodedUser = getUserFromToken(storedToken);
            
            if (decodedUser) {
              console.log('✅ User data extracted from JWT:', decodedUser);
              // Merge with existing data (prefer decoded data for critical fields)
              userData = {
                ...userData,
                ...decodedUser,
                // Keep orgName from existing if available and decoded doesn't have it
                orgName: decodedUser.orgName || userData?.orgName || null
              };
              
              // Save the updated user object
              localStorage.setItem('user', JSON.stringify(userData));
              
              if (userData.tenantId) {
                localStorage.setItem('tenantId', userData.tenantId);
              }
            } else {
              console.error('❌ Failed to decode JWT token');
            }
          }

          // Patch for missing orgName in existing sessions (optional fallback)
          const effectiveOrgId = userData?.orgId || userData?.orgid;
          if (userData && effectiveOrgId && !userData.orgName) {
            try {
              const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
              const orgRes = await axios.get(`${API_BASE_URL}/api/organizations/${effectiveOrgId}`, {
                headers: { Authorization: `Bearer ${storedToken}` }
              });
              if (orgRes.data && orgRes.data.name) {
                userData.orgName = orgRes.data.name;
                localStorage.setItem('user', JSON.stringify(userData));
              }
            } catch (err) {
              console.warn('Failed to auto-patch orgName:', err);
              // IF we get a 401 here, clearly the token is invalid/expired
              if (err.response?.status === 401) {
                console.error('🔓 Token unauthorized during initialization. Resetting session.');
                logout();
                return;
              }
            }
          }

          if (userData) {
            setUser(userData);
            setToken(storedToken);
          }
        } catch (error) {
          console.error('Failed during auth initialization:', error);
          // Don't clear token if there's an error - let user try to use it
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login({ username, password });
      console.log('Login Response:', response.data);
      const { token: newToken, refreshToken, userId, username: userName, email, orgId, tenantId, orgName, branchId, industryType, roles, companyLogo } = response.data;

      // Construct user object with all relevant fields including tenantId
      const userData = {
        id: userId,
        username: userName,
        email,
        orgId,
        tenantId,
        orgName,
        branchId,
        industryType,
        roles,
        companyLogo
      };
      
      console.log('User Data to be saved:', userData);

      localStorage.setItem('knoweb_token', newToken);
      localStorage.setItem('tenantId', tenantId);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      console.log('Register Response:', response.data);
      const { token: newToken, refreshToken, userId, username: userName, email, orgId, tenantId, orgName, branchId, industryType, roles, companyLogo } = response.data;

      // Construct user object with all relevant fields including tenantId
      const newUser = {
        id: userId,
        username: userName,
        email,
        orgId,
        tenantId,
        orgName,
        branchId,
        industryType,
        roles,
        companyLogo
      };
      
      console.log('New User Data to be saved:', newUser);

      localStorage.setItem('knoweb_token', newToken);
      localStorage.setItem('tenantId', tenantId);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('knoweb_token');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);

    // Optional: Call backend logout endpoint
    try {
      authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
