import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDocument } from '../contexts/DocumentContext';
import './../App.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { openDocumentModal } = useDocument();
  const [searchFocused, setSearchFocused] = useState(false);

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

        {/* Center: Search Bar (expands on focus for mobile) */}
        <div className={`relative mx-auto transition-all duration-300 ${
          searchFocused ? 'flex-grow max-w-2xl z-10' : 'w-auto max-w-xs'
        }`}>
          <div className="relative">
            <input
              type="text"
              placeholder="Căutare..."
              className={`pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 ${
                searchFocused ? 'w-full shadow-md' : 'w-48 lg:w-64'
              }`}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 hidden sm:flex items-center text-sm text-gray-500">
              <span className="bg-gray-200 px-1.5 py-0.5 rounded font-mono">⌘K</span>
            </div>
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
