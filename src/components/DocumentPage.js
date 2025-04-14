import React from 'react';
import DocumentTable from './DocumentTable';
import BarChart from './BarChart';
import LineChart from './LineChart';
import { useDocument } from '../contexts/DocumentContext';

const DocumentPage = ({ documents }) => {
  const { openDocumentModal } = useDocument();
  return (
    <div className="p-2 sm:p-4 md:p-6 bg-gray-50 max-w-full overflow-hidden">
      {/* Header section with stats cards */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Gestionare Documente</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stats Card 1 */}
          <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Documente</p>
                <p className="text-2xl font-bold text-gray-800">67</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full text-blue-500 text-xl">
                📄
              </div>
            </div>
          </div>
          
          {/* Stats Card 2 */}
          <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-green-500 hover:shadow-md transition-shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Documente Închise</p>
                <p className="text-2xl font-bold text-gray-800">42</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full text-green-500 text-xl">
                ✅
              </div>
            </div>
          </div>
          
          {/* Stats Card 3 */}
          <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">În Lucru</p>
                <p className="text-2xl font-bold text-gray-800">25</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full text-yellow-500 text-xl">
                ⏳
              </div>
            </div>
          </div>
          
          {/* Stats Card 4 - Add Document Card */}
          <div 
            onClick={openDocumentModal}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-sm p-5 text-white hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex justify-between items-center h-full">
              <div>
                <p className="text-sm font-medium">Adaugă Document Nou</p>
                <p className="text-lg mt-1">Creează rapid</p>
              </div>
              <div className="bg-white/20 p-3 rounded-full text-white text-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content section */}
      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200 max-w-full">
        <DocumentTable documents={documents} />
      </div>

      {/* Document Creation Modal is now handled by DocumentContext */}
    </div>
  );
};

export default DocumentPage;
