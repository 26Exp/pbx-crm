import React, { useEffect, useState } from 'react';
import { CSVLink } from "react-csv";  // Import CSVLink for export
import BarChart from './BarChart';    // BarChart component
import LineChart from './LineChart';  // LineChart component
import TopLocalitiesChart from './TopLocalitiesChart'; // New chart components
import TopProductsChart from './TopProductsChart';
import TopServicesChart from './TopServicesChart';
import apiService from '../services/api';

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  
  const [isBarChartDataLoaded, setIsBarChartDataLoaded] = useState(false);
  const [isLineChartDataLoaded, setIsLineChartDataLoaded] = useState(false);
  const [isTopLocalitiesDataLoaded, setIsTopLocalitiesDataLoaded] = useState(false);
  const [isTopProductsDataLoaded, setIsTopProductsDataLoaded] = useState(false);
  const [isTopServicesDataLoaded, setIsTopServicesDataLoaded] = useState(false);

  // Fetch statistics data from API
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.get('statistics');
        setStatistics(data);
        
        // Store the data for each chart to be shared with CSV export
        window.barChartData = [
          { status: 'Total', count: data.documents.total },
          { status: 'Închise', count: data.documents.closed },
          { status: 'În Lucru', count: data.documents.in_progress },
        ];
        setIsBarChartDataLoaded(true);
        
        window.lineChartData = data.monthly_evolution.map(month => ({
          date: month.label,
          count: month.total,
          in_progress: month.in_progress,
          closed: month.closed
        }));
        setIsLineChartDataLoaded(true);
        
        window.topLocalitiesData = data.top_cities.map(city => ({
          locality: city.name,
          count: city.count
        }));
        setIsTopLocalitiesDataLoaded(true);
        
        window.topProductsData = data.top_products.map(product => ({
          product: product.name,
          count: product.count
        }));
        setIsTopProductsDataLoaded(true);
        
        window.topServicesData = data.top_services.map(service => ({
          service: service.name,
          count: service.count
        }));
        setIsTopServicesDataLoaded(true);
        
      } catch (err) {
        console.error("Error fetching statistics:", err);
        setError("Nu s-au putut încărca statisticile. Încercați din nou mai târziu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-indigo-200 mb-4"></div>
          <div className="text-indigo-500 text-lg font-medium">Se încarcă statisticile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center max-w-lg">
          <svg className="h-12 w-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-medium text-red-800 mb-2">Eroare</h2>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
          >
            Reîncercați
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-gray-50 overflow-hidden">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Statistică Generală</h1>
        
        {/* Stats Cards - Using real data from the API */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 font-medium">Total Documente</h3>
                <p className="text-xl sm:text-2xl font-bold">{statistics?.documents.total || 0}</p>
              </div>
              <div className="bg-blue-100 p-2 sm:p-3 rounded-full text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 font-medium">Documente Închise</h3>
                <p className="text-xl sm:text-2xl font-bold">{statistics?.documents.closed || 0}</p>
              </div>
              <div className="bg-green-100 p-2 sm:p-3 rounded-full text-green-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs sm:text-sm text-gray-500 font-medium">În Lucru</h3>
                <p className="text-xl sm:text-2xl font-bold">{statistics?.documents.in_progress || 0}</p>
              </div>
              <div className="bg-yellow-100 p-2 sm:p-3 rounded-full text-yellow-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {isBarChartDataLoaded && (
            <CSVLink
              data={window.barChartData}
              headers={[
                { label: 'Status', key: 'status' },
                { label: 'Count', key: 'count' }
              ]}
              filename="document_status_data.csv"
              className="flex items-center text-sm bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-2 px-3 rounded shadow-sm hover:from-blue-700 hover:to-indigo-800 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Statistică Statut
            </CSVLink>
          )}

          {isLineChartDataLoaded && (
            <CSVLink
              data={window.lineChartData}
              headers={[
                { label: 'Lună', key: 'date' },
                { label: 'Total', key: 'count' },
                { label: 'În lucru', key: 'in_progress' },
                { label: 'Închise', key: 'closed' }
              ]}
              filename="monthly_evolution_data.csv"
              className="flex items-center text-sm bg-gradient-to-r from-green-600 to-teal-700 text-white py-2 px-3 rounded shadow-sm hover:from-green-700 hover:to-teal-800 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Statistică Lunară
            </CSVLink>
          )}
          
          {isTopLocalitiesDataLoaded && (
            <CSVLink
              data={window.topLocalitiesData}
              headers={[
                { label: 'Localitate', key: 'locality' },
                { label: 'Număr Documente', key: 'count' }
              ]}
              filename="top_localities_data.csv"
              className="flex items-center text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-3 rounded shadow-sm hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Top Localități
            </CSVLink>
          )}
          
          {isTopProductsDataLoaded && (
            <CSVLink
              data={window.topProductsData}
              headers={[
                { label: 'Produs', key: 'product' },
                { label: 'Număr Reclamații', key: 'count' }
              ]}
              filename="top_products_data.csv"
              className="flex items-center text-sm bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-2 px-3 rounded shadow-sm hover:from-teal-700 hover:to-emerald-700 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Top Produse
            </CSVLink>
          )}
          
          {isTopServicesDataLoaded && (
            <CSVLink
              data={window.topServicesData}
              headers={[
                { label: 'Serviciu', key: 'service' },
                { label: 'Număr Reclamații', key: 'count' }
              ]}
              filename="top_services_data.csv"
              className="flex items-center text-sm bg-gradient-to-r from-amber-600 to-orange-600 text-white py-2 px-3 rounded shadow-sm hover:from-amber-700 hover:to-orange-700 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Top Servicii
            </CSVLink>
          )}
        </div>
      </div>
      
      {/* Primary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Statistica Status (Bar Chart) */}
        <div className="bg-white shadow-sm rounded-lg p-3 sm:p-4 md:p-5 overflow-hidden">
          <div className="h-[300px] sm:h-[350px] w-full">
            <BarChart statisticsData={statistics} />
          </div>
        </div>

        {/* Statistica Lunară (Line Chart) */}
        <div className="bg-white shadow-sm rounded-lg p-3 sm:p-4 md:p-5 overflow-hidden">
          <div className="h-[300px] sm:h-[350px] w-full">
            <LineChart statisticsData={statistics} />
          </div>
        </div>
      </div>
      
      {/* Secondary Charts - Top */}
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 mt-2">Top Statistici</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Top Localități */}
        <div className="bg-white shadow-sm rounded-lg p-3 sm:p-4 md:p-5 overflow-hidden">
          <div className="h-[280px] sm:h-[300px] w-full">
            <TopLocalitiesChart statisticsData={statistics} />
          </div>
        </div>
        
        {/* Top Produse */}
        <div className="bg-white shadow-sm rounded-lg p-3 sm:p-4 md:p-5 overflow-hidden">
          <div className="h-[280px] sm:h-[300px] w-full">
            <TopProductsChart statisticsData={statistics} />
          </div>
        </div>
        
        {/* Top Servicii */}
        <div className="bg-white shadow-sm rounded-lg p-3 sm:p-4 md:p-5 overflow-hidden">
          <div className="h-[280px] sm:h-[300px] w-full">
            <TopServicesChart statisticsData={statistics} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
