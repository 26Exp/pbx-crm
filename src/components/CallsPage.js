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
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-0">Toate apelurile</h1>
        <div className="relative w-full md:w-auto">
          <input
            type="text"
            placeholder="Căutare după nr ..."
            className="border rounded-full px-4 py-2 text-gray-600 w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
        <div className="md:hidden">
          {filteredData.length === 0 ? (
            <div className="py-4 text-center text-gray-600">
              Nu există apeluri care să corespundă criteriilor de căutare.
            </div>
          ) : (
            currentItems.map((row, index) => (
              <div
                key={row.id}
                className={`bg-white border border-gray-200 rounded-lg mb-4 p-4 ${
                  selectedRows.includes(row.id) ? 'bg-blue-100' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`py-1 px-3 rounded-full text-sm ${row.statutColor}`}>
                    {row.statut}
                  </span>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => handleRowSelection(row.id)}
                  />
                </div>
                <div className="text-gray-600 text-sm mb-1">
                  <strong>Data Apel: </strong>
                  {row.dateApel}
                </div>
                <div className="text-gray-600 text-sm mb-1">
                  <strong>Creat de: </strong>
                  {row.creatDe}
                </div>
                {row.contact !== '-' && (
                  <div className="text-blue-600 hover:underline text-sm mb-1">
                    <strong>Contact: </strong>
                    {row.contact}
                  </div>
                )}
                <div className="text-gray-600 text-sm mb-1">
                  <a href="#" className="text-blue-600 hover:underline">
                    {row.notite || 'Nicio notiță'}
                  </a>
                </div>
                <div
                  className="text-gray-600 text-sm cursor-pointer"
                  onClick={() => handleIconClick(row)}
                >
                  <span
                    className={`material-icons ${
                      row.documentId ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    description
                  </span>
                  {row.documentId ? ' Vezi Document' : ' Niciun Document'}
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
