import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ProfileImg from './../assets/profile.jpg';
import './../App.css';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import config from '../config';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', email: '' });
  const [nomenclatoareOpen, setNomenclatoareOpen] = useState(false);
  const [activityCounts, setActivityCounts] = useState({
    inchis: 0,
    respins: 0,
    calls: 0,
  });
  
  // Refs pentru animații și interacțiuni
  const sidebarRef = useRef(null);

  const { logout, user: authUser } = useAuth();
  
  useEffect(() => {
    const storedUser = localStorage.getItem(config.auth.userKey);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (authUser) {
      setUser(authUser);
    }
  }, [authUser]);

  // Determinăm automat dacă trebuie să deschidem meniul Nomenclatoare
  useEffect(() => {
    const nomenclatorePaths = ['/produse', '/domenii', '/servicii', '/agenti-economici'];
    if (nomenclatorePaths.some(path => location.pathname === path)) {
      setNomenclatoareOpen(true);
    }
  }, [location.pathname]);

  // Încărcăm datele de activitate pentru badge-uri
  useEffect(() => {
    const fetchActivityCounts = async () => {
      try {
        const [documentsData, callsData] = await Promise.all([
          apiService.documents.getAll(),
          apiService.get('calls/all')
        ]);
  
        const inchisCount = documentsData.filter(item => item.status === 'Inchis').length;
        const respinsCount = documentsData.filter(item => item.status === 'Respins').length;
        const callsCount = Array.isArray(callsData.data) ? callsData.data.length : 
                          (Array.isArray(callsData) ? callsData.length : 0);
  
        setActivityCounts({
          inchis: inchisCount,
          respins: respinsCount,
          calls: callsCount,
        });
      } catch (error) {
        console.error('Error fetching activity data:', error);
      }
    };
  
    fetchActivityCounts();
  }, []);

  // Removed sidebar collapsing functionality

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('An error occurred during logout:', error);
    }
  };

  // Set fixed margin for content on mount
  useEffect(() => {
    const contentWrapper = document.getElementById('content-wrapper');
    if (contentWrapper) {
      contentWrapper.style.marginLeft = '288px'; // 288px = 72*4 (w-72)
    }
  }, []);

  // Meniul aplicației
  const menuItems = [
    { 
      path: '/', 
      name: 'Statistică',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      badge: null
    },
    { 
      path: '/documente', 
      name: 'Documente',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      badge: activityCounts.inchis + activityCounts.respins
    },
    { 
      path: '/apeluri', 
      name: 'Apeluri',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      badge: activityCounts.calls
    }
  ];

  // Meniul pentru nomenclatoare
  const nomenclatoareItems = [
    { path: '/produse', name: 'Produse' },
    { path: '/domenii', name: 'Domenii' },
    { path: '/servicii', name: 'Servicii' },
    { path: '/agenti-economici', name: 'Agenți Economici' },
  ];

  return (
    <>
      {/* Sidebar principal */}
      <div
        ref={sidebarRef}
        className="fixed inset-y-0 left-0 w-72 h-screen bg-[#111827] shadow-2xl flex flex-col justify-between z-40 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header Sidebar cu Logo și buton de colapsare */}
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-gradient-to-r from-[#4776E6] to-[#8E54E9] rounded-xl p-2 shadow-md transform hover:scale-105 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-xl tracking-wider">PBX</span>
                <span className="text-[#8E54E9] text-xs font-medium tracking-widest">CRM</span>
              </div>
            </div>
            {/* Removed collapse button */}
          </div>

          {/* Profil utilizator */}
          <div className="p-5 border-b border-gray-800">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="rounded-full p-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                  <img src={ProfileImg} alt="Profile" className="rounded-full h-12 w-12 border-2 border-gray-900" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-gray-900 shadow-lg"></div>
              </div>
              <div className="flex-1 min-w-0 flex items-center">
                <div className="flex flex-col">
                  <p className="text-white font-semibold tracking-wide truncate">{user.name || 'John Doe'}</p>
                  <div className="flex items-center mt-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2"></div>
                    <p className="text-gray-300 text-xs font-medium">Online</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Meniu principal */}
          <nav className="flex-1 px-3 py-5 overflow-y-auto dark-scrollbar">
            <div className="mb-2 px-3">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Navigare</p>
            </div>
            <ul className="space-y-1.5">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`group flex items-center px-3 py-2.5 rounded-md transition-all duration-200 relative sidebar-link
                    ${location.pathname === item.path 
                      ? 'bg-gradient-to-r from-indigo-500/40 to-purple-500/40 text-white shadow-inner border border-indigo-600/30' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                  >
                    <div className={`${
                      location.pathname === item.path 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                        : 'bg-gray-800 text-gray-400 group-hover:text-white'
                      } rounded-md p-1.5 mr-3`}
                    >
                      {item.icon}
                    </div>
                    <span className={`font-medium text-sm ${
                      location.pathname === item.path ? 'font-semibold' : ''
                    }`}>{item.name}</span>
                  </Link>
                </li>
              ))}

              <div className="mt-6 mb-2 px-3">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Nomenclatoare</p>
              </div>
              {/* Nomenclatoare submenu */}
              <li className="relative">
                <div 
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-md transition-all duration-200 cursor-pointer
                  ${['/produse', '/domenii', '/servicii', '/agenti-economici'].some(path => location.pathname === path) 
                    ? 'bg-gradient-to-r from-indigo-500/40 to-purple-500/40 text-white shadow-inner border border-indigo-600/30' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                  onClick={() => setNomenclatoareOpen(!nomenclatoareOpen)}
                >
                  <div className="flex items-center">
                    <div className={`${
                      ['/produse', '/domenii', '/servicii', '/agenti-economici'].some(path => location.pathname === path)
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                        : 'bg-gray-800 text-gray-400 group-hover:text-white'
                      } rounded-md p-1.5 mr-3`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Nomenclatoare</span>
                  </div>
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center bg-gray-800/60 transition-transform duration-300 ${nomenclatoareOpen ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Submenu items for Nomenclatoare with animation*/}
                <div 
                  className={`mt-1 transition-all duration-300 ease-in-out overflow-hidden pl-1 ${
                    nomenclatoareOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                  style={{ 
                    transitionProperty: 'max-height, opacity, margin',
                    transitionDuration: '300ms, 250ms, 250ms',
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <ul className="space-y-1 ml-2 bg-gray-800/30 rounded-md py-1.5 pl-3 pr-1.5 border-l border-gray-700/50">
                    {nomenclatoareItems.map((item) => (
                      <li key={item.path}>
                        <Link 
                          to={item.path} 
                          className={`group flex items-center py-2 px-2 text-sm rounded-md transition-all duration-200 sidebar-link ${
                            location.pathname === item.path 
                              ? 'text-white bg-gradient-to-r from-indigo-500/30 to-purple-500/30 shadow-inner border border-indigo-600/30' 
                              : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                          }`}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full mr-2.5 ${
                            location.pathname === item.path 
                              ? 'bg-indigo-400' 
                              : 'bg-gray-600 group-hover:bg-gray-400'
                          }`}></div>
                          <span className={location.pathname === item.path ? 'font-medium' : ''}>{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            </ul>
          </nav>

          {/* User actions */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Acțiuni</p>
            </div>
            <div className="flex justify-center">
              <button 
                onClick={handleLogout}
                className="flex flex-col items-center justify-center p-2.5 bg-rose-600/10 hover:bg-rose-500/20 rounded-md text-rose-400 hover:text-rose-300 transition-colors w-full" 
                title="Deconectare"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-xs font-medium">Ieșire</span>
              </button>
            </div>
            <div className="mt-6 bg-gray-800/50 rounded-lg border border-gray-700/30 p-4 shadow-lg shadow-gray-900/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-gray-100 font-semibold text-xs">PBX CRM</div>
                    <div className="text-gray-500 text-[10px]">© 2025</div>
                  </div>
                </div>
                <div className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded text-indigo-300 uppercase tracking-wider shadow-sm">
                  Premium
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
