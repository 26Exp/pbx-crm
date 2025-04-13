import React, { useState, useEffect, useRef } from 'react';
import apiService from '../services/api';
import Table from './Table';
import Pagination from './Pagination';
import config from '../config';
import { useAuth } from '../contexts/AuthContext';

const DomainsPage = () => {
  // Get auth context to check user role
  const { user } = useAuth();
  
  // Create refs for input fields
  const addInputRef = useRef(null);
  const editInputRef = useRef(null);
  
  // Create a ref to track if we're currently editing to prevent focus loss
  const isEditingRef = useRef(false);

  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(config.pagination.defaultPageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDomain, setEditingDomain] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState([]);
  
  // Check if the user has delete permissions
  const canDelete = user && user.role_id !== 3;

  // Form state for adding/editing domains - simplified to only include name
  const [formData, setFormData] = useState({
    name: ''
  });

  const columns = [
    { 
      key: 'id', 
      header: 'ID', 
      width: '60px' 
    },
    { 
      key: 'name', 
      header: 'Denumire Domeniu', 
      render: (row) => (
        <button 
          className="text-blue-600 hover:underline"
          onClick={() => handleEditDomain(row)}
        >
          {row.name}
        </button>
      ) 
    },
    {
      key: 'actions',
      header: 'Acțiuni',
      render: (row) => (
        <div className="flex space-x-2">
          <button 
            onClick={() => handleEditDomain(row)} 
            className="text-blue-500 hover:text-blue-700"
            title="Editează"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {canDelete && (
            <button 
              onClick={() => handleDeleteClick(row)} 
              className="text-red-500 hover:text-red-700"
              title="Șterge"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )
    }
  ];

  // Only fetch domains when these dependencies change, not on every render
  useEffect(() => {
    console.log("Fetching domains with:", { currentPage, itemsPerPage, searchTerm });
    fetchDomains();
  }, [currentPage, itemsPerPage, searchTerm]);
  
  // Effect to handle closing modals
  useEffect(() => {
    // Reset editing state when modals close
    if (!isAddModalOpen && !isEditModalOpen) {
      isEditingRef.current = false;
    }
  }, [isAddModalOpen, isEditModalOpen]);
  
  // Create a custom controlled input component to maintain focus
  const ControlledInput = React.memo(({ inputRef, ...props }) => {
    // Use a callback ref to combine our ref with the inputRef
    const setRef = (element) => {
      inputRef.current = element;
      
      // Focus the element once it's mounted
      if (element) {
        setTimeout(() => {
          element.focus();
          // Set cursor position to the end
          const length = element.value.length;
          element.setSelectionRange(length, length);
        }, 0);
      }
    };
    
    return <input ref={setRef} {...props} />;
  });

  const fetchDomains = async () => {
    setLoading(true);
    try {
      // Construct query parameters for API request - using Laravel pagination format
      const params = `?page=${currentPage}&per_page=${itemsPerPage}${searchTerm ? `&search=${searchTerm}` : ''}`;
      
      // Use our API service to fetch domains
      const response = await apiService.get(`domains${params}`);
      
      console.log("API Response:", response); // Debug log
      
      // Laravel pagination response format
      if (response && response.data) {
        // Extract pagination data from Laravel response
        setDomains(response.data);
        setTotalItems(response.total || 0);
        setTotalPages(response.last_page || 1);
        setCurrentPage(response.current_page || 1); // Ensure we're on the right page
        
        console.log("Pagination data:", {
          currentPage: response.current_page,
          lastPage: response.last_page,
          total: response.total,
          itemsCount: response.data.length
        });
      } else if (Array.isArray(response)) {
        // For non-paginated API responses (direct array)
        const totalItems = response.length;
        const maxPage = Math.max(1, Math.ceil(totalItems / itemsPerPage));
        
        // Handle pagination client-side
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const paginatedData = response.slice(startIndex, endIndex);
        
        setDomains(paginatedData);
        setTotalItems(totalItems);
        setTotalPages(maxPage);
        
        // Adjust current page if out of bounds
        if (currentPage > maxPage) {
          setCurrentPage(maxPage);
        }
      } else {
        // Fallback for empty or invalid response
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      
      // Use dummy data as a fallback
      const dummyData = generateDummyDomains(36); // Match API example count
      const totalItems = dummyData.length;
      const maxPage = Math.max(1, Math.ceil(totalItems / itemsPerPage));
      
      // Filter if search term exists
      const filteredData = searchTerm
        ? dummyData.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : dummyData;
      
      const filteredTotal = filteredData.length;
      const filteredMaxPage = Math.max(1, Math.ceil(filteredTotal / itemsPerPage));
      
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, filteredTotal);
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setDomains(paginatedData);
      setTotalItems(filteredTotal);
      setTotalPages(filteredMaxPage);
      
      // Adjust current page if out of bounds
      if (currentPage > filteredMaxPage) {
        setCurrentPage(filteredMaxPage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to generate dummy domain data - simplified to match API
  const generateDummyDomains = (count) => {
    // Generate more dummy domains to demonstrate pagination better
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Domeniu ${i + 1}${i % 5 === 0 ? ' (Special)' : ''}`
    }));
  };

  // Pagination handlers with safeguards
  const handlePageChange = (newPage) => {
    console.log("Page change requested:", newPage, "Current total pages:", totalPages);
    
    // Ensure page is within valid bounds
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    } else if (newPage < 1) {
      setCurrentPage(1);
    } else if (newPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    console.log("Items per page changed to:", newItemsPerPage);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Search handler
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Form handlers optimized to maintain focus
  const handleInputChange = (e) => {
    e.preventDefault(); // Prevent default to ensure focus is maintained
    
    const { name, value } = e.target;
    
    // Set editing ref to true to indicate we're in an edit operation
    isEditingRef.current = true;
    
    // Use functional update to avoid dependency on previous state
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear any existing errors when typing
    if (formErrors.length > 0) {
      setFormErrors([]);
    }
    
    // Use a timeout to focus back on the element if needed
    setTimeout(() => {
      if (isEditingRef.current) {
        // Focus the appropriate input based on which modal is open
        if (isAddModalOpen && addInputRef.current) {
          addInputRef.current.focus();
        } else if (isEditModalOpen && editInputRef.current) {
          editInputRef.current.focus();
          
          // Position cursor at the end of the text
          const length = editInputRef.current.value.length;
          editInputRef.current.setSelectionRange(length, length);
        }
      }
    }, 0);
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) {
      errors.push('Denumirea domeniului este obligatorie');
    }
    
    setFormErrors(errors);
    return errors.length === 0;
  };

  // CRUD operations
  const handleAddDomain = () => {
    // Only reset form data if needed
    if (formData.name !== '') {
      setFormData({
        name: ''
      });
    }
    
    if (formErrors.length > 0) {
      setFormErrors([]);
    }
    
    setIsAddModalOpen(true);
  };

  const handleEditDomain = (domain) => {
    // Reset editing ref when opening the modal
    isEditingRef.current = false;
    
    setEditingDomain(domain);
    setFormData({
      name: domain.name
    });
    
    if (formErrors.length > 0) {
      setFormErrors([]);
    }
    
    setIsEditModalOpen(true);
    
    // Focus the edit input after a short delay to ensure the modal is rendered
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        
        // Position cursor at the end of text
        const length = editInputRef.current.value.length;
        editInputRef.current.setSelectionRange(length, length);
      }
    }, 50);
  };

  const handleDeleteClick = (domain) => {
    // Check if user has permission to delete
    if (!canDelete) {
      console.warn('User does not have permission to delete domains');
      return;
    }
    
    setEditingDomain(domain);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    
    // Clear editing state
    isEditingRef.current = false;
    
    if (!validateForm()) {
      // Focus the name input field if validation fails
      if (addInputRef.current) {
        addInputRef.current.focus();
      }
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API to create domain - simplified to only include name
      await apiService.post('domains', formData);
      
      // Refresh the domains list
      await fetchDomains();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error creating domain:', error);
      setFormErrors([error.message || 'An error occurred while creating the domain']);
      setLoading(false);
      
      // Focus the name input field after error
      if (addInputRef.current) {
        addInputRef.current.focus();
      }
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    
    // Clear editing state
    isEditingRef.current = false;
    
    if (!validateForm()) {
      // Focus the name input field if validation fails
      if (editInputRef.current) {
        editInputRef.current.focus();
        // Position cursor at the end
        const length = editInputRef.current.value.length;
        editInputRef.current.setSelectionRange(length, length);
      }
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API to update domain - simplified to only include name
      await apiService.patch(`domains/${editingDomain.id}`, formData);
      
      // Refresh the domains list
      await fetchDomains();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating domain:', error);
      setFormErrors([error.message || 'An error occurred while updating the domain']);
      setLoading(false);
      
      // Focus the name input field after error
      if (editInputRef.current) {
        editInputRef.current.focus();
        // Position cursor at the end
        const length = editInputRef.current.value.length;
        editInputRef.current.setSelectionRange(length, length);
      }
    }
  };

  const handleConfirmDelete = async () => {
    // Double-check permission in case component state changed
    if (!canDelete) {
      console.warn('User does not have permission to delete domains');
      setIsDeleteModalOpen(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API to delete the domain
      await apiService.delete(`domains/${editingDomain.id}`);
      
      // Close the modal first to give immediate visual feedback
      setIsDeleteModalOpen(false);
      
      // Then refresh the domains list
      await fetchDomains();
    } catch (error) {
      console.error('Error deleting domain:', error);
      // Keep modal open on error to allow retry
      setLoading(false);
    } finally {
      // Always ensure loading state is reset
      setLoading(false);
    }
  };

  // Modal components
  const AddDomainModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Adăugare Domeniu Nou</h2>
        
        {formErrors.length > 0 && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
            <ul className="list-disc pl-5">
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <form onSubmit={handleSubmitAdd}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="add-name-input">
              Denumire *
            </label>
            <ControlledInput
              id="add-name-input"
              inputRef={addInputRef}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoComplete="off"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              Anulare
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? 'Se adaugă...' : 'Adaugă Domeniu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const EditDomainModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Editare Domeniu</h2>
        
        {formErrors.length > 0 && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
            <ul className="list-disc pl-5">
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <form onSubmit={handleSubmitEdit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="edit-name-input">
              Denumire *
            </label>
            <ControlledInput
              id="edit-name-input"
              inputRef={editInputRef}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoComplete="off"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              Anulare
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? 'Se salvează...' : 'Salvează Modificările'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Confirmare Ștergere</h2>
        
        <p className="mb-6">
          Sunteți sigur că doriți să ștergeți domeniul "{editingDomain?.name}"? Această acțiune este ireversibilă.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
            disabled={loading}
            type="button"
          >
            Anulare
          </button>
          <button
            onClick={() => {
              // Call the delete handler with a callback for any cleanup needed
              handleConfirmDelete();
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            disabled={loading}
            type="button"
          >
            {loading ? 'Se șterge...' : 'Șterge Domeniul'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Lista Domenii</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
          <div>
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              onClick={handleAddDomain}
            >
              Adaugă Domeniu
            </button>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Caută domenii..." 
              className="w-full md:w-64 border rounded px-4 py-2"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Încărcare domenii...</p>
          </div>
        ) : domains.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'Nu s-au găsit domenii pentru căutarea curentă.' : 'Nu există domenii. Adăugați un domeniu nou.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column) => (
                      <th 
                        key={column.key}
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={column.width ? { width: column.width } : {}}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {domains.map((domain) => (
                    <tr key={domain.id} className="hover:bg-gray-50">
                      {columns.map((column) => (
                        <td key={`${domain.id}-${column.key}`} className="px-6 py-4 whitespace-nowrap">
                          {column.render ? column.render(domain) : domain[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 px-4 py-2">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                totalItems={totalItems}
              />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && <AddDomainModal />}
      {isEditModalOpen && <EditDomainModal />}
      {isDeleteModalOpen && <DeleteConfirmationModal />}
    </div>
  );
};

export default DomainsPage;