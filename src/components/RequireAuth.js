import React from 'react';
import { Navigate } from 'react-router-dom';
import config from '../config';

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem(config.auth.tokenKey);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RequireAuth;