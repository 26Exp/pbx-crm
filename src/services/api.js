// API Service for centralizing all API calls
import config from '../config';

// This will be set from outside when the auth context is initialized
let unauthorizedCallback = null;

// Function to set the unauthorized callback
export const setUnauthorizedCallback = (callback) => {
  unauthorizedCallback = callback;
};

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
  // For the first request, just get the data without pagination
  // API might not support pagination or have a different structure
  const response = await fetch(`${API_URL}/${endpoint}`, getFetchOptions(options));
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `Server error (${response.status})` }));
    throw new Error(error.message || 'Failed to fetch data');
  }
  
  const responseData = await response.json();
  
  // Check if the response is already an array
  if (Array.isArray(responseData)) {
    return responseData;
  }
  
  // Check if the response has a data property that is an array
  if (responseData.data && Array.isArray(responseData.data)) {
    // If there's pagination data, handle it
    if (responseData.meta && responseData.meta.last_page && responseData.meta.last_page > 1) {
      let allResults = [...responseData.data];
      let currentPage = 2; // Start from page 2 since we already have page 1
      
      while (currentPage <= responseData.meta.last_page) {
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${endpoint}${separator}page=${currentPage}`;
        
        const pageResponse = await fetch(`${API_URL}/${url}`, getFetchOptions(options));
        
        if (!pageResponse.ok) {
          break; // Stop if we encounter an error
        }
        
        const pageData = await pageResponse.json();
        
        if (pageData.data && Array.isArray(pageData.data)) {
          allResults = [...allResults, ...pageData.data];
        }
        
        currentPage++;
      }
      
      return allResults;
    }
    
    // If there's no pagination or just one page, return the data
    return responseData.data;
  }
  
  // If we can't determine the structure, return the full response
  return responseData;
};

/**
 * Handle error responses
 * @param {Response} response - Fetch response object
 * @param {string} endpoint - API endpoint for error message
 * @returns {Promise<Object>} Error object with message
 */
const handleErrorResponse = async (response, endpoint) => {
  // Handle 401 Unauthorized errors by triggering the callback
  if (response.status === 401 && unauthorizedCallback) {
    unauthorizedCallback();
  }
  
  // Try to get error details from response
  const error = await response.json().catch(() => ({ 
    message: `Server error (${response.status})` 
  }));
  
  throw new Error(error.message || `Failed to fetch data from ${endpoint}`);
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
    return handleErrorResponse(response, endpoint);
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
    return handleErrorResponse(response, endpoint);
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
    return handleErrorResponse(response, endpoint);
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
    return handleErrorResponse(response, endpoint);
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
  getAll: async (params = '') => {
    const response = await fetchAllPages(`documents${params}`);
    // Handle both array responses and responses with a data property
    return Array.isArray(response) ? response : (response.data || []);
  },
  getById: async (id) => {
    const response = await get(`documents/${id}`);
    return response.data || response;
  },
  create: (data) => post('documents', data),
  update: (id, data) => patch(`documents/${id}`, data),
  delete: (id) => remove(`documents/${id}`)
};

/**
 * Products API endpoints
 */
const products = {
  getAll: async (params = '') => {
    const response = await fetchAllPages(`products${params}`);
    return Array.isArray(response) ? response : (response.data || []);
  },
  getById: async (id) => {
    const response = await get(`products/${id}`);
    return response.data || response;
  },
  create: (data) => post('products', data),
  update: (id, data) => patch(`products/${id}`, data),
  delete: (id) => remove(`products/${id}`)
};

/**
 * Domains API endpoints
 */
const domains = {
  getAll: async (params = '') => {
    const response = await fetchAllPages(`domains${params}`);
    return Array.isArray(response) ? response : (response.data || []);
  },
  getById: async (id) => {
    const response = await get(`domains/${id}`);
    return response.data || response;
  },
  create: (data) => post('domains', data),
  update: (id, data) => patch(`domains/${id}`, data),
  delete: (id) => remove(`domains/${id}`)
};

/**
 * Services API endpoints
 */
const services = {
  getAll: async (params = '') => {
    const response = await fetchAllPages(`services${params}`);
    return Array.isArray(response) ? response : (response.data || []);
  },
  getById: async (id) => {
    const response = await get(`services/${id}`);
    return response.data || response;
  },
  create: (data) => post('services', data),
  update: (id, data) => patch(`services/${id}`, data),
  delete: (id) => remove(`services/${id}`)
};

/**
 * Business API endpoints
 */
const business = {
  getAll: async (params = '') => {
    const response = await fetchAllPages(`business${params}`);
    return Array.isArray(response) ? response : (response.data || []);
  },
  getById: async (id) => {
    const response = await get(`business/${id}`);
    return response.data || response;
  },
  create: (data) => post('business', data),
  update: (id, data) => patch(`business/${id}`, data),
  delete: (id) => remove(`business/${id}`)
};

/**
 * Reference data API endpoints
 */
const refData = {
  getCities: async () => {
    const response = await get('cities');
    // Handle both array responses and responses with a data property
    return Array.isArray(response) ? response : (response.data || []);
  },
  getDomains: async () => {
    const response = await get('domains');
    return Array.isArray(response) ? response : (response.data || []);
  },
  getBusinesses: async () => {
    const response = await get('business');
    return Array.isArray(response) ? response : (response.data || []);
  },
  getProducts: async () => {
    const response = await get('products');
    return Array.isArray(response) ? response : (response.data || []);
  },
  getServices: async () => {
    const response = await get('services');
    return Array.isArray(response) ? response : (response.data || []);
  },
  getCategories: async () => {
    const response = await get('categories');
    return Array.isArray(response) ? response : (response.data || []);
  }
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
  products,
  domains,
  services,
  business,
  refData
};

export default apiService;