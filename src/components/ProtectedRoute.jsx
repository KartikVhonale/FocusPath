import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user, accountMode } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center px-4">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mb-3"></div>
        <p className="text-slate-400 text-xs tracking-wide font-medium">Securing session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and preserve destination location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || (accountMode === 'teacher' ? 'teacher' : 'student');
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/focus" replace />;
    }
  }

  return children;
}

