/**
 * Application configuration settings
 */

const env = process.env.REACT_APP_ENV || 'development';

const config = {
  // Environment
  env,
  isDev: env === 'development',
  isProd: env === 'production',
  
  // API URLs
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'https://crm.xcore.md/api',
    timeout: 30000 // 30 seconds
  },
  
  // Authentication
  auth: {
    tokenKey: 'token',
    userKey: 'user',
    rememberKey: 'remember_login'
  },
  
  // Data caching
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000 // 5 minutes
  },
  
  // Feature flags
  features: {
    darkMode: false,
    exportToPdf: true,
    exportToExcel: true,
    charts: true
  },
  
  // Default pagination
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50, 100]
  }
};

export default config;