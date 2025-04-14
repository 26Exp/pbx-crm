import React, { useState, useEffect } from 'react';
import DocumentTable from './DocumentTable';
import BarChart from './BarChart';
import LineChart from './LineChart';
import { useDocument } from '../contexts/DocumentContext';
import apiService from '../services/api';

const DocumentPage = ({ documents }) => {
  const { openDocumentModal } = useDocument();
  const [statistics, setStatistics] = useState({
    total: 0,
    closed: 0,
    in_progress: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch statistics data from API
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.get('statistics');
        setStatistics({
          total: data.documents.total || 0,
          closed: data.documents.closed || 0,
          in_progress: data.documents.in_progress || 0
        });
      } catch (err) {
        console.error("Error fetching statistics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-gray-50 max-w-full overflow-hidden">
      {/* Header section with stats cards */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Gestionare Documente</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stats Card 1 - Total Documente */}
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 font-medium">Total Documente</h3>
                <p className="text-xl sm:text-2xl font-bold">
                  {isLoading ? (
                    <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    statistics.total
                  )}
                </p>
              </div>
              <div className="bg-blue-100 p-2 sm:p-3 rounded-full text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Stats Card 2 - Documente Închise */}
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-green-500 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 font-medium">Documente Închise</h3>
                <p className="text-xl sm:text-2xl font-bold">
                  {isLoading ? (
                    <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    statistics.closed
                  )}
                </p>
              </div>
              <div className="bg-green-100 p-2 sm:p-3 rounded-full text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Stats Card 3 - În Lucru */}
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 font-medium">În Lucru</h3>
                <p className="text-xl sm:text-2xl font-bold">
                  {isLoading ? (
                    <span className="inline-block w-12 h-8 bg-gray-200 animate-pulse rounded"></span>
                  ) : (
                    statistics.in_progress
                  )}
                </p>
              </div>
              <div className="bg-yellow-100 p-2 sm:p-3 rounded-full text-yellow-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Stats Card 4 - Add Document Card */}
          <div 
            onClick={openDocumentModal}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-sm p-3 sm:p-4 text-white hover:shadow-md transition-all duration-200 cursor-pointer">
            <div className="flex justify-between items-center h-full">
              <div>
                <h3 className="text-xs sm:text-sm text-white/90 font-medium">Adaugă Document Nou</h3>
                <p className="text-xl sm:text-2xl font-bold">Creează</p>
              </div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-full text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
