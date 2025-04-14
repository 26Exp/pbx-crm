import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage, 
  onItemsPerPageChange, 
  totalItems 
}) => {
  // Generate page numbers array
  const pageNumbers = [];
  const maxVisiblePages = 5; // Maximum number of visible page links
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  // Adjust if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  
  // Options for items per page dropdown
  const itemsPerPageOptions = [5, 10, 20, 50, 100];
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pb-6 gap-3">
      {/* Items per page selector */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <div className="flex items-center">
          <span className="text-xs sm:text-sm text-gray-600 mr-2 whitespace-nowrap">
            Afișează:
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded py-1 px-2 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        
        <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
          {totalItems > 0 ? (
            <>
              <span className="bg-gray-100 py-1 px-2 rounded">
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} din {totalItems}
              </span>
            </>
          ) : (
            <span className="bg-gray-100 py-1 px-2 rounded">0 rezultate</span>
          )}
        </span>
      </div>
      
      {/* Pagination controls - Responsive design */}
      <div className="flex items-center space-x-1 w-full sm:w-auto justify-center sm:justify-end">
        {/* First page - Hidden on mobile */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`hidden sm:block px-2 py-1 border border-gray-300 rounded-l 
                      ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          aria-label="First page"
        >
          &laquo;
        </button>
        
        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-2 sm:px-3 py-1 border border-gray-300 ${!pageNumbers.includes(1) ? 'rounded-l' : ''} sm:rounded-none
                      ${currentPage === 1 ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-100'}`}
          aria-label="Previous page"
        >
          &lsaquo;
        </button>
        
        {/* Page numbers - Responsive */}
        <div className="hidden sm:flex">
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`px-2 sm:px-3 py-1 border border-gray-300 
                        ${currentPage === number ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-100'}`}
            >
              {number}
            </button>
          ))}
        </div>
        
        {/* Current page indicator on mobile */}
        <div className="flex sm:hidden items-center">
          <span className="px-3 py-1 bg-indigo-600 text-white border border-indigo-600 font-medium">
            {currentPage}
          </span>
        </div>
        
        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-2 sm:px-3 py-1 border border-gray-300 ${!pageNumbers.includes(totalPages) ? 'rounded-r' : ''} sm:rounded-none
                      ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-100'}`}
          aria-label="Next page"
        >
          &rsaquo;
        </button>
        
        {/* Last page - Hidden on mobile */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`hidden sm:block px-2 py-1 border border-gray-300 rounded-r
                      ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          aria-label="Last page"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
};

export default Pagination;