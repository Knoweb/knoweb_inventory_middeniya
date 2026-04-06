/**
 * JWT Token Helper Utilities
 * Decodes JWT tokens without requiring external libraries
 */

/**
 * Decode JWT token and return payload
 * @param {string} token - JWT token string
 * @returns {Object|null} Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      console.warn('Invalid token provided to decodeJWT');
      return null;
    }

    // JWT has 3 parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format - expected 3 parts');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Replace URL-safe characters and add padding if needed
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    // Decode base64
    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Extract user data from decoded JWT token
 * Maps backend JWT claims to frontend user object format
 * @param {string} token - JWT token string
 * @returns {Object|null} User data object or null if invalid
 */
export const getUserFromToken = (token) => {
  const decoded = decodeJWT(token);
  
  if (!decoded) {
    console.error('Failed to decode JWT token');
    return null;
  }

  console.log('🔍 Decoded JWT Claims:', decoded);

  // Map JWT claims to user object
  // Backend uses: userId, tenantId, industryType, orgId, branchId, roles, etc.
  const userData = {
    id: decoded.userId || decoded.id || null,
    username: decoded.sub || decoded.username || decoded.email || null,
    email: decoded.email || decoded.sub || null,
    orgId: decoded.orgId || null,
    tenantId: decoded.tenantId || null,
    orgName: decoded.orgName || null,
    branchId: decoded.branchId || null,
    industryType: decoded.industryType || null,
    roles: decoded.roles || decoded.authorities || ['USER'],
    companyLogo: decoded.companyLogo || null
  };

  console.log('✅ Extracted User Data from JWT:', userData);

  return userData;
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token string
 * @returns {boolean} True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  const decoded = decodeJWT(token);
  
  if (!decoded || !decoded.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();

  return currentTime >= expirationTime;
};

/**
 * Get token expiration date
 * @param {string} token - JWT token string
 * @returns {Date|null} Expiration date or null if invalid
 */
export const getTokenExpiration = (token) => {
  const decoded = decodeJWT(token);
  
  if (!decoded || !decoded.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
};
