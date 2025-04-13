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
    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pb-8">
      {/* Items per page selector */}
      <div className="flex items-center mb-3 sm:mb-0">
        <span className="text-sm text-gray-600 mr-2">
          Afișează:
        </span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="border border-gray-300 rounded p-1 text-sm"
        >
          {itemsPerPageOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        
        <span className="text-sm text-gray-600 ml-4">
          {totalItems > 0 ? (
            <>
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} din {totalItems}
            </>
          ) : (
            '0 rezultate'
          )}
        </span>
      </div>
      
      {/* Pagination controls */}
      <div className="flex">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 border border-gray-300 rounded-l 
                      ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          aria-label="First page"
        >
          &laquo;
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 border-t border-b border-gray-300
                      ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          aria-label="Previous page"
        >
          &lsaquo;
        </button>
        
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-3 py-1 border-t border-b border-gray-300 
                        ${currentPage === number ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
          >
            {number}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 border-t border-b border-gray-300
                      ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
          aria-label="Next page"
        >
          &rsaquo;
        </button>
        
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 border border-gray-300 rounded-r
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