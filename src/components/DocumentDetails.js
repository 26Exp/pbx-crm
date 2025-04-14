// DocumentDetails.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../services/api';
import { getApiUrl, getAuthHeaders, fetchAllPages, formatRecordUrl } from '../services/apiUtils';

// AudioPlayer component
const AudioPlayer = ({ url, duration }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handlePlayPause = () => {
    if (error) return; // Don't do anything if there's an error
    
    if (audioRef.current) {
      setLoading(true);
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setLoading(false);
      } else {
        // Play and handle any errors
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setLoading(false);
            })
            .catch(err => {
              console.error('Error playing audio:', err);
              setError(true);
              setLoading(false);
            });
        }
      }
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const audioDuration = audioRef.current.duration || 0;
      
      if (!isNaN(audioDuration) && audioDuration > 0) {
        setCurrentTime(formatTime(current));
        setProgress((current / audioDuration) * 100);
      }
      
      if (current === audioDuration) {
        setIsPlaying(false);
      }
    }
  };
  
  const handleProgressChange = (e) => {
    if (audioRef.current && audioRef.current.duration) {
      const newTime = (e.target.value / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(e.target.value);
    }
  };
  
  const handleLoadedMetadata = () => {
    setLoading(false);
    if (audioRef.current) {
      setCurrentTime(formatTime(0));
    }
  };
  
  const handleError = () => {
    setLoading(false);
    setError(true);
    console.error('Error loading audio file');
  };
  
  // Format the displayed duration - use API provided duration or the actual audio duration
  const displayDuration = formatTime(duration);
  
  return (
    <div className="flex items-center space-x-2 w-full max-w-sm">
      <button
        onClick={handlePlayPause}
        disabled={loading || error}
        className={`flex-shrink-0 ${error ? 'text-red-500' : loading ? 'text-gray-400' : 'text-indigo-600 hover:text-indigo-800'} focus:outline-none`}
      >
        {error ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        ) : loading ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      
      <div className="flex-grow flex items-center space-x-2">
        <span className="text-xs text-gray-600 w-8">{currentTime}</span>
        <div className="flex-grow">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            disabled={!isPlaying || loading || error}
            className={`w-full h-1.5 ${error ? 'bg-red-200' : 'bg-gray-200'} rounded-full appearance-none cursor-pointer accent-indigo-600`}
          />
        </div>
        <span className="text-xs text-gray-600 w-8">{displayDuration}</span>
      </div>
      
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
        preload="metadata"
      />
    </div>
  );
};

