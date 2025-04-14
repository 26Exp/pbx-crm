import React, { useState, useEffect, useMemo, useRef } from 'react';
import EditDocumentModal from './EditDocumentModal'; // Import your modal component
import { Link, useNavigate } from 'react-router-dom';
import { getApiUrl, getAuthHeaders, formatRecordUrl } from '../services/apiUtils';
import config from '../config';
import Pagination from './Pagination';

// Simple Document Viewer Modal
const DocumentViewerModal = ({ isOpen, onClose, documentId, callId, onEditClick }) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId) {
        setError("Document ID necunoscut");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const url = getApiUrl(`documents/${documentId}`);
        const response = await fetch(url, {
          headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        setDocument(responseData.data || responseData);
      } catch (err) {
        console.error("Error fetching document:", err);
        setError(err.message || "Eroare la încărcarea documentului");
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen && documentId) {
      fetchDocument();
    }
  }, [isOpen, documentId]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {loading ? "Încărcare document..." : error ? "Eroare" : `Document #${documentId}`}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded text-red-700">
              <p>{error}</p>
              <button 
                onClick={() => onEditClick(documentId)}
                className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
              >
                Editează document
              </button>
            </div>
          ) : document ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Informații document #{document.id}</h3>
                  <p className="text-gray-600 text-sm">{document.created_at ? new Date(document.created_at).toLocaleString('ro-RO') : 'N/A'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium
                  ${document.status === 'In Lucru' ? 'bg-yellow-100 text-yellow-800' : 
                    document.status === 'Inchis' ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-gray-800'}`}>
                  {document.status || 'N/A'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-sm text-gray-500">Nume</p>
                  <p className="font-medium">{document.name || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Operator</p>
                  <p className="font-medium">{document.user?.name || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Localitate</p>
                  <p className="font-medium">{document.city?.name || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Domeniu</p>
                  <p className="font-medium">{document.domain?.name || 'N/A'}</p>
                </div>
                
                {document.business && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Agent Economic</p>
                    <p className="font-medium">{document.business.name || 'N/A'}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500">Produs</p>
                  <p className="font-medium">{document.product?.name || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Serviciu</p>
                  <p className="font-medium">{document.service?.name || 'N/A'}</p>
                </div>
                
                <div className="col-span-2 border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-500 mb-1">Detalii consultație</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{document.details || 'Fără detalii'}</p>
                </div>
                
                {document.call && (
                  <div className="col-span-2 border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500 mb-2">Informații apel</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Număr client</p>
                          <p className="font-medium">{document.call.client || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Via număr</p>
                          <p className="font-medium">{document.call.via || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Data și ora</p>
                          <p className="font-medium">{document.call.start || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Durată</p>
                          <p className="font-medium">{document.call.duration ? `${document.call.duration} sec` : 'N/A'}</p>
                        </div>
                      </div>
                      
                      {document.call.record && (
                        <div className="mt-3 border-t border-gray-200 pt-3">
                          <p className="text-xs text-gray-500 mb-1">Înregistrare apel</p>
                          <AudioPlayer url={formatRecordUrl(document.call.record)} duration={document.call.duration} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-100 pt-4 flex justify-end space-x-3">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Închide
                </button>
                <button 
                  onClick={() => onEditClick(documentId, document)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editează
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Documentul nu a fost găsit</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Audio Player Component
const AudioPlayer = ({ url, duration }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handlePlayPause = () => {
    if (error) return; // Don't do anything if there's an error
    
    if (audioRef.current) {
      setLoading(true);
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setLoading(false);
      } else {
        // Play and handle any errors
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setLoading(false);
            })
            .catch(err => {
              console.error('Error playing audio:', err);
              setError(true);
              setLoading(false);
            });
        }
      }
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const audioDuration = audioRef.current.duration || 0;
      
      if (!isNaN(audioDuration) && audioDuration > 0) {
        setCurrentTime(formatTime(current));
        setProgress((current / audioDuration) * 100);
      }
      
      if (current === audioDuration) {
        setIsPlaying(false);
      }
    }
  };
  
  const handleProgressChange = (e) => {
    if (audioRef.current && audioRef.current.duration) {
      const newTime = (e.target.value / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(e.target.value);
    }
  };
  
  // Handle load and error events
  const handleLoadedMetadata = () => {
    setLoading(false);
    if (audioRef.current) {
      setCurrentTime(formatTime(0));
    }
  };
  
  const handleError = () => {
    setLoading(false);
    setError(true);
    console.error('Error loading audio file');
  };
  
  // Format the displayed duration - use API provided duration or the actual audio duration
  const displayDuration = formatTime(duration);
  
  return (
    <div className="flex items-center space-x-2 w-full max-w-xs">
      <button
        onClick={handlePlayPause}
        disabled={loading || error}
        className={`flex-shrink-0 ${error ? 'text-red-500' : loading ? 'text-gray-400' : 'text-indigo-600 hover:text-indigo-800'} focus:outline-none`}
      >
        {error ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        ) : loading ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      
      <div className="flex-grow flex items-center space-x-2">
        <span className="text-xs text-gray-600 w-8">{currentTime}</span>
        <div className="flex-grow">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            disabled={!isPlaying || loading || error}
            className={`w-full h-1.5 ${error ? 'bg-red-200' : 'bg-gray-200'} rounded-full appearance-none cursor-pointer accent-indigo-600`}
          />
        </div>
        <span className="text-xs text-gray-600 w-8">{displayDuration}</span>
      </div>
      
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
        preload="metadata"
      />
    </div>
  );
};


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

  // Filter states
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hasRecording, setHasRecording] = useState(false);
  
  // Stats for UI
  const [callStats, setCallStats] = useState({
    total: 0,
    incoming: 0,
    outgoing: 0,
    withRecording: 0
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [selectedDocumentData, setSelectedDocumentData] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'view'
  const navigate = useNavigate();
  
  // Fetch data from API
  // Function to fetch data from API
  const fetchData = async () => {
    setLoading(true);
    
    // Build query parameters
    let queryParams = `?page=${currentPage}&per_page=${itemsPerPage}`;
    
    // Add search term if provided
    if (searchTerm) {
      queryParams += `&search=${encodeURIComponent(searchTerm)}`;
    }
    
    const callsUrl = getApiUrl(`calls/all${queryParams}`);
    const documentsUrl = getApiUrl('documents');
    const statsUrl = getApiUrl('calls/statistics');

    const options = {
      method: 'GET',
      headers: getAuthHeaders(),
    };

    try {
      // Fetch all data concurrently
      const [callsResponse, documentsResponse, statsResponse] = await Promise.all([
        fetch(callsUrl, options),
        fetch(documentsUrl, options),
        fetch(statsUrl, options)
      ]);
      
      // Check calls response
      if (!callsResponse.ok) {
        throw new Error(`Error fetching calls: ${callsResponse.status} ${callsResponse.statusText}`);
      }
      const callsJson = await callsResponse.json();
      console.log("API Response:", callsJson);
      
      // Check documents response
      if (!documentsResponse.ok) {
        throw new Error(`Error fetching documents: ${documentsResponse.status} ${documentsResponse.statusText}`);
      }
      const documentsJson = await documentsResponse.json();
      
      // Check stats response
      if (!statsResponse.ok) {
        throw new Error(`Error fetching statistics: ${statsResponse.status} ${statsResponse.statusText}`);
      }
      const statsJson = await statsResponse.json();
      console.log("Statistics Response:", statsJson);
      
      // Set statistics from API
      setCallStats({
        total: statsJson.total_calls || 0,
        incoming: statsJson.incoming_calls || 0,
        outgoing: statsJson.outgoing_calls || 0,
        withoutDocuments: statsJson.calls_without_documents || 0
      });

      // Create a map of call_id to document_id
      const callIdToDocumentId = {};
      documentsJson.data.forEach((doc) => {
        callIdToDocumentId[doc.call_id] = doc.id;
      });

      // Transform API data to match table structure
      const transformedData = callsJson.data.map((item) => {
        // Check if document exists in response
        const documentId = item.document ? item.document.id : callIdToDocumentId[item.id] || null;
        
        // Format the duration to seconds
        const callDuration = item.duration ? parseInt(item.duration) : 0;
        
        // Format the record URL properly using the utility function
        const recordUrl = formatRecordUrl(item.record);
        
        return {
          id: item.id,
          statut: item.type === 'out' ? 'Ieșire' : 'Întrare',
          statutColor: item.type === 'out' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600',
          type: item.type,
          dateApel: formatDateToRomanian(item.start),
          dateObj: new Date(item.start), // Create a Date object for filtering
          notite: item.document?.details || '', // Get notes from document if exists
          creatDe: item.user.name,
          contact: item.client || '-',
          viaNumber: item.via || '-',
          waitTime: item.wait || 0,
          documentId: documentId, 
          recordingUrl: recordUrl,
          duration: callDuration,
          institution: item.institution?.name || '-'
        };
      });
      
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

  // Execute fetchData when relevant state changes
  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, searchTerm]); // Refetch when page, items per page, or search term changes

  // Get date range for date filter
  const getDateRange = (filter) => {
    const now = new Date();
    switch (filter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return { start: today, end: now };
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);
        return { start: yesterday, end: yesterdayEnd };
      case 'week':
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        return { start: weekStart, end: now };
      case 'month':
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - 1);
        return { start: monthStart, end: now };
      default:
        return { start: null, end: null };
    }
  };
  
  // For now, we'll use the data as-is since we're fetching it from the API
  const filteredData = callsData;
  
  // We're always using server-side pagination
  const isClientSidePagination = false;
  
  // For filtered results, calculate pagination locally
  const localTotalItems = isClientSidePagination ? filteredData.length : totalItems;
  const localTotalPages = isClientSidePagination ? Math.max(1, Math.ceil(localTotalItems / itemsPerPage)) : totalPages;
  
  // Get current items to display
  const currentItems = isClientSidePagination ? 
    // If filtering locally, slice the filtered data
    filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : 
    // If not filtering, use the API-paginated data directly
    filteredData;
  
  // Update filter handling - reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  // Live search state and functionality
  const [liveSearchResults, setLiveSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showLiveResults, setShowLiveResults] = useState(false);
  const searchRef = useRef(null);
  
  // Handle search input with debounce
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Handle clicks outside the search results
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowLiveResults(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);
  
  // Perform live search
  const performLiveSearch = async (term) => {
    if (!term || term.length < 2) {
      setLiveSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const url = getApiUrl(`calls/search?query=${encodeURIComponent(term)}`);
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        const data = await response.json();
        setLiveSearchResults(data.results || []);
      } else {
        console.error("Search API error:", response.statusText);
        setLiveSearchResults([]);
      }
    } catch (err) {
      console.error("Live search error:", err);
      setLiveSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Update search term with debounce to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(debouncedSearchTerm);
      performLiveSearch(debouncedSearchTerm);
    }, 300); // 300ms delay for more responsive feel
    
    if (debouncedSearchTerm.length > 0) {
      setShowLiveResults(true);
    }
    
    return () => clearTimeout(timer);
  }, [debouncedSearchTerm]);
  
  // Handle page change
  const handlePageChange = (pageNumber) => {
    console.log("Changing to page:", pageNumber, "Total pages:", totalPages);
    
    // Validate page bounds
    if (pageNumber < 1) {
      pageNumber = 1;
    } else if (pageNumber > totalPages) {
      pageNumber = totalPages;
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
      // Open the modal to view existing document
      setSelectedDocumentId(row.documentId);
      setSelectedCallId(row.id);
      setModalMode('view');
      setIsModalOpen(true);
    } else {
      // Open the modal to create a new document
      setSelectedCallId(row.id);
      setSelectedDocumentId(null);
      setModalMode('create');
      setIsModalOpen(true);
    }
  };
  
  const handleEditClick = (documentId, documentData) => {
    setSelectedDocumentId(documentId);
    setSelectedDocumentData(documentData);
    setIsModalOpen(false);
    setIsEditModalOpen(true);
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
    setIsEditModalOpen(false);
  };

  if (loading) {
    return <div className="p-4 md:p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 md:p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-gray-50 overflow-hidden">
      {/* Header and Stats */}
      <div className="flex flex-col mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Toate apelurile</h1>
          <div className="relative w-full sm:w-auto" ref={searchRef}>
            <div className="flex items-center">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Caută după număr de telefon..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={debouncedSearchTerm}
                onChange={(e) => setDebouncedSearchTerm(e.target.value)}
                onFocus={() => debouncedSearchTerm.length > 0 && setShowLiveResults(true)}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            
            {/* Live search results dropdown */}
            {showLiveResults && liveSearchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                <ul className="py-1">
                  {liveSearchResults.map((result) => (
                    <li 
                      key={result.id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        // Handle result click - either navigate to document or filter
                        setSearchTerm(result.client || result.phone || '');
                        setDebouncedSearchTerm(result.client || result.phone || '');
                        setShowLiveResults(false);
                      }}
                    >
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${result.type === 'in' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <div>
                          <div className="font-medium">{result.client || result.phone || 'Număr necunoscut'}</div>
                          <div className="text-xs text-gray-500">
                            {result.date && new Date(result.date).toLocaleDateString('ro-RO')}
                            {result.document_id && ' • Document creat'}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* No results message */}
            {showLiveResults && debouncedSearchTerm.length > 1 && !isSearching && liveSearchResults.length === 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 p-4 text-center text-gray-500">
                Nu s-au găsit rezultate pentru "{debouncedSearchTerm}"
              </div>
            )}
          </div>
        </div>
        
        {/* Stats Cards - Original design */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs text-gray-500 font-medium">Total Apeluri</h3>
                <p className="text-xl font-bold">{callStats.total}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs text-gray-500 font-medium">Apeluri Intrare</h3>
                <p className="text-xl font-bold">{callStats.incoming}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-red-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs text-gray-500 font-medium">Apeluri Ieșire</h3>
                <p className="text-xl font-bold">{callStats.outgoing}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-full text-red-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-orange-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs text-gray-500 font-medium">Fără Documente</h3>
                <p className="text-xl font-bold">{callStats.withoutDocuments}</p>
              </div>
              <div className="bg-orange-100 p-2 rounded-full text-orange-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg hidden md:table">
          <thead>
            <tr className="bg-gray-100 text-left text-sm md:text-base">
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">ID Apel</th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">Statut</th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">Date Apel</th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">Durată/Așteptare</th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b max-w-xs">Notițe</th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">Creat de</th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">Contact/VIA</th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">Înregistrare</th>
              <th className="py-2 md:py-3 px-2 md:px-4 border-b">
                <span className="material-icons text-gray-500">description</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-4 text-center text-gray-600">
                  Nu există apeluri care să corespundă criteriilor de căutare.
                </td>
              </tr>
            ) : (
              currentItems.map((row, index) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 h-14 md:h-16 text-sm md:text-base`}
                >
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b font-medium text-gray-700">
                    #{row.id}
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b whitespace-nowrap">
                    <span className={`py-1 px-3 rounded-full text-sm ${row.statutColor}`}>
                      {row.statut}
                    </span>
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b text-gray-600">{row.dateApel}</td>
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b text-gray-600">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{row.duration} sec</span>
                      <span className="text-xs text-gray-500">Așt: {row.waitTime} sec</span>
                    </div>
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b text-gray-600 max-w-xs truncate">
                    {row.documentId ? (
                      <button 
                        onClick={() => handleIconClick(row)}
                        className="text-blue-600 hover:underline truncate max-w-xs"
                      >
                        {row.notite ? row.notite.substring(0, 60) + (row.notite.length > 60 ? '...' : '') : 'Nicio notiță'}
                      </button>
                    ) : (
                      <span className="text-gray-500 truncate max-w-xs">
                        {row.notite ? row.notite.substring(0, 60) + (row.notite.length > 60 ? '...' : '') : 'Nicio notiță'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b">
                    <div className="flex flex-col">
                      <span className="text-gray-700">{row.creatDe}</span>
                      <span className="text-xs text-gray-500">{row.institution}</span>
                    </div>
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b">
                    <div className="flex flex-col">
                      <span className="text-blue-600 hover:underline">{row.contact}</span>
                      {row.viaNumber !== '-' && (
                        <span className="text-xs text-gray-500">via {row.viaNumber}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 border-b text-gray-600">
                    {row.recordingUrl ? (
                      <AudioPlayer url={row.recordingUrl} duration={row.duration} />
                    ) : (
                      <span className="text-gray-400 text-sm italic">Fără înregistrare</span>
                    )}
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
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-3"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">#{row.id}</span>
                    <span className={`py-1 px-2.5 rounded-full text-xs font-medium ${row.statutColor}`}>
                      {row.statut}
                    </span>
                  </div>
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
                      <div className="text-xs text-gray-500 mt-1">
                        {row.institution}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-2">
                    {row.contact !== '-' && (
                      <div className="flex items-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="font-medium">{row.contact}</span>
                      </div>
                    )}
                    
                    {row.viaNumber !== '-' && (
                      <div className="flex items-center text-gray-600 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>via {row.viaNumber}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Așteptare: {row.waitTime}s</span>
                    </div>
                    
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Durată: {row.duration}s</span>
                    </div>
                  </div>
                  
                  {row.notite && (
                    <div className="text-gray-600 mt-2 border-t border-gray-100 pt-2">
                      <div className="flex items-start mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {row.documentId ? (
                          <button 
                            onClick={() => handleIconClick(row)}
                            className={`text-${row.documentId ? 'blue' : 'gray'}-600 hover:underline`}
                          >
                            {row.notite ? row.notite.substring(0, 40) + (row.notite.length > 40 ? '...' : '') : 'Nicio notiță'}
                          </button>
                        ) : (
                          <span className="text-gray-600">
                            {row.notite ? row.notite.substring(0, 40) + (row.notite.length > 40 ? '...' : '') : 'Nicio notiță'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Audio Player Section */}
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <div className="flex items-center mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">Înregistrare</span>
                    </div>
                    
                    {row.recordingUrl ? (
                      <div className="mt-1">
                        <AudioPlayer url={row.recordingUrl} duration={row.duration} />
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm italic">Fără înregistrare</div>
                    )}
                  </div>
                  
                  <div
                    className="text-gray-600 mt-3 pt-3 border-t border-gray-100 flex items-center cursor-pointer"
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
      {/* Empty state when no results found */}
      {filteredData.length === 0 && !loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center my-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-1">Niciun rezultat găsit</h3>
          <p className="text-gray-500 mb-4">Încercați să modificați filtrele sau să ștergeți criteriile de căutare</p>
          <button 
            onClick={() => {
              setDateFilter('all');
              setStatusFilter('all');
              setHasRecording(false);
              setSearchTerm('');
            }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Resetează toate filtrele
          </button>
        </div>
      )}

      {/* Pagination (only show if we have results) */}
      {filteredData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={isClientSidePagination ? localTotalPages : totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalItems={isClientSidePagination ? localTotalItems : totalItems}
        />
      )}

      {/* Render Document Modal based on mode */}
      {isModalOpen && modalMode === 'view' && selectedDocumentId && (
        <DocumentViewerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          documentId={selectedDocumentId}
          callId={selectedCallId}
          onEditClick={handleEditClick}
        />
      )}
      
      {/* Render Create Document Modal */}
      {isModalOpen && modalMode === 'create' && selectedCallId && (
        <EditDocumentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          documentData={null}
          callId={selectedCallId}
          updateDocument={handleDocumentCreated}
        />
      )}
      
      {/* Render Edit Document Modal */}
      {isEditModalOpen && selectedDocumentId && (
        <EditDocumentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          documentData={selectedDocumentData}
          documentId={selectedDocumentId}
          callId={selectedCallId}
          updateDocument={handleDocumentCreated}
          mode="edit"
        />
      )}
    </div>
  );
};

export default CallsPage;
