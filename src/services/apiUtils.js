/**
 * API Utilities for consistent API access across components
 */
import config from '../config';

/**
 * Generate complete API URL from endpoint
 * @param {string} endpoint - API endpoint without base URL
 * @returns {string} Complete API URL
 */
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${config.api.baseUrl}/${cleanEndpoint}`;
};

/**
 * Get authorization headers with token
 * @returns {Object} Headers object with Authorization if token exists
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem(config.auth.tokenKey);
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Helper function to fetch all pages of paginated API data
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Array>} Combined results from all pages
 */
export const fetchAllPages = async (endpoint, options = {}) => {
  let allData = [];
  let currentPage = 1;
  let lastPage = 1;
  
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };
  
  try {
    while (currentPage <= lastPage) {
      const separator = endpoint.includes('?') ? '&' : '?';
      const url = getApiUrl(`${endpoint}${separator}page=${currentPage}`);
      
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${endpoint} (Page ${currentPage})`);
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        allData = [...allData, ...data.data];
        
        if (data.meta && data.meta.last_page) {
          lastPage = data.meta.last_page;
        } else if (data.last_page) {
          lastPage = data.last_page;
        }
        
        currentPage++;
      } else {
        // If response is not paginated, return the data directly
        return Array.isArray(data) ? data : [data];
      }
    }
    
    return allData;
  } catch (error) {
    console.error('Error fetching paginated data:', error);
    throw error;
  }
};