import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import config from '../config';

// Create the context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(config.auth.tokenKey));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const userData = await apiService.auth.getUser();
          setUser(userData);
        } catch (error) {
          console.error('Auth check failed:', error);
          // Token is invalid or expired
          handleLogout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Handle login
  const login = async (credentials) => {
    try {
      const response = await apiService.auth.login(credentials);
      const { token, name, email } = response;

      // Save token and user data
      localStorage.setItem(config.auth.tokenKey, token);
      localStorage.setItem(config.auth.userKey, JSON.stringify({ name, email }));
      
      setToken(token);
      setUser({ name, email });
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  // Handle logout
  const handleLogout = async () => {
    // Try to call logout endpoint, but continue even if it fails
    try {
      if (token) {
        await apiService.auth.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    // Clear localStorage and state
    localStorage.removeItem(config.auth.tokenKey);
    localStorage.removeItem(config.auth.userKey);
    setToken(null);
    setUser(null);
    
    // Redirect to login page
    navigate('/login');
  };

  // Handle unauthorized access (401 errors)
  const handleUnauthorized = () => {
    handleLogout();
  };

  const contextValue = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout: handleLogout,
    handleUnauthorized,
    loading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;