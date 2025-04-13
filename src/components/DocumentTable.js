// DocumentTable.jsx

import React, { useState, useEffect } from 'react';
import EditDocumentModal from './EditDocumentModal';
import * as XLSX from 'xlsx'; // ✅ Import for Excel export
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
    <div className="p-4">
      {/* Display error messages */}
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          <ul className="list-disc pl-5">
            {errors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Filtering and search section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 bg-gray-100 p-4 rounded-lg">
        {/* Search Input */}
        <div className="mb-2 md:mb-0">
          <input
            type="text"
            placeholder="Căutare după agent economic ..."
            className="border p-2 rounded w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-4 mb-2 md:mb-0">
          {/* Tip persoană Filter */}
          <div className="relative dropdown">
            <button
              className="border px-4 py-2 rounded-lg"
              onClick={() => setIsPersonTypeMenuOpen(!isPersonTypeMenuOpen)}
            >
              Tip persoană
            </button>
            {isPersonTypeMenuOpen && (
              <div className="absolute bg-white border mt-2 p-2 rounded-lg shadow-lg w-40 z-10">
                <ul className="space-y-2">
                  <li
                    className="cursor-pointer py-1 text-center hover:bg-gray-200"
                    onClick={() => handlePersonTypeFilter('Pers. Fizică')}
                  >
                    Pers. Fizică
                  </li>
                  <li
                    className="cursor-pointer py-1 text-center hover:bg-gray-200"
                    onClick={() => handlePersonTypeFilter('Pers. Juridică')}
                  >
                    Pers. Juridică
                  </li>
                  <li
                    className="cursor-pointer py-1 text-center hover:bg-gray-200"
                    onClick={() => handlePersonTypeFilter('')}
                  >
                    Toate
                  </li>
                </ul>
               
              </div>
              
            )}
          </div>
          {/* Statut Filter */}
          <div className="relative dropdown">
            <button
              className="border px-4 py-2 rounded-lg"
              onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
            >
              Statut
            </button>
            {isStatusMenuOpen && (
              <div className="absolute bg-white border mt-2 p-2 rounded-lg shadow-lg w-40 z-10">
                <ul className="space-y-2">
                  <li
                    className="cursor-pointer rounded-full bg-green-100 text-green-600 py-1 text-center hover:bg-green-200"
                    onClick={() => handleStatusFilter('Inchis')}
                  >
                    Închis
                  </li>
                  <li
                    className="cursor-pointer rounded-full bg-red-100 text-red-600 py-1 text-center hover:bg-red-200"
                    onClick={() => handleStatusFilter('Respins')}
                  >
                    Respins
                  </li>
                  <li
                    className="cursor-pointer rounded-full bg-blue-100 text-blue-600 py-1 text-center hover:bg-blue-200"
                    onClick={() => handleStatusFilter('Rezolvat')}
                  >
                    Rezolvat
                  </li>
                  <li
                    className="cursor-pointer rounded-full bg-gray-100 text-gray-600 py-1 text-center hover:bg-gray-200"
                    onClick={() => handleStatusFilter('')}
                  >
                    Toate
                  </li>
                </ul>
              </div>
            )}
          </div>
          {/* Sortează după dată */}
          <div className="relative">
            <button
              className="border px-4 py-2 rounded-lg"
              onClick={() => handleSort('dataApel')}
            >
              Sortează după dată{' '}
              {sortConfig.key === 'dataApel' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
            </button>
          </div>
           <div className=" md:mt-0">
    <button
      onClick={exportToExcel}
      className="border px-4 py-2 rounded-lg"
    >
      Exportă Excel
    </button>
  </div>
        </div>
        <div>{filteredDocuments.length} Documente</div>
      </div>

      {/* Table section */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border-b text-left">
                <input
                  type="checkbox"
                  className="cursor-pointer"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              <th
                className="py-2 px-4 border-b text-left cursor-pointer"
                onClick={() => handleSort('nr')}
              >
                Nr.
                {sortConfig.key === 'nr' ? (sortConfig.direction === 'ascending' ? ' ↑' : ' ↓') : ''}
              </th>
              <th
                className="py-2 px-4 border-b text-left cursor-pointer"
                onClick={() => handleSort('statut')}
              >
                Statut
                {sortConfig.key === 'statut' ? (sortConfig.direction === 'ascending' ? ' ↑' : ' ↓') : ''}
              </th>
              <th className="py-2 px-4 border-b text-left">Nume & Prenume</th>
              <th className="py-2 px-4 border-b text-left">Domeniul Consultație</th>
              <th
                className="py-2 px-4 border-b text-left cursor-pointer"
                onClick={() => handleSort('dataApel')}
              >
                Data apelului
                {sortConfig.key === 'dataApel' ? (sortConfig.direction === 'ascending' ? ' ↑' : ' ↓') : ''}
              </th>
              <th className="py-2 px-4 border-b text-left">Localitatea (CUATM)</th>
              <th
                className="py-2 px-4 border-b text-left cursor-pointer"
                onClick={() => handleSort('persFizica')}
              >
                Pers. Fizică
                {sortConfig.key === 'persFizica' ? (sortConfig.direction === 'ascending' ? ' ↑' : ' ↓') : ''}
              </th>
              <th
                className="py-2 px-4 border-b text-left cursor-pointer"
                onClick={() => handleSort('persJuridica')}
              >
                Pers. Juridică
                {sortConfig.key === 'persJuridica' ? (sortConfig.direction === 'ascending' ? ' ↑' : ' ↓') : ''}
              </th>
              <th className="py-2 px-4 border-b text-left">Agent economic / Denumire / IDNO</th>
              <th className="py-2 px-4 border-b text-left">Categorie Informație</th>
              <th className="py-2 px-4 border-b text-left">Detalii</th>
              <th className="py-2 px-4 border-b text-left">
                <span className="material-icons text-gray-500">settings</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="13" className="py-4 text-center">
                  Încarcă...
                </td>
              </tr>
            ) : filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <tr key={doc.nr} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={selectedDocuments.includes(doc.nr)}
                      onChange={() => handleSelectDocument(doc.nr)}
                    />
                  </td>
                  <td className="py-3 px-4 border-b">{doc.nr}</td>
                  <td className="py-3 px-4 border-b">
                    <span
                      className={`py-1 px-3 rounded-full text-sm ${
                        doc.statut === 'Inchis'
                          ? 'bg-green-100 text-green-600'
                          : doc.statut === 'Respins'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {doc.statut}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-b">{doc.numePrenume}</td>
                  <td className="py-3 px-4 border-b">{doc.continutConsultatie}</td>
                  <td className="py-3 px-4 border-b">{doc.dataApel}</td>
                  <td className="py-3 px-4 border-b">{doc.localitate}</td>
                  <td className="py-3 px-4 border-b">{doc.persFizica ? 'Da' : 'Nu'}</td>
                  <td className="py-3 px-4 border-b">{doc.persJuridica ? 'Da' : 'Nu'}</td>
                  <td className="py-3 px-4 border-b">{doc.agentEconomic}</td>
                  <td className="py-3 px-4 border-b">{doc.categorieInformatie}</td>
                  <td className="py-3 px-4 border-b">{doc.detalii}</td>
                  <td className="py-3 px-4 border-b text-gray-600">
                    <button onClick={() => setEditingDocument(doc)}>
                      <span className="material-icons">edit</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="13" className="py-4 text-center">
                  Nu există documente de afișat.
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
