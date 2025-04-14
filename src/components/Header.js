import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDocument } from '../contexts/DocumentContext';
import { getApiUrl, getAuthHeaders } from '../services/apiUtils';
import './../App.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { openDocumentModal } = useDocument();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [liveSearchResults, setLiveSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showLiveResults, setShowLiveResults] = useState(false);
  const searchRef = useRef(null);

  // Handle clicks outside search results to close dropdown
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
  }, []);
  
  // Perform live search when search term changes
  useEffect(() => {
    const performLiveSearch = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setLiveSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      
      try {
        // Build URL for unified search
        const url = getApiUrl(`search?query=${encodeURIComponent(searchTerm)}`);
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
    
    const timer = setTimeout(() => {
      performLiveSearch();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Handle navigation to search result
  const navigateToResult = (result) => {
    setShowLiveResults(false);
    
    // Navigate based on result type
    if (result.type === 'call') {
      navigate(`/apeluri?call=${result.id}`);
    } else if (result.type === 'document') {
      navigate(`/documents/${result.id}`);
    } else if (result.type === 'contact') {
      navigate(`/contacte?contact=${result.id}`);
    }
  };
  
  // Determine page title based on current route
  const getTitle = () => {
    if (location.pathname === '/') return 'Statistică';
    if (location.pathname === '/apeluri') return 'Apeluri';
    if (location.pathname === '/contacte') return 'Contacte';
    if (location.pathname === '/documente') return 'Documente';
    if (location.pathname === '/new-document') return 'Document Nou';
    if (location.pathname === '/produse') return 'Produse';
    if (location.pathname === '/domenii') return 'Domenii';
    if (location.pathname === '/servicii') return 'Servicii';
    if (location.pathname === '/agenti-economici') return 'Agenți Economici';
    
    // Check if it's a document detail page
    if (location.pathname.startsWith('/documents/')) return 'Detalii Document';
    
    return 'PBX CRM'; // Default fallback
  };

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left section: Page title & breadcrumbs */}
        <div className="flex items-center">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">{getTitle()}</h1>
            <nav className="hidden text-sm text-gray-500 sm:block">
              <ol className="flex items-center space-x-1">
                <li className="flex items-center">
                  <span>PBX CRM</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </li>
                <li className="text-indigo-600 font-medium">{getTitle()}</li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Center: Search Bar with Live Search (expands on focus for mobile) */}
        <div 
          ref={searchRef}
          className={`relative mx-auto transition-all duration-300 ${
            searchFocused ? 'flex-grow max-w-2xl z-40' : 'w-auto max-w-xs'
          }`}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Căutare globală..."
              className={`pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 ${
                searchFocused ? 'w-full shadow-md' : 'w-48 lg:w-64'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                setSearchFocused(true);
                if (searchTerm.length >= 2) {
                  setShowLiveResults(true);
                }
              }}
              onClick={() => {
                if (searchTerm.length >= 2) {
                  setShowLiveResults(true);
                }
              }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            
            {!isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 hidden sm:flex items-center text-sm text-gray-500">
                <span className="bg-gray-200 px-1.5 py-0.5 rounded font-mono">⌘K</span>
              </div>
            )}
            
            {/* Live search results dropdown */}
            {showLiveResults && searchTerm.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 max-h-[80vh] overflow-y-auto">
                {liveSearchResults.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {liveSearchResults.map((result) => (
                      <li 
                        key={`${result.type}-${result.id}`}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigateToResult(result)}
                      >
                        <div className="flex items-center">
                          {/* Icon based on result type */}
                          <div className={`flex-shrink-0 p-2 rounded-full mr-3 ${
                            result.type === 'call' ? 'bg-blue-100 text-blue-600' :
                            result.type === 'document' ? 'bg-purple-100 text-purple-600' :
                            result.type === 'contact' ? 'bg-green-100 text-green-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {result.type === 'call' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            )}
                            {result.type === 'document' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                            {result.type === 'contact' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            )}
                          </div>
                          
                          {/* Result details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {result.title || result.name || result.phone || `${result.type} #${result.id}`}
                              </p>
                              <p className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                                {result.date && new Date(result.date).toLocaleDateString('ro-RO')}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {result.subtitle || result.description || result.details || 
                                (result.type === 'call' ? 'Apel telefonic' : 
                                 result.type === 'document' ? 'Document' : 
                                 result.type === 'contact' ? 'Contact' : '')}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Nu s-au găsit rezultate pentru "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* New Document Button */}
          <button 
            onClick={openDocumentModal}
            className="hidden sm:flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-sm btn-hover-effect"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Document Nou
          </button>
          
          {/* Mobile Document Button */}
          <button 
            onClick={openDocumentModal}
            className="sm:hidden flex items-center justify-center p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm btn-hover-effect"
            aria-label="Document Nou"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
