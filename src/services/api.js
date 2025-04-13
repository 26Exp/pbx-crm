// API Service for centralizing all API calls
import config from '../config';

// Get the API base URL from config
const API_URL = config.api.baseUrl;

/**
 * Get auth token from localStorage
 * @returns {string|null} The auth token or null if not logged in
 */
const getAuthToken = () => {
  return localStorage.getItem(config.auth.tokenKey);
};

/**
 * Helper function to handle common fetch options
 * @param {Object} options - Additional fetch options
 * @returns {Object} Fetch options with auth headers
 */
const getFetchOptions = (options = {}) => {
  const token = getAuthToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  };
  
  return {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };
};

/**
 * Fetch all pages from a paginated API
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} Combined results from all pages
 */
const fetchAllPages = async (endpoint, options = {}) => {
  let allResults = [];
  let page = 1;
  let hasMorePages = true;
  
  while (hasMorePages) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${endpoint}${separator}page=${page}`;
    
    const response = await fetch(`${API_URL}/${url}`, getFetchOptions(options));
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch data');
    }
    
    const data = await response.json();
    
    if (Array.isArray(data.data)) {
      allResults = [...allResults, ...data.data];
      
      // Check if we have more pages
      if (data.meta && data.meta.last_page && page < data.meta.last_page) {
        page++;
      } else {
        hasMorePages = false;
      }
    } else {
      // If response is not paginated
      allResults = [...allResults, ...(Array.isArray(data) ? data : [data])];
      hasMorePages = false;
    }
  }
  
  return allResults;
};

/**
 * Generic GET request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
const get = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}/${endpoint}`, getFetchOptions({
    method: 'GET',
    ...options
  }));
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `Failed to fetch data from ${endpoint}`);
  }
  
  return response.json();
};

/**
 * Generic POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Data to send
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
const post = async (endpoint, data, options = {}) => {
  const response = await fetch(`${API_URL}/${endpoint}`, getFetchOptions({
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  }));
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `Failed to post data to ${endpoint}`);
  }
  
  return response.json();
};

/**
 * Generic PATCH request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Data to send
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
const patch = async (endpoint, data, options = {}) => {
  const response = await fetch(`${API_URL}/${endpoint}`, getFetchOptions({
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options
  }));
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `Failed to update data at ${endpoint}`);
  }
  
  return response.json();
};

/**
 * Generic DELETE request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
const remove = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}/${endpoint}`, getFetchOptions({
    method: 'DELETE',
    ...options
  }));
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `Failed to delete data at ${endpoint}`);
  }
  
  return response.json();
};

/**
 * Auth API endpoints
 */
const auth = {
  login: (credentials) => post('auth/login', credentials),
  logout: () => post('auth/logout'),
  getUser: () => get('auth/user')
};

/**
 * Documents API endpoints
 */
const documents = {
  getAll: (params = '') => fetchAllPages(`documents${params}`),
  getById: (id) => get(`documents/${id}`),
  create: (data) => post('documents', data),
  update: (id, data) => patch(`documents/${id}`, data),
  delete: (id) => remove(`documents/${id}`)
};

/**
 * Reference data API endpoints
 */
const refData = {
  getCities: () => get('cities'),
  getDomains: () => get('domains'),
  getBusinesses: () => get('business'),
  getProducts: () => get('products'),
  getServices: () => get('services')
};

/**
 * Export all API services
 */
const apiService = {
  get,
  post,
  patch,
  delete: remove,
  fetchAllPages,
  auth,
  documents,
  refData
};

export default apiService;