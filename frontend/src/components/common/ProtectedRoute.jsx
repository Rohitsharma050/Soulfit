import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4 bg-sand">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-forest/15 border-t-forest animate-spin" />
          <div className="w-2.5 h-2.5 bg-forest rounded-full animate-pulse" />
        </div>
        <p className="mt-6 text-sm font-serif italic text-forest/70">
          Entering sanctuary space...
        </p>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page while preserving intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
