import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ProfileImg from './../assets/profile.jpg';
import {
  ChartBarSquareIcon,
  DocumentIcon,
  PhoneIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import './../App.css';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import config from '../config';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', email: '' });
  const [nomenclatoareOpen, setNomenclatoareOpen] = useState(false);
  const [activityCounts, setActivityCounts] = useState({
    inchis: 0,
    respins: 0,
    calls: 0, // Add this field for number of calls
  });

  const { logout, user: authUser } = useAuth(); // Use authentication context
  
  useEffect(() => {
    const storedUser = localStorage.getItem(config.auth.userKey);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (authUser) {
      setUser(authUser);
    }
  }, [authUser]);

  // Auto-expand the Nomenclatoare menu if we're on any nomenclator page
  useEffect(() => {
    if (location.pathname === '/produse' || 
        location.pathname === '/domenii' ||
        location.pathname === '/servicii' ||
        location.pathname === '/agenti-economici') {
      setNomenclatoareOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchActivityCounts = async () => {
      try {
        // Use our API service to get data
        const [documentsData, callsData] = await Promise.all([
          apiService.documents.getAll(),
          apiService.get('calls/all')
        ]);
  
        // Count statuses for documents
        const inchisCount = documentsData.filter((item) => item.status === 'Inchis').length;
        const respinsCount = documentsData.filter((item) => item.status === 'Respins').length;
  
        // Count total calls correctly
        const callsCount = Array.isArray(callsData.data) ? callsData.data.length : 
                          (Array.isArray(callsData) ? callsData.length : 0);
  
        setActivityCounts({
          inchis: inchisCount,
          respins: respinsCount,
          calls: callsCount, // Set the correct number of calls
        });
      } catch (error) {
        console.error('Error fetching activity data:', error);
      }
    };
  
    fetchActivityCounts();
  }, []);
  

  const handleLogout = async () => {
    try {
      // Use our auth context to handle logout
      await logout();
      // Navigation is handled by the auth context
    } catch (error) {
      console.error('An error occurred during logout:', error);
    }
  };

  return (
    <>
      <div
        className={`fixed md:static inset-y-0 left-0 w-80 h-max-screen bg-[#1E293B] p-5 flex flex-col justify-between transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out md:translate-x-0 z-40`}
      >
        <div>
          {/* Logo */}
          <div className="text-white text-2xl font-bold mb-8">LOGO</div>

          {/* Profile */}
          <div className="bg-gray-700 p-4 rounded-lg flex items-center relative space-x-4 mb-8">
            <img src={ProfileImg} alt="Admin" className="rounded-full h-12 w-12" />
            <div>
              <p className="text-gray-200 font-medium">{user.name || 'Guest'}</p>
              <p className="text-gray-200 text-sm break-all w-full">{user.email || 'guest@example.com'}</p>
              <button className="text-red-500 hover:underline mt-2" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <ul className="remove-padding text-white flex flex-col space-y-4">
            <li className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition duration-200 ${location.pathname === '/' ? 'bg-gray-700' : ''}`}>
              <ChartBarSquareIcon className="h-6 w-6" />
              <Link to="/" className="flex-1 text-white no-underline">
                Statistică
              </Link>
            </li>

            <li className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition duration-200 ${location.pathname === '/documente' ? 'bg-gray-700' : ''}`}>
              <DocumentIcon className="h-6 w-6" />
              <Link to="/documente" className="flex-1 text-white no-underline">
                Documente
              </Link>
            </li>

            <li className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition duration-200 ${location.pathname === '/apeluri' ? 'bg-gray-700' : ''}`}>
              <PhoneIcon className="h-6 w-6" />
              <Link to="/apeluri" className="flex-1 text-white no-underline">
                Apeluri
              </Link>
            </li>

            {/* Nomenclatoare submenu */}
            <li className="flex flex-col">
              <div 
                className={`flex items-center justify-between space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition duration-200 ${
                  location.pathname === '/produse' || location.pathname === '/domenii' ? 'bg-gray-700' : ''
                }`}
                onClick={() => setNomenclatoareOpen(!nomenclatoareOpen)}
              >
                <div className="flex items-center space-x-3">
                  <BookOpenIcon className="h-6 w-6" />
                  <span className="flex-1 text-white">Nomenclatoare</span>
                </div>
                {nomenclatoareOpen ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </div>
              
              {nomenclatoareOpen && (
                <ul className="ml-6 mt-2 space-y-2">
                  <li className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition duration-200 ${
                    location.pathname === '/produse' ? 'bg-gray-700' : ''
                  }`}>
                    <Link to="/produse" className="text-white no-underline flex-1">
                      Produse
                    </Link>
                  </li>
                  <li className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition duration-200 ${
                    location.pathname === '/domenii' ? 'bg-gray-700' : ''
                  }`}>
                    <Link to="/domenii" className="text-white no-underline flex-1">
                      Domenii
                    </Link>
                  </li>
                  <li className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition duration-200 ${
                    location.pathname === '/servicii' ? 'bg-gray-700' : ''
                  }`}>
                    <Link to="/servicii" className="text-white no-underline flex-1">
                      Servicii
                    </Link>
                  </li>
                  <li className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition duration-200 ${
                    location.pathname === '/agenti-economici' ? 'bg-gray-700' : ''
                  }`}>
                    <Link to="/agenti-economici" className="text-white no-underline flex-1">
                      Agenți Economici
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </div>

        {/* Footer Section */}
        <div className="mt-auto">
          <div className="flex items-center text-green-400 mb-2">
            <span className="h-3 w-3 rounded-full bg-green-400 mr-2"></span>
            <span>Activități Închise ( {activityCounts.inchis} )</span>
          </div>
          <div className="flex items-center text-red-400 mb-2">
            <span className="h-3 w-3 rounded-full bg-red-400 mr-2"></span>
            <span>Activități Respinse ( {activityCounts.respins} )</span>
          </div>
          {/* Add number of calls */}
          <div className="flex items-center text-blue-400">
            <span className="h-3 w-3 rounded-full bg-blue-400 mr-2"></span>
            <span>Număr de Apeluri ( {activityCounts.calls} )</span> {/* Show total number of calls */}
          </div>
          
        </div>

        {/* Overlay for mobile */}
        {isOpen && (
          <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={toggleSidebar}></div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
