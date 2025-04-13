import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Handle loading state while auth check is in progress
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen p-4">Încărcare...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Redirect to login and remember the page the user was trying to access
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default RequireAuth;