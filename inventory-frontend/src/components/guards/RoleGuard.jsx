import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RoleGuard = ({ allowedRoles }) => {
  const { user } = useAuth();
  
  // If user is not present at all, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Ensure user has at least one matching role, or is an ADMIN
  // Note: user.roles might be an array or string depending on your JWT, 
  // usually it's an array of strings in Spring Boot.
  const userRoles = Array.isArray(user.roles) ? user.roles : (user.roles ? [user.roles] : []);
  
  const hasAccess = userRoles.some(role => 
    allowedRoles.includes(role) || role === 'ROLE_ADMIN' || role === 'ROLE_ORG_ADMIN'
  );

  if (!hasAccess) {
    // If they don't have access, block them and show a "Not Authorized" message or redirect
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 max-w-lg text-center shadow-sm">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="mb-4">You do not have the required permissions ({allowedRoles.join(' or ')}) to view this dashboard.</p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // If authorized, let them access the child routes
  return <Outlet />;
};

export default RoleGuard;