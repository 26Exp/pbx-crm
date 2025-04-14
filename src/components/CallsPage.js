import React, { useState, useEffect, useMemo } from 'react';
import EditDocumentModal from './EditDocumentModal'; // Import your modal component
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../services/apiUtils';
import config from '../config';
import Pagination from './Pagination';


// Utility function to format date to Romanian language
const formatDateToRomanian = (dateString) => {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  const date = new Date(dateString);
  return date.toLocaleDateString('ro-RO', options);
};

// Function to normalize phone numbers by removing non-digit characters
const normalizePhoneNumber = (phone) => phone.replace(/\D/g, '');

const CallsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [callsData, setCallsData] = useState([]); // Store fetched data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState(null);
  const navigate = useNavigate();
  
  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      // Add pagination parameters
      const queryParams = `?page=${currentPage}&per_page=${itemsPerPage}`;
      const callsUrl = getApiUrl(`calls/all${queryParams}`);
      const documentsUrl = getApiUrl('documents');

      const options = {
        method: 'GET',
        headers: getAuthHeaders(),
      };

      try {
        // Fetch calls data
        const callsResponse = await fetch(callsUrl, options);
        if (!callsResponse.ok) {
          throw new Error(`Error fetching calls: ${callsResponse.status} ${callsResponse.statusText}`);
        }
        const callsJson = await callsResponse.json();
        console.log("API Response:", callsJson);

        // Fetch documents data
        const documentsResponse = await fetch(documentsUrl, options);
        if (!documentsResponse.ok) {
          throw new Error(`Error fetching documents: ${documentsResponse.status} ${documentsResponse.statusText}`);
        }
        const documentsJson = await documentsResponse.json();

        // Create a map of call_id to document_id
        const callIdToDocumentId = {};
        documentsJson.data.forEach((doc) => {
          callIdToDocumentId[doc.call_id] = doc.id;
        });

        // Transform API data to match table structure
        const transformedData = callsJson.data.map((item) => ({
          id: item.id,
          statut: item.type === 'out' ? 'Ieșire' : 'Întrare',
          statutColor: item.type === 'out' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600',
          dateApel: formatDateToRomanian(item.start),
          notite: '', // Adjust this if you have notes in your data
          creatDe: item.user.name,
          contact: item.client || '-',
          documentId: callIdToDocumentId[item.id] || null, // Add documentId if exists
        }));
        
        // Update the state with the paginated data from server
        setCallsData(transformedData);
        // Set pagination data from API response
        setTotalItems(callsJson.total || 0);
        setCurrentPage(callsJson.current_page || 1);
        setTotalPages(callsJson.last_page || 1);
        setItemsPerPage(callsJson.per_page || 10);
        
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, itemsPerPage]); // Refetch when page or items per page change

  // Filter the data based on the search term (searching by phone number)
  const filteredData = useMemo(() => {
    if (!searchTerm) {
      // If no search term, return all data directly
      return callsData;
    }
    // Filter only when search term is entered
    return callsData.filter((row) =>
      normalizePhoneNumber(row.contact).includes(normalizePhoneNumber(searchTerm))
    );
  }, [callsData, searchTerm]);
  
  // If we're searching, use client-side pagination
  const isSearching = searchTerm !== '';
  
  // For search results, calculate pagination locally
  const localTotalItems = isSearching ? filteredData.length : totalItems;
  const localTotalPages = isSearching ? Math.max(1, Math.ceil(localTotalItems / itemsPerPage)) : totalPages;
  
  // Get current items to display
  const currentItems = isSearching ? 
    // If searching, slice the filtered data
    filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : 
    // If not searching, use the API-paginated data directly
    filteredData;
  
  // Update search term handling
  useEffect(() => {
    if (searchTerm) {
      // Reset to page 1 when searching
      setCurrentPage(1);
    }
  }, [searchTerm]);
  
  // Handle page change
  const handlePageChange = (pageNumber) => {
    console.log("Changing to page:", pageNumber, "Total pages:", isSearching ? localTotalPages : totalPages);
    
    // Validate page bounds against the appropriate total pages count
    const maxPages = isSearching ? localTotalPages : totalPages;
    if (pageNumber < 1) {
      pageNumber = 1;
    } else if (pageNumber > maxPages) {
      pageNumber = maxPages;
    }
    
    setCurrentPage(pageNumber);
    // Reset selections when page changes
    setSelectedRows([]);
    setSelectAll(false);
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
    // Reset selections
    setSelectedRows([]);
    setSelectAll(false);
  };

  // Handle selecting/deselecting a single row
  const handleRowSelection = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Handle selecting/deselecting all rows
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      // Only select the visible rows (current page)
      setSelectedRows(currentItems.map(row => row.id));
    }
    setSelectAll(!selectAll);
  };

  const handleIconClick = (row) => {
    if (row.documentId) {
      // Redirect to the document details page
      navigate(`/documents/${row.documentId}`);
    } else {
      // Open the modal to create a new document
      setSelectedCallId(row.id);
      setIsModalOpen(true);
    }
  };

  const handleDocumentCreated = (newDocument) => {
    setCallsData((prevCallsData) =>
      prevCallsData.map((call) => {
        if (call.id === newDocument.call_id) {
          return { ...call, documentId: newDocument.id };
        } else {
          return call;
        }
      })
    );
    setIsModalOpen(false);
  };

  if (loading) {
    return <div className="p-4 md:p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 md:p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Toate apelurile</h1>
        <div className="relative w-full sm:w-auto">
          <div className="flex items-center">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Căutare după nr ..."
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg hidden md:table">
          <thead>
            <tr className="bg-gray-100 text-left text-sm md:text-base">
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectAll}
                />
              </th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">Statut</th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">Date Apel</th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b max-w-xs">Notițe</th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">Creat de</th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">Contacte</th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">
                {/* Header for the new column */}
                <span className="material-icons text-gray-500">description</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-4 text-center text-gray-600">
                  Nu există apeluri care să corespundă criteriilor de căutare.
                </td>
              </tr>
            ) : (
              currentItems.map((row, index) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 h-14 md:h-16 text-sm md:text-base ${
                    selectedRows.includes(row.id) ? 'bg-blue-100' : ''
                  }`}
                >
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => handleRowSelection(row.id)}
                    />
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b whitespace-nowrap">
                    <span className={`py-1 px-3 rounded-full text-sm ${row.statutColor}`}>
                      {row.statut}
                    </span>
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b text-gray-600">{row.dateApel}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b text-gray-600 max-w-xs truncate">
                    <a href="#" className="text-blue-600 hover:underline">
                      {row.notite || 'Nicio notiță'}
                    </a>
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b text-gray-600">{row.creatDe}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b text-blue-600 hover:underline">
                    {row.contact}
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b text-gray-600">
                    <span
                      className={`material-icons ${
                        row.documentId ? 'text-blue-600 hover:underline' : 'text-gray-400'
                      } cursor-pointer`}
                      onClick={() => handleIconClick(row)}
                    >
                      description
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Responsive Cards for Mobile */}
        <div className="md:hidden space-y-3">
          {filteredData.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg py-6 text-center text-gray-600">
              Nu există apeluri care să corespundă criteriilor de căutare.
            </div>
          ) : (
            currentItems.map((row, index) => (
              <div
                key={row.id}
                className={`bg-white border border-gray-200 rounded-lg shadow-sm p-3 ${
                  selectedRows.includes(row.id) ? 'bg-blue-50 border-blue-300' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className={`py-1 px-2.5 rounded-full text-xs font-medium ${row.statutColor}`}>
                    {row.statut}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div
                      className="cursor-pointer p-1.5"
                      onClick={() => handleIconClick(row)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 ${row.documentId ? 'text-blue-600' : 'text-gray-400'}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                        />
                      </svg>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => handleRowSelection(row.id)}
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <div className="text-gray-600 font-medium">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{row.dateApel.split(',')[0]}</span>
                      </div>
                      <div className="flex items-center mt-1 text-gray-500 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{row.dateApel.split(',')[1]}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center justify-end text-gray-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">{row.creatDe}</span>
                      </div>
                    </div>
                  </div>
                  
                  {row.contact !== '-' && (
                    <div className="flex items-center mt-2 text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="font-medium">{row.contact}</span>
                    </div>
                  )}
                  
                  {row.notite && (
                    <div className="text-gray-600 mt-2 border-t border-gray-100 pt-2">
                      <div className="flex items-start mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{row.notite || 'Nicio notiță'}</span>
                      </div>
                    </div>
                  )}
                  
                  <div
                    className="text-gray-600 mt-2 pt-2 border-t border-gray-100 flex items-center cursor-pointer"
                    onClick={() => handleIconClick(row)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 mr-1.5 ${row.documentId ? 'text-blue-600' : 'text-gray-400'}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                    <span className={row.documentId ? "text-blue-600 font-medium" : "text-gray-500"}>
                      {row.documentId ? 'Vezi Document' : 'Creează Document'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={isSearching ? localTotalPages : totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        totalItems={isSearching ? localTotalItems : totalItems}
      />

      {/* Render EditDocumentModal */}
      {isModalOpen && (
        <EditDocumentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          documentData={null} // Since we are creating a new document
          callId={selectedCallId}
          updateDocument={handleDocumentCreated}
        />
      )}
    </div>
  );
};

export default CallsPage;
