import React, { useState, useRef, useEffect } from 'react';

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Caută...', 
  name, 
  id,
  required = false,
  label,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Find the selected option
  const selectedOption = options.find(option => option.id === value) || null;

  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Select an option
  const handleSelect = (optionId) => {
    onChange({ target: { name, value: optionId } });
    setIsOpen(false);
    setSearchTerm('');
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  // Clear selection
  const clearSelection = (e) => {
    e.stopPropagation();
    onChange({ target: { name, value: '' } });
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {label && (
        <label htmlFor={id} className="block mb-1">
          {label}
        </label>
      )}
      
      {/* Selected display / Search input */}
      <div 
        className={`border rounded p-2 w-full flex justify-between items-center cursor-pointer ${error ? 'border-red-500' : 'border-gray-300'}`}
        onClick={toggleDropdown}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="outline-none w-full"
            placeholder={placeholder}
            autoComplete="off"
          />
        ) : (
          <div className="truncate">
            {selectedOption ? selectedOption.name : placeholder}
          </div>
        )}
        
        <div className="flex items-center">
          {selectedOption && !isOpen && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-gray-400 hover:text-gray-600 mr-2"
            >
              ×
            </button>
          )}
          <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </div>
      
      {/* Dropdown options */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-2 text-gray-500">Nu s-au găsit rezultate</div>
          ) : (
            filteredOptions.map(option => (
              <div
                key={option.id}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                  option.id === value ? 'bg-blue-100' : ''
                }`}
                onClick={() => handleSelect(option.id)}
              >
                {option.name}
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Hidden input for form submission */}
      <input 
        type="hidden" 
        name={name} 
        id={id} 
        value={value || ''} 
        required={required} 
      />
    </div>
  );
};

export default SearchableSelect;