// DocumentTable.jsx

import React, { useState, useEffect, useRef } from 'react';
import EditDocumentModal from './EditDocumentModal';
import Pagination from './Pagination';
import * as XLSX from 'xlsx';
import { getApiUrl, getAuthHeaders, fetchAllPages } from '../services/apiUtils';
import config from '../config';
import apiService from '../services/api';



// We're now using the fetchAllPages utility from apiUtils.js

const DocumentTable = () => {
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  // Track if a fetch request is in progress to prevent duplicate requests
  const fetchInProgress = useRef(false);
  
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filtering state
  const [statusFilter, setStatusFilter] = useState('');

  // Lookup maps
  const [citiesMap, setCitiesMap] = useState({});
  const [domainsMap, setDomainsMap] = useState({});
  const [businessesMap, setBusinessesMap] = useState({});
  const [servicesMap, setServicesMap] = useState({});

  // State for editing document
  const [editingDocument, setEditingDocument] = useState(null);

  // State for sorting
  const [sortConfig, setSortConfig] = useState({ key: 'dataApel', direction: 'descending' });

  // Fetch documents and related entities from API
  const fetchData = async (page = 1, status = null, itemsPerPage = null) => {
    // Prevent duplicate requests
    if (fetchInProgress.current) {
      return;
    }
    
    // Set flag to indicate fetch is in progress
    fetchInProgress.current = true;
    
    // Only update loading state if component is still mounted
    if (isMounted.current) {
      setLoading(true);
      setErrors([]);
    }
    
    // Use the provided parameters or fall back to state values
    const currentStatus = status !== null ? status : statusFilter;
    const currentPerPage = itemsPerPage !== null ? itemsPerPage : perPage;

    // Check if user is authenticated
    const token = localStorage.getItem(config.auth.tokenKey);

    if (!token) {
      if (isMounted.current) {
        setErrors(['Tokenul de autentificare nu a fost găsit. Vă rugăm să vă autentificați din nou.']);
        setLoading(false);
      }
      fetchInProgress.current = false;
      return;
    }

    try {
      // Fetch all related entities concurrently using our API service
      const [
        citiesData,
        domainsData,
        businessesData,
        servicesData,
      ] = await Promise.all([
        apiService.refData.getCities(),
        apiService.refData.getDomains(), 
        apiService.refData.getBusinesses(),
        apiService.refData.getServices(),
      ]);

      // Create lookup maps
      const citiesLookup = {};
      citiesData.forEach((city) => {
        citiesLookup[city.id] = city.name;
      });
      setCitiesMap(citiesLookup);

      const domainsLookup = {};
      domainsData.forEach((domain) => {
        domainsLookup[domain.id] = domain.name;
      });
      setDomainsMap(domainsLookup);

      const businessesLookup = {};
      businessesData.forEach((business) => {
        businessesLookup[business.id] = business.name;
      });
      setBusinessesMap(businessesLookup);

      const servicesLookup = {};
      servicesData.forEach((service) => {
        servicesLookup[service.id] = service.name;
      });
      setServicesMap(servicesLookup);

      // Now fetch documents with pagination and filtering
      let queryParams = `?page=${page}&per_page=${currentPerPage}`;
      
      // Add status filter if selected
      if (currentStatus) {
        queryParams += `&status=${currentStatus}`;
      }
      
      console.log(`Fetching documents with params: ${queryParams}`);
      
      const response = await fetch(getApiUrl(`documents${queryParams}`), {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // Extract pagination metadata
      if (responseData.meta) {
        setCurrentPage(responseData.meta.current_page);
        setTotalPages(responseData.meta.last_page);
        setTotalItems(responseData.meta.total);
        setPerPage(responseData.meta.per_page);
      }

      const documentsData = responseData.data || [];

      // Map documents to include names instead of IDs (except institution_id)
      const mappedDocuments = documentsData.map((doc) => ({
        nr: doc.id,
        statut: doc.status,
        numePrenume: doc.name || 'N/A',
        operator: doc.user?.name || 'N/A', // Add user name from the user property
        continutConsultatie: domainsLookup[doc.domain_id] || `ID: ${doc.domain_id}`,
        localitate: citiesLookup[doc.city_id] || `ID: ${doc.city_id}`,
        detalii: doc.details,
        domain_id: doc.domain_id,
        city_id: doc.city_id,
        service_id: doc.service_id,
        product_id: doc.product_id,
        created_at: doc.created_at,
        call_id: doc.call_id,
      }));

      // Only update state if component is still mounted
      if (isMounted.current) {
        setDocuments(mappedDocuments);
        setFilteredDocuments(mappedDocuments);
      }
    } catch (error) {
      console.error(error);
      if (isMounted.current) {
        setErrors([error.message || 'Eroare la încărcarea datelor. Vă rugăm să încercați din nou.']);
      }
    } finally {
      // Reset fetch flag
      fetchInProgress.current = false;
      
      // Only update loading state if component is still mounted
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Set up and clean up refs
  useEffect(() => {
    // Set mounted flag to true
    isMounted.current = true;
    
    // Fetch initial data
    fetchData(1);
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted.current = false;
    };
  }, []);
  const exportToExcel = async () => {
    try {
      // Show loading
      setLoading(true);
      
      // Build query params for export (all pages, but keep status filter)
      let queryParams = `?per_page=1000`; // Get a large number of records
      
      // Add status filter if selected
      // Use the current status filter to be consistent
      if (statusFilter) {
        queryParams += `&status=${statusFilter}`;
      }
      
      console.log(`Exporting documents with params: ${queryParams}`);
      
      // Fetch all data for export
      const response = await fetch(getApiUrl(`documents${queryParams}`), {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to export data: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      const documentsData = responseData.data || [];
      
      // Map documents for export
      const exportData = documentsData.map(doc => ({
        'ID': doc.id,
        'Statut': doc.status,
        'Nume & Prenume': doc.name || 'N/A',
        'Operator': doc.user?.name || 'N/A',
        'Domeniul Consultație': domainsMap[doc.domain_id] || `ID: ${doc.domain_id}`,
        'Localitatea': citiesMap[doc.city_id] || `ID: ${doc.city_id}`,
        'Detalii': doc.details,
        'Data Creării': doc.created_at ? new Date(doc.created_at).toLocaleDateString('ro-RO') : 'N/A'
      }));
      
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Documente');
      
      // Generate and trigger download
      XLSX.writeFile(workbook, 'documente.xlsx');
    } catch (error) {
      console.error('Export error:', error);
      setErrors([`Eroare la exportul datelor: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };
  
  // Sort documents only
  useEffect(() => {
    let filtered = [...documents];

    // Implement sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle different data types
        if (sortConfig.key === 'dataApel') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        } else if (sortConfig.key === 'persFizica' || sortConfig.key === 'persJuridica') {
          aValue = aValue ? 1 : 0;
          bValue = bValue ? 1 : 0;
        } else if (sortConfig.key === 'statut') {
          const statusOrder = ['Inchis', 'Respins', 'Rezolvat'];
          aValue = statusOrder.indexOf(aValue);
          bValue = statusOrder.indexOf(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredDocuments(filtered);
    setSelectedDocuments([]);
    setSelectAll(false);
  }, [documents, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Helper function to fetch data with explicit parameters
  const fetchDataWithParams = (page = 1, status = null, itemsPerPage = null) => {
    const currentStatus = status !== null ? status : statusFilter;
    const currentPerPage = itemsPerPage !== null ? itemsPerPage : perPage;
    
    console.log(`Fetching with explicit params: page=${page}, status=${currentStatus}, per_page=${currentPerPage}`);
    
    // Call fetchData with the current parameters
    fetchData(page, currentStatus, currentPerPage);
  };
  
  // Handle pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // Pass the current status filter to preserve filtering during pagination
    fetchDataWithParams(page, statusFilter, perPage);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    console.log(`Changing status filter to: ${status}`);
    
    // Always set the status, even if it's the same
    // This ensures the UI stays in sync
    setStatusFilter(status);
    
    // Reset to first page when filter changes
    setCurrentPage(1);
    
    // Use setTimeout to ensure state updates before fetching
    setTimeout(() => {
      fetchDataWithParams(1, status, perPage);
    }, 0);
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (newPerPage) => {
    console.log(`Changing items per page to: ${newPerPage}`);
    
    // Update the perPage state
    setPerPage(newPerPage);
    // Reset to first page when changing items per page
    setCurrentPage(1); 
    
    // Use setTimeout to ensure state updates before fetching
    // Pass the new perPage value directly to fetchData to avoid state timing issues
    setTimeout(() => {
      fetchDataWithParams(1, statusFilter, newPerPage);
    }, 0);
  };

  // Handle select/deselect all
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setSelectAll(isChecked);
    if (isChecked) {
      setSelectedDocuments(filteredDocuments.map((doc) => doc.nr));
    } else {
      setSelectedDocuments([]);
    }
  };

  // Handle selecting an individual document
  const handleSelectDocument = (nr) => {
    if (selectedDocuments.includes(nr)) {
      setSelectedDocuments(selectedDocuments.filter((docNr) => docNr !== nr));
    } else {
      setSelectedDocuments([...selectedDocuments, nr]);
    }
  };

  // Update document in state
  const updateDocument = (updatedDoc, deletedDocId) => {
    if (deletedDocId) {
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.nr !== deletedDocId));
    } else {
      setDocuments((prevDocs) =>
        prevDocs.map((doc) => (doc.nr === updatedDoc.nr ? updatedDoc : doc))
      );
    }
    setEditingDocument(null);
  };


  return (
    <div>
      {/* Display error messages */}
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
          <ul className="list-disc pl-5">
            {errors.map((err, index) => (
              <li key={index} className="text-sm">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Results count with Filters and Export Excel */}
      <div className="mb-6 px-5 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Statut:</span>
              <div className="flex flex-wrap gap-1">
                <button 
                  onClick={() => handleStatusFilterChange('')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === '' 
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Toate
                </button>
                <button 
                  onClick={() => handleStatusFilterChange('0')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === '0' 
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  În Lucru
                </button>
                <button 
                  onClick={() => handleStatusFilterChange('1')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === '1' 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  Închis
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between sm:justify-end items-center gap-4 w-full sm:w-auto">
            <div className="text-sm text-gray-500 font-medium">
              {totalItems} documente găsite
            </div>
            
            {/* Export Excel */}
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-3 py-2 border border-green-200 bg-green-50 rounded-md text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table section */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <table className="min-w-full bg-white divide-y divide-gray-200 table-fixed md:table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('statut')}
              >
                <div className="flex items-center">
                  <span>Statut</span>
                  {sortConfig.key === 'statut' && (
                    sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nume & Prenume
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Operator
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Domeniul Consultație
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Localitatea
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acțiuni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Se încarcă datele...</p>
                </td>
              </tr>
            ) : filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <tr key={doc.nr} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                    {doc.nr}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.statut === 'Inchis'
                          ? 'bg-green-100 text-green-800'
                          : doc.statut === 'In Lucru'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {doc.statut === 'Inchis' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {doc.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doc.numePrenume}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.operator}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.continutConsultatie}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.localitate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => setEditingDocument(doc)}
                      className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:underline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <p className="text-sm text-gray-500">Nu există documente care să corespundă criteriilor selectate.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={perPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        totalItems={totalItems}
      />

      {/* Edit Document Modal */}
      {editingDocument && (
        <EditDocumentModal
          isOpen={Boolean(editingDocument)}
          onClose={() => setEditingDocument(null)}
          documentData={editingDocument}
          updateDocument={updateDocument}
        />
      )}
    </div>
  );
};

export default DocumentTable;