const DocumentDetails = () => {
  const { documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nume: '',
    detalii: '',
    domeniu: '',
    produs: '',
    serviciu: '',
    localitate: '',
    statut: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Lookup maps
  const [citiesMap, setCitiesMap] = useState({});
  const [domainsMap, setDomainsMap] = useState({});
  const [businessesMap, setBusinessesMap] = useState({});
  const [servicesMap, setServicesMap] = useState({});
  const [productsMap, setProductsMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use API service to fetch document data
        const documentData = await apiService.documents.getById(documentId);
        console.log("Document data:", documentData);

        // Fetch related entities using our fetchAllPages utility
        const [citiesData, domainsData, businessesData, servicesData, productsData] = await Promise.all([
          apiService.refData.getCities(),
          apiService.refData.getDomains(),
          apiService.refData.getBusinesses(),
          apiService.refData.getServices(),
          apiService.refData.getProducts()
        ]);

        // Create lookup maps
        const citiesLookup = {};
        citiesData.forEach((city) => {
          citiesLookup[city.id] = city.name;
        });
        setCitiesMap(citiesLookup);

        const domainsLookup = {};
        domainsData.forEach((domain) => {
          domainsLookup[domain.id] = domain.name;
        });
        setDomainsMap(domainsLookup);

        const businessesLookup = {};
        businessesData.forEach((business) => {
          businessesLookup[business.id] = business.name;
        });
        setBusinessesMap(businessesLookup);

        const servicesLookup = {};
        servicesData.forEach((service) => {
          servicesLookup[service.id] = service.name;
        });
        setServicesMap(servicesLookup);
        
        const productsLookup = {};
        productsData.forEach((product) => {
          productsLookup[product.id] = product.name;
        });
        setProductsMap(productsLookup);

        // Map document data to include names instead of IDs
        const doc = documentData.data || documentData;
        const mappedDocument = {
          nr: doc.id,
          statut: doc.status,
          nrDeIesire: doc.institution_id,
          continutConsultatie: domainsLookup[doc.domain_id] || `ID: ${doc.domain_id}`,
          dataApel: doc.created_at ? doc.created_at.split('T')[0] : 'N/A',
          localitate: citiesLookup[doc.city_id] || `ID: ${doc.city_id}`,
          persFizica: doc.business_id === null,
          persJuridica: doc.business_id !== null,
          agentEconomic: doc.business_id ? businessesLookup[doc.business_id] || `ID: ${doc.business_id}` : 'N/A',
          categorieInformatie: servicesLookup[doc.service_id] || `ID: ${doc.service_id}`,
          categorieProdus: productsLookup[doc.product_id] || `ID: ${doc.product_id}`,
          detalii: doc.details,
          domain_id: doc.domain_id,
          city_id: doc.city_id,
          business_id: doc.business_id,
          service_id: doc.service_id,
          product_id: doc.product_id,
          nume: doc.name,
          call: doc.call,
          user: doc.user,
          // Directly map related entities if they exist in the API response
          domainName: doc.domain?.name || domainsLookup[doc.domain_id] || `ID: ${doc.domain_id}`,
          cityName: doc.city?.name || citiesLookup[doc.city_id] || `ID: ${doc.city_id}`,
          businessName: doc.business?.name || (doc.business_id ? businessesLookup[doc.business_id] : 'N/A'),
          serviceName: doc.service?.name || servicesLookup[doc.service_id] || `ID: ${doc.service_id}`,
          productName: doc.product?.name || productsLookup[doc.product_id] || `ID: ${doc.product_id}`,
        };

        setDocument(mappedDocument);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Eroare la încărcarea documentului. Vă rugăm să încercați din nou.');
        setLoading(false);
      }
    };

    fetchData();
  }, [documentId]);
  
  // Initialize edit form with current document data
  useEffect(() => {
    if (document && isEditing) {
      setEditForm({
        nume: document.nume || '',
        detalii: document.detalii || '',
        domeniu: document.domain_id || '',
        produs: document.product_id || '',
        serviciu: document.service_id || '',
        localitate: document.city_id || '',
        statut: document.statut || ''
      });
    }
  }, [document, isEditing]);
  
  // Handle saving edited document
  const handleSaveDocument = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      // Prepare data for API
      const updateData = {
        name: editForm.nume,
        details: editForm.detalii,
        domain_id: editForm.domeniu,
        product_id: editForm.produs || null,
        service_id: editForm.serviciu || null,
        city_id: editForm.localitate,
        status: editForm.statut
      };
      
      // Call API to update document
      await apiService.documents.update(document.nr, updateData);
      
      // Show success state
      setSubmitSuccess(true);
      
      // Reload the data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error updating document:', err);
      setSubmitError(err.message || 'A apărut o eroare la actualizarea documentului. Vă rugăm să încercați din nou.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle form field changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <div className="p-4">Încarcă...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-4">
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          Documentul nu a fost găsit.
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          {isEditing ? 'Editare document' : `Document #${document.nr}`}
        </h1>
        <p className="text-gray-500 text-sm mb-6">Creat la {document.dataApel}</p>
        
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Informații generale</h2>
              <div className="flex items-center space-x-3">
                <span
                  className={`py-1 px-3 rounded-full text-sm ${
                    document.statut === 'Inchis'
                      ? 'bg-green-100 text-green-600'
                      : document.statut === 'Respins'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {document.statut}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-sm font-medium">Editare</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {isEditing ? (
              // Edit Form
              <form onSubmit={handleSaveDocument}>
                {submitError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {submitError}
                  </div>
                )}
                
                {submitSuccess && (
                  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                    Documentul a fost actualizat cu succes! Se reîncarcă pagina...
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Date personale</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" htmlFor="nume">Nume & Prenume</label>
                        <input
                          type="text"
                          id="nume"
                          name="nume"
                          value={editForm.nume}
                          onChange={handleEditChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" htmlFor="localitate">Localitate</label>
                        <select
                          id="localitate"
                          name="localitate"
                          value={editForm.localitate}
                          onChange={handleEditChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Selectați localitatea</option>
                          {Object.entries(citiesMap).map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Operator</p>
                        <p className="font-medium">{document.user?.name || 'N/A'}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Persoană Fizică</p>
                          <p className="font-medium">{document.persFizica ? 'Da' : 'Nu'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Persoană Juridică</p>
                          <p className="font-medium">{document.persJuridica ? 'Da' : 'Nu'}</p>
                        </div>
                      </div>
                      
                      {document.persJuridica && (
                        <div>
                          <p className="text-xs text-gray-500">Agent Economic</p>
                          <p className="font-medium">{document.businessName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Categorii</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" htmlFor="domeniu">Domeniu Consultație</label>
                        <select
                          id="domeniu"
                          name="domeniu"
                          value={editForm.domeniu}
                          onChange={handleEditChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Selectați domeniul</option>
                          {Object.entries(domainsMap).map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" htmlFor="produs">Categorie Produs</label>
                        <select
                          id="produs"
                          name="produs"
                          value={editForm.produs}
                          onChange={handleEditChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Fără categorie produs</option>
                          {Object.entries(productsMap).map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" htmlFor="serviciu">Categorie Serviciu</label>
                        <select
                          id="serviciu"
                          name="serviciu"
                          value={editForm.serviciu}
                          onChange={handleEditChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Fără categorie serviciu</option>
                          {Object.entries(servicesMap).map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1" htmlFor="statut">Statut</label>
                        <select
                          id="statut"
                          name="statut"
                          value={editForm.statut}
                          onChange={handleEditChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="In Lucru">În Lucru</option>
                          <option value="Inchis">Închis</option>
                          <option value="Respins">Respins</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-600 mb-2" htmlFor="detalii">Detalii consultație</label>
                  <textarea
                    id="detalii"
                    name="detalii"
                    value={editForm.detalii}
                    onChange={handleEditChange}
                    rows="5"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  ></textarea>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={submitting}
                  >
                    Anulează
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center ${
                      submitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Salvare...
                      </>
                    ) : (
                      'Salvează modificările'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // View Mode
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Date personale</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Nume & Prenume</p>
                        <p className="font-medium">{document.nume || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Localitate</p>
                        <p className="font-medium">{document.cityName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Operator</p>
                        <p className="font-medium">{document.user?.name || 'N/A'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Persoană Fizică</p>
                          <p className="font-medium">{document.persFizica ? 'Da' : 'Nu'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Persoană Juridică</p>
                          <p className="font-medium">{document.persJuridica ? 'Da' : 'Nu'}</p>
                        </div>
                      </div>
                      {document.persJuridica && (
                        <div>
                          <p className="text-xs text-gray-500">Agent Economic</p>
                          <p className="font-medium">{document.businessName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Categorii</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Domeniu Consultație</p>
                        <p className="font-medium">{document.domainName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Categorie Produs</p>
                        <p className="font-medium">{document.productName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Categorie Serviciu</p>
                        <p className="font-medium">{document.serviceName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Detalii consultație</h3>
                  <p className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-gray-700">{document.detalii || 'Fără detalii'}</p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Call Information Card */}
        {document.call && (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Informații apel</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Număr client</p>
                    <p className="font-medium">{document.call.client || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Via număr</p>
                    <p className="font-medium">{document.call.via || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Data și ora</p>
                    <p className="font-medium">{document.call.start || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Durata apel</p>
                    <p className="font-medium">{document.call.duration ? `${document.call.duration} secunde` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Timp de așteptare</p>
                    <p className="font-medium">{document.call.wait ? `${document.call.wait} secunde` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tip apel</p>
                    <p className="font-medium">
                      <span className={`py-1 px-2 rounded-full text-xs ${
                        document.call.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {document.call.type === 'in' ? 'Intrare' : 'Ieșire'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {document.call.record && (
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Înregistrare apel</h3>
                  <AudioPlayer 
                    url={formatRecordUrl(document.call.record)} 
                    duration={document.call.duration} 
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <a 
            href="/documents" 
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Înapoi la lista de documente
          </a>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editează documentul
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;
