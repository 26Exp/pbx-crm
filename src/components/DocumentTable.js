// DocumentTable.jsx

import React, { useState, useEffect } from 'react';
import EditDocumentModal from './EditDocumentModal';
import * as XLSX from 'xlsx';
import { getApiUrl, getAuthHeaders, fetchAllPages } from '../services/apiUtils';
import config from '../config';
import apiService from '../services/api';



// We're now using the fetchAllPages utility from apiUtils.js

const DocumentTable = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPersonType, setSelectedPersonType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  // Lookup maps
  const [citiesMap, setCitiesMap] = useState({});
  const [domainsMap, setDomainsMap] = useState({});
  const [businessesMap, setBusinessesMap] = useState({});
  const [servicesMap, setServicesMap] = useState({});

  // State for editing document
  const [editingDocument, setEditingDocument] = useState(null);

  // State for sorting
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // State for dropdown menus
  const [isPersonTypeMenuOpen, setIsPersonTypeMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  // Fetch documents and related entities from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrors([]);

      // Check if user is authenticated
      const token = localStorage.getItem(config.auth.tokenKey);

      if (!token) {
        setErrors(['Tokenul de autentificare nu a fost găsit. Vă rugăm să vă autentificați din nou.']);
        setLoading(false);
        return;
      }

      try {
        // Fetch all related entities concurrently using our API service
        const [
          documentsData,
          citiesData,
          domainsData,
          businessesData,
          servicesData,
        ] = await Promise.all([
          apiService.documents.getAll(),
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

        // Map documents to include names instead of IDs (except institution_id)
        const mappedDocuments = documentsData.map((doc) => ({
          nr: doc.id,
          statut: doc.status,
          numePrenume: doc.name || 'N/A',
          continutConsultatie: domainsLookup[doc.domain_id] || `ID: ${doc.domain_id}`,
          dataApel: doc.created_at ? doc.created_at.split('T')[0] : 'N/A',
          localitate: citiesLookup[doc.city_id] || `ID: ${doc.city_id}`,
          persFizica: doc.business_id === null,
          persJuridica: doc.business_id !== null,
          agentEconomic: doc.business_id ? businessesLookup[doc.business_id] || `ID: ${doc.business_id}` : 'N/A',
          categorieInformatie: servicesLookup[doc.service_id] || `ID: ${doc.service_id}`,
          detalii: doc.details,
          domain_id: doc.domain_id,
          city_id: doc.city_id,
          business_id: doc.business_id,
          service_id: doc.service_id,
          product_id: doc.product_id,
          created_at: doc.created_at,
          call_id: doc.call_id,
        }));

        setDocuments(mappedDocuments);
        setFilteredDocuments(mappedDocuments);
      } catch (error) {
        console.error(error);
        setErrors([error.message || 'Eroare la încărcarea datelor. Vă rugăm să încercați din nou.']);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredDocuments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Documente');
  
    // Generate and trigger download
    XLSX.writeFile(workbook, 'documente.xlsx');
  };
  
  // Filter and sort documents
  useEffect(() => {
    let filtered = documents;

    // Filter by selected status
    if (selectedStatus) {
      filtered = filtered.filter((doc) => doc.statut === selectedStatus);
    }

    // Filter by selected person type
    if (selectedPersonType) {
      if (selectedPersonType === 'Pers. Fizică') {
        filtered = filtered.filter((doc) => doc.persFizica);
      } else if (selectedPersonType === 'Pers. Juridică') {
        filtered = filtered.filter((doc) => doc.persJuridica);
      }
    }

    // Filter by search term (agentEconomic)
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.agentEconomic &&
          doc.agentEconomic.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

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
  }, [documents, selectedStatus, selectedPersonType, searchTerm, sortConfig]);

  // Handle status filter change
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    setIsStatusMenuOpen(false);
  };

  // Handle person type filter change
  const handlePersonTypeFilter = (type) => {
    setSelectedPersonType(type);
    setIsPersonTypeMenuOpen(false);
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        setIsPersonTypeMenuOpen(false);
        setIsStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

      {/* Filtering and search section */}
      <div className="mb-6 px-5 py-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Căutare agent economic..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Tip persoană Filter */}
            <div className="relative dropdown">
              <button
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsPersonTypeMenuOpen(!isPersonTypeMenuOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>{selectedPersonType || 'Tip persoană'}</span>
              </button>
              {isPersonTypeMenuOpen && (
                <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-40 z-20 overflow-hidden">
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                      onClick={() => handlePersonTypeFilter('Pers. Fizică')}
                    >
                      Persoană Fizică
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                      onClick={() => handlePersonTypeFilter('Pers. Juridică')}
                    >
                      Persoană Juridică
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                      onClick={() => handlePersonTypeFilter('')}
                    >
                      Toate
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Statut Filter */}
            <div className="relative dropdown">
              <button
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>{selectedStatus || 'Statut'}</span>
              </button>
              {isStatusMenuOpen && (
                <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-44 z-20 overflow-hidden">
                  <div className="py-1">
                    <button 
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                      onClick={() => handleStatusFilter('In Lucru')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>În Lucru</span>
                    </button>
                    <button 
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                      onClick={() => handleStatusFilter('Inchis')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Închis</span>
                    </button>
                    <button 
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                      onClick={() => handleStatusFilter('')}
                    >
                      <span className="ml-6">Toate</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sortează după dată */}
            <button
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => handleSort('dataApel')}
            >
              {sortConfig.key === 'dataApel' ? (
                sortConfig.direction === 'ascending' ? 
                '↑' : 
                '↓'
              ) : '↑'}
              <span>Data apelului</span>
            </button>

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
        
        {/* Results count */}
        <div className="mt-4 text-sm text-gray-500 font-medium">
          {filteredDocuments.length} documente găsite
        </div>
      </div>

      {/* Table section */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <table className="min-w-full bg-white divide-y divide-gray-200 table-fixed md:table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('nr')}
              >
                <div className="flex items-center">
                  <span>Nr.</span>
                  {sortConfig.key === 'nr' && (
                    sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                  )}
                </div>
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
                Domeniul Consultație
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('dataApel')}
              >
                <div className="flex items-center">
                  <span>Data Apelului</span>
                  {sortConfig.key === 'dataApel' && (
                    sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Localitatea
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agent Economic
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categorie Informație
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acțiuni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="10" className="px-6 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Se încarcă datele...</p>
                </td>
              </tr>
            ) : filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <tr key={doc.nr} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                      checked={selectedDocuments.includes(doc.nr)}
                      onChange={() => handleSelectDocument(doc.nr)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{doc.nr}
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
                    {doc.continutConsultatie}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.dataApel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.localitate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.agentEconomic}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.categorieInformatie}
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
                <td colSpan="10" className="px-6 py-8 text-center">
                  <p className="text-sm text-gray-500">Nu există documente care să corespundă criteriilor selectate.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
