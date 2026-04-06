import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * GlobalLogout Component - SSO Logout Chain Handler
 * 
 * This component is part of the SSO (Single Sign-On) logout chain across micro-frontends.
 * 
 * When a user logs out from the Main Dashboard, it triggers a chain of redirects:
 * Main Dashboard (5173) → Inventory (5174) → Ginuma (5176) → Back to Login (5173)
 * 
 * This component:
 * 1. Clears all authentication data (localStorage, sessionStorage)
 * 2. Reads the `returnTo` URL parameter
 * 3. Redirects to the next app in the chain
 * 
 * Usage:
 * Add this route to your App.jsx as a PUBLIC route (BEFORE ProtectedRoute):
 * <Route path="/auth/logout" element={<GlobalLogout />} />
 */
const GlobalLogout = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const performLogout = () => {
      console.log('');
      console.log('🚪 [INVENTORY APP 5174] GlobalLogout triggered - Starting cleanup');
      console.log('');

      // Get the returnTo parameter from URL
      const returnTo = searchParams.get('returnTo');

      console.log('📋 [INVENTORY APP] returnTo parameter received:', returnTo);
      console.log('');

      // ⚠️ CRITICAL VERIFICATION: Check if returnTo contains correct Ginuma logout path
      if (returnTo && returnTo.includes('localhost:5176')) {
        console.log('🔍 [INVENTORY APP] Verifying Ginuma URL in returnTo...');

        if (returnTo.includes('/account/auth/logout')) {
          console.log('   ✅ CORRECT: Ginuma URL contains "/account/auth/logout"');
        } else if (returnTo.includes('/account/sso-login')) {
          console.error('');
          console.error('   ❌ ERROR: Ginuma URL contains "/account/sso-login" (WRONG!)');
          console.error('   Expected: /account/auth/logout');
          console.error('   Got:', returnTo);
          console.error('   This will cause Ginuma storage to NOT be cleared!');
          console.error('');
        } else {
          console.warn('   ⚠️ WARNING: Ginuma URL does not contain expected path');
          console.warn('   Expected: /account/auth/logout');
          console.warn('   Got:', returnTo);
        }
        console.log('');
      }

      console.log('🧹 [INVENTORY APP] Clearing BOTH localStorage and sessionStorage...');
      console.log('   📦 Executing localStorage.clear()...');

      // Clear ALL storage - works regardless of key names (token, user, sso_token, etc.)
      localStorage.clear();
      console.log('      ✅ localStorage cleared');

      console.log('   📦 Executing sessionStorage.clear()...');
      sessionStorage.clear();
      console.log('      ✅ sessionStorage cleared');

      console.log('');
      console.error('💥 [INVENTORY APP] !!! BOTH STORAGES NUKED !!!');
      console.log('✅ [INVENTORY APP] Storage cleared successfully (all keys removed from BOTH storages)');
      console.log('');

      const HOST = window.location.hostname;
      const PROTOCOL = window.location.protocol;
      const IS_LOCAL = HOST === 'localhost' || HOST === '127.0.0.1';
      const mainDashboardUrl = `${PROTOCOL}//${HOST}:${IS_LOCAL ? '5173' : '3000'}`;

      // Determine where to redirect next
      if (returnTo) {
        console.log(`🔗 [INVENTORY APP] Redirecting to next app in chain:`);
        console.log('   Target:', returnTo);
        console.log('   Waiting 150ms before redirect...');
        console.log('');

        // Small delay to ensure storage is fully cleared before redirect
        setTimeout(() => {
          console.log('🚀 [INVENTORY APP] REDIRECT NOW!');
          window.location.href = returnTo;
        }, 150);
      } else {
        // Fallback: If no returnTo parameter, redirect to Main Dashboard login
        console.warn('');
        console.warn('⚠️ [INVENTORY APP] No returnTo parameter found!');
        console.warn('   Redirecting to Main Dashboard login as fallback.');
        console.warn('');
        setTimeout(() => {
          window.location.href = `${mainDashboardUrl}/login`;
        }, 150);
      }
    };

    performLogout();
  }, [searchParams]);

  // Return a full-screen loading state (NOT inside any layout)
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      zIndex: 9999
    }}>
      {/* Spinner */}
      <div style={{
        width: '60px',
        height: '60px',
        border: '5px solid rgba(59, 130, 246, 0.2)',
        borderTop: '5px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: '24px'
      }}></div>

      {/* Title */}
      <h2 style={{
        fontSize: '24px',
        fontWeight: '600',
        marginBottom: '12px',
        color: '#f1f5f9'
      }}>
        Logging out...
      </h2>

      {/* Subtitle */}
      <p style={{
        fontSize: '14px',
        color: '#94a3b8',
        textAlign: 'center',
        maxWidth: '300px'
      }}>
        Clearing session data from Inventory App
      </p>

      {/* Keyframe animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GlobalLogout;
