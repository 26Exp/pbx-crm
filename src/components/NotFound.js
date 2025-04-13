import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import notFoundImage from '../assets/not-found.svg';

const NotFound = ({ standalone = false }) => {
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    navigate(-1); // Go back to the previous page
  };
  
  // Apply a different style for standalone mode (full screen without layout)
  const containerStyle = standalone 
    ? "fixed inset-0 w-full h-full bg-gradient-to-b from-gray-50 to-blue-50 z-50" 
    : "bg-gray-50";
    
  // For standalone mode, add a brand element
  const BrandLogo = standalone && (
    <div className="absolute top-5 left-5">
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">P</div>
        <div className="ml-2 text-blue-800 font-semibold">CRM</div>
      </div>
    </div>
  );
  
  // Custom layout without header and sidebar
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${containerStyle}`}>
      {BrandLogo}
      <img src={notFoundImage} alt="Pagină negăsită" className="w-64 sm:w-80 md:w-96 mb-8" />
      
      <div className="text-6xl md:text-9xl font-bold text-gray-200 absolute opacity-30 z-0">404</div>
      
      <h1 className="mt-4 text-2xl font-bold text-gray-800 mb-4 z-10">Pagină negăsită</h1>
      
      <p className="text-gray-600 text-center max-w-md mb-8 z-10">
        Ne pare rău, pagina pe care o căutați nu există sau a fost mutată.
      </p>
      
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 z-10">
        <button
          onClick={handleGoBack}
          className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition duration-300 flex items-center justify-center"
        >
          <span className="material-icons mr-2">arrow_back</span>
          Înapoi
        </button>
        
        <Link
          to="/"
          className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-300 flex items-center justify-center"
        >
          <span className="material-icons mr-2">home</span>
          Pagina Principală
        </Link>

      </div>
      
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Dacă crezi că aceasta este o eroare, te rugăm să contactezi administratorul.</p>
      </div>
    </div>
  );
};

export default NotFound;