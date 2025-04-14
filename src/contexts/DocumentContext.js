import React, { createContext, useState, useContext } from 'react';
import EditDocumentModal from '../components/EditDocumentModal';

// Create the context
const DocumentContext = createContext(null);

export const DocumentProvider = ({ children }) => {
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  
  // Open document creation modal
  const openDocumentModal = () => {
    setIsDocumentModalOpen(true);
  };
  
  // Close document creation modal
  const closeDocumentModal = () => {
    setIsDocumentModalOpen(false);
  };
  
  // Handle document creation
  const handleDocumentCreated = (newDocument) => {
    // Refresh the page after document creation to show updated data
    // In a more sophisticated implementation, you might update state instead
    window.location.reload();
  };

  const contextValue = {
    openDocumentModal,
    closeDocumentModal
  };

  return (
    <DocumentContext.Provider value={contextValue}>
      {children}
      
      {/* Global document creation modal */}
      {isDocumentModalOpen && (
        <EditDocumentModal
          isOpen={isDocumentModalOpen}
          onClose={closeDocumentModal}
          documentData={null}
          updateDocument={handleDocumentCreated}
          callId={1} // Using a default call ID for document creation
        />
      )}
    </DocumentContext.Provider>
  );
};

// Custom hook to use the document context
export const useDocument = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
};

export default DocumentContext;