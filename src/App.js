import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HomePage from './components/HomePage'; // Statistica page
import CallsPage from './components/CallsPage'; // Apeluri page
import RequireAuth from './components/RequireAuth';
import NewDocumentForm from './NewDocumentForm';  // NewDocumentForm as a separate page
import DocumentPage from './components/DocumentPage';
import LoginPage from './LoginPage';  // Import LoginPage
import Crud from './components/Crud';
import DocumentDetails from './components/DocumentDetails';
import NotFound from './components/NotFound'; // Import NotFound page
import ProductsPage from './components/ProductsPage'; // Import ProductsPage
import DomainsPage from './components/DomainsPage'; // Import DomainsPage
import ServicesPage from './components/ServicesPage'; // Import ServicesPage
import BusinessPage from './components/BusinessPage'; // Import BusinessPage
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setUnauthorizedCallback } from './services/api';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState([]); // Moved document state here

  // Function to toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Function to add a new document
  const addDocument = (newDoc) => {
    setDocuments((prevDocuments) => [
      ...prevDocuments,
      { ...newDoc, nr: prevDocuments.length + 1, statut: 'Deschisă' },  // Default to 'Deschisă'
    ]);
  };

  return (
    <Router>
      <AuthProvider>
        <MainApp 
          isSidebarOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar} 
          addDocument={addDocument} 
          documents={documents}  // Pass documents and addDocument down
        />
      </AuthProvider>
    </Router>
  );
}

// Separate component to access the Router's useLocation and auth context
function MainApp({ isSidebarOpen, toggleSidebar, addDocument, documents }) {
  const location = useLocation();
  const { handleUnauthorized, isAuthenticated, loading } = useAuth();
  
  // Set the unauthorized callback to redirect to login
  useEffect(() => {
    setUnauthorizedCallback(handleUnauthorized);
  }, [handleUnauthorized]);

  // Check if the current route is '/login'
  const isLoginPage = location.pathname === '/login';
  
  // Check for 404 route (wildcard route)
  const is404Page = !['/', '/login', '/apeluri', '/documente', '/new-document', '/produse', '/domenii', '/servicii', '/agenti-economici'].includes(location.pathname) && 
                    !location.pathname.startsWith('/documents/');
  
  // Show loading state while checking auth
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Încărcare...</div>;
  }
  
  // For 404 or other standalone pages, render them directly without layout
  if (is404Page) {
    return (
      <Routes>
        <Route path="*" element={<NotFound standalone={true} />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Only render Sidebar and Header if not on the login page */}
      {!isLoginPage && <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />}
      <div className="flex-1 flex flex-col">
        {!isLoginPage && <Header toggleSidebar={toggleSidebar} />}
        <div className="flex-1 p-2">
          <Routes>
            <Route path="/" element={
               <RequireAuth>
                 <HomePage />
               </RequireAuth>
              } />
            <Route path="/login" element={<LoginPage />} /> {/* Login route without sidebar/header */}
            <Route path="/apeluri" element={
               <RequireAuth>
                 <CallsPage />
               </RequireAuth>
              } />
            
            {/* Document page */}
            <Route path="/documente" element={
              <RequireAuth>
                <DocumentPage documents={documents} />
              </RequireAuth>
              } />
            
            {/* NewDocumentForm as a separate page */}
            <Route 
              path="/new-document" 
              element={
                <RequireAuth>
                  <NewDocumentForm addDocument={addDocument} />
                </RequireAuth>
            }  // Pass addDocument to the form
            />

            <Route exact path="/documents/:documentId" element={
              <RequireAuth>
                <DocumentDetails />
              </RequireAuth>
              } />

            {/* Products page route */}
            <Route path="/produse" element={
              <RequireAuth>
                <ProductsPage />
              </RequireAuth>
              } />
            
            {/* Domains page route */}
            <Route path="/domenii" element={
              <RequireAuth>
                <DomainsPage />
              </RequireAuth>
              } />
            
            {/* Services page route */}
            <Route path="/servicii" element={
              <RequireAuth>
                <ServicesPage />
              </RequireAuth>
              } />
            
            {/* Business page route */}
            <Route path="/agenti-economici" element={
              <RequireAuth>
                <BusinessPage />
              </RequireAuth>
              } />
              
            {/* 404 Not Found - This route must be last (still in layout) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
