import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import SearchableSelect from './SearchableSelect';
import { motion, AnimatePresence } from 'framer-motion';

const EditDocumentModal = ({ isOpen, onClose, documentData, documentId, updateDocument, callId, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    numePrenume: '',
    continutConsultatie: '',
    dataApel: new Date().toISOString().split('T')[0], // Default to today
    localitate: '',
    persFizica: false,
    persJuridica: false,
    agentEconomic: '',
    categorieProdus: '',
    categorieServiciu: '',
    detalii: '',
    statut: 0, // Default to "In Lucru"
  });

  // Reference data state variables
  const [cities, setCities] = useState([]);
  const [domains, setDomains] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);

  // State for form submission and document loading
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [loadedDocumentData, setLoadedDocumentData] = useState(null);
  
  // Track form field errors
  const [fieldErrors, setFieldErrors] = useState({});

  // Status options mapping
  const statusOptions = [
    { 
      value: 0, 
      label: 'In Lucru', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300', 
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
    { 
      value: 1, 
      label: 'Inchis', 
      color: 'bg-green-100 text-green-800 border-green-300', 
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
  ];

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoading(true);
        // Fetch all reference data concurrently using apiService
        const [
          citiesData,
          domainsData,
          businessesData,
          productsData,
          servicesData,
        ] = await Promise.all([
          apiService.refData.getCities(),
          apiService.refData.getDomains(),
          apiService.refData.getBusinesses(),
          apiService.refData.getProducts(),
          apiService.refData.getServices(),
        ]);

        setCities(formatSelectData(citiesData || []));
        setDomains(formatSelectData(domainsData || []));
        setBusinesses(formatSelectData(businessesData || []));
        setProducts(formatSelectData(productsData?.data || productsData || []));
        setServices(formatSelectData(servicesData || []));
      } catch (err) {
        console.error(err);
        setErrors(['Eroare la încărcarea datelor. Vă rugăm să încercați din nou.']);
      } finally {
        setLoading(false);
      }
    };

    fetchReferenceData();
  }, []);

  // Load document data from API if documentId is provided
  useEffect(() => {
    const fetchDocumentData = async () => {
      if (documentId && mode === 'view') {
        try {
          setLoading(true);
          const response = await apiService.get(`documents/${documentId}`);
          if (response) {
            setLoadedDocumentData(response);
          } else {
            setErrors(['Eroare la încărcarea documentului. Documentul nu a fost găsit.']);
          }
        } catch (err) {
          console.error('Error fetching document:', err);
          setErrors(['Eroare la încărcarea documentului. Vă rugăm să încercați din nou.']);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDocumentData();
  }, [documentId, mode]);

  // Initialize form data with document data (either passed directly or loaded from API)
  useEffect(() => {
    const dataToUse = documentData || loadedDocumentData;
    
    if (dataToUse) {
      // Map the status label to its corresponding value
      const statutValue = statusOptions.find(
        (option) => option.label === dataToUse.status || option.label === dataToUse.statut
      )?.value;

      setFormData({
        numePrenume: dataToUse.name || dataToUse.numePrenume || '',
        continutConsultatie: dataToUse.domain_id || '',
        dataApel: dataToUse.dataApel || new Date().toISOString().split('T')[0],
        localitate: dataToUse.city_id || '',
        persFizica: dataToUse.persFizica || false,
        persJuridica: dataToUse.persJuridica || false,
        agentEconomic: dataToUse.business_id || '',
        categorieProdus: dataToUse.product_id || '',
        categorieServiciu: dataToUse.service_id || '',
        detalii: dataToUse.details || dataToUse.detalii || '',
        statut: statutValue || 0, // Default to 0 (In Lucru) if status not found
      });
    }
  }, [documentData, loadedDocumentData, statusOptions]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]:
        type === 'checkbox' || type === 'radio'
          ? checked
            ? value
            : prevData[name]
          : value,
    }));
    
    // Clear error for this field when it's changed
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const {
      numePrenume,
      continutConsultatie,
      dataApel,
      localitate,
      agentEconomic,
      categorieProdus,
      categorieServiciu,
      detalii,
      statut,
    } = formData;

    const fieldErrorsObj = {};

    if (!numePrenume) {
      fieldErrorsObj.numePrenume = true;
    }
    
    if (!continutConsultatie) {
      fieldErrorsObj.continutConsultatie = true;
    }
    
    if (!dataApel) {
      fieldErrorsObj.dataApel = true;
    }
    
    if (!localitate) {
      fieldErrorsObj.localitate = true;
    }
    
    if (!formData.persFizica && !formData.persJuridica) {
      fieldErrorsObj.personType = true;
    }
    
    if (formData.persJuridica && !agentEconomic) {
      fieldErrorsObj.agentEconomic = true;
    }
    
    // Verificăm dacă cel puțin unul dintre Produs sau Serviciu este completat
    if (!categorieProdus && !categorieServiciu) {
      fieldErrorsObj.categorieProdus = true;
      fieldErrorsObj.categorieServiciu = true;
    }
    
    if (!detalii) {
      fieldErrorsObj.detalii = true;
    }
    
    if (statut === undefined || statut === null) {
      fieldErrorsObj.statut = true;
    }

    const hasErrors = Object.keys(fieldErrorsObj).length > 0;
    
    if (hasErrors) {
      setFieldErrors(fieldErrorsObj);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateForm()) {
      return;
    }
  
    setLoading(true);
    setSuccess(false);
  
    // Map formData to API fields
    const mappedData = {
      call_id: documentData ? documentData.call_id : callId,
      domain_id: formData.continutConsultatie ? parseInt(formData.continutConsultatie, 10) : null,
      city_id: formData.localitate ? parseInt(formData.localitate, 10) : null,
      business_id: formData.persJuridica && formData.agentEconomic ? parseInt(formData.agentEconomic, 10) : null,
      product_id: formData.categorieProdus ? parseInt(formData.categorieProdus, 10) : null,
      service_id: formData.categorieServiciu ? parseInt(formData.categorieServiciu, 10) : null,
      details: formData.detalii,
      status: parseInt(formData.statut, 10),
      name: formData.numePrenume,
    };
  
    try {
      let responseData;
      
      if (documentData) {
        // Update existing document
        responseData = await apiService.documents.update(documentData.nr, mappedData);
      } else {
        // Create new document
        responseData = await apiService.documents.create(mappedData);
      }
  
      const updatedDoc = {
        id: responseData.id,
        call_id: responseData.call_id,
        // Map other fields as needed...
      };
  
      setSuccess(true);
      updateDocument(updatedDoc);
  
      // Close the modal after success
      setTimeout(() => {
        onClose();
        // Reload the page after successful creation or update
        window.location.reload();
      }, 1200);
  
    } catch (err) {
      console.error(err);
      // În loc să setăm eroarea centralizat, setăm un mesaj pentru fiecare câmp
      const fieldErrorsObj = {};
      Object.keys(formData).forEach(key => {
        fieldErrorsObj[key] = true;
      });
      setFieldErrors(fieldErrorsObj);
    } finally {
      setLoading(false);
    }
  };
  

  // Handle delete document
  const handleDelete = async () => {
    if (!window.confirm('Sigur doriți să ștergeți acest document?')) return;

    setLoading(true);

    try {
      await apiService.documents.delete(documentData.nr);
      
      // Update parent component
      updateDocument(null, documentData.nr);
      onClose();
    } catch (error) {
      setErrors([error.message || 'Eroare la ștergerea documentului.']);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format data from API for select components
  const formatSelectData = (dataArray) => {
    if (!Array.isArray(dataArray)) return [];
    return dataArray.map(item => ({
      id: item.id,
      name: item.name || item.title || item.label || 'Unnamed'
    }));
  };
  
  // Step navigation with validation
  const goToNextStep = () => {
    // Validăm câmpurile pentru pasul curent
    const { numePrenume, continutConsultatie, dataApel, localitate } = formData;
    const currentStepErrors = {};
    
    // Validare pentru pasul 1
    if (activeStep === 1) {
      if (!numePrenume) {
        currentStepErrors.numePrenume = true;
      }
      
      if (!continutConsultatie) {
        currentStepErrors.continutConsultatie = true;
      }
      
      if (!dataApel) {
        currentStepErrors.dataApel = true;
      }
      
      if (!localitate) {
        currentStepErrors.localitate = true;
      }
      
      if (!formData.persFizica && !formData.persJuridica) {
        currentStepErrors.personType = true;
      }
    }
    
    // Validare pentru pasul 2 (doar pentru persoane juridice)
    if (activeStep === 2 && formData.persJuridica) {
      if (!formData.agentEconomic) {
        currentStepErrors.agentEconomic = true;
      }
    }
    
    // Dacă există erori, le afișăm și nu permitem navigarea la următorul pas
    if (Object.keys(currentStepErrors).length > 0) {
      setFieldErrors(prev => ({ ...prev, ...currentStepErrors }));
      return;
    }
    
    // Dacă nu sunt erori, navigăm la următorul pas
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
      // Resetăm erorile când trecem la următorul pas
      setFieldErrors({});
    }
  };
  
  const goToPreviousStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  // Modal animation variants
  const modalVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 50, transition: { duration: 0.2 } }
  };
  
  const getStepTitle = () => {
    switch (activeStep) {
      case 1: 
        return "Date Apel";
      case 2:
        return formData.persJuridica ? "Agent Economic" : "Conținut Apel";
      case 3:
        return "Conținut Apel";
      default:
        return "Date Apel";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex justify-between items-center bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {documentData ? 'Editare Document' : 'Creare Document'} 
                <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded-full">
                  Pasul {activeStep}/3: {getStepTitle()}
                </span>
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-1 rounded-full transition-colors duration-200"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 h-1">
              <div 
                className="bg-blue-500 h-1 transition-all duration-300 ease-in-out" 
                style={{ width: `${(activeStep / 3) * 100}%` }}
              ></div>
            </div>

            {/* Success Message */}
            <div className="px-6 pt-4">
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2 animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Documentul a fost {documentData ? 'actualizat' : 'creat'} cu succes!</span>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6">
              <div className="max-h-[calc(80vh-160px)] overflow-y-auto py-4 px-2 custom-scrollbar">
                {/* Step 1: Date Apel */}
                {activeStep === 1 && (
                  <div className="space-y-5">
                    {/* Nume și Prenume */}
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nume și Prenume <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="numePrenume"
                        value={formData.numePrenume}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border ${fieldErrors.numePrenume ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                        placeholder="Introduceți numele și prenumele"
                      />
                      {fieldErrors.numePrenume && (
                        <p className="mt-1 text-sm text-red-600">Acest câmp este obligatoriu</p>
                      )}
                    </div>

                    {/* Domeniul Consultatie */}
                    <div className="form-group">
                      <SearchableSelect
                        id="continutConsultatie"
                        name="continutConsultatie"
                        options={domains}
                        value={formData.continutConsultatie}
                        onChange={handleChange}
                        placeholder="Selectați domeniul..."
                        label="Domeniul Consultație"
                        required={true}
                        error={fieldErrors.continutConsultatie}
                      />
                      {fieldErrors.continutConsultatie && (
                        <p className="mt-1 text-sm text-red-600">Acest câmp este obligatoriu</p>
                      )}
                    </div>

                    {/* Data apelului */}
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data apelului <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="dataApel"
                        value={formData.dataApel}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border ${fieldErrors.dataApel ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                      />
                      {fieldErrors.dataApel && (
                        <p className="mt-1 text-sm text-red-600">Selectați data apelului</p>
                      )}
                    </div>

                    {/* Localitatea (CUATM) */}
                    <div className="form-group">
                      <SearchableSelect
                        id="localitate"
                        name="localitate"
                        options={cities}
                        value={formData.localitate}
                        onChange={handleChange}
                        placeholder="Selectați localitatea..."
                        label="Localitatea (CUATM)"
                        required={true}
                        error={fieldErrors.localitate}
                      />
                      {fieldErrors.localitate && (
                        <p className="mt-1 text-sm text-red-600">Acest câmp este obligatoriu</p>
                      )}
                    </div>

                    {/* Person Type */}
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tip Persoană <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className={`p-3 border ${fieldErrors.personType ? 'border-red-300' : 'border-gray-200'} ${
                            formData.persFizica ? 'bg-blue-50 border-blue-300' : 'bg-white'
                          } rounded-lg cursor-pointer hover:bg-blue-50 transition-colors`}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              persFizica: true,
                              persJuridica: false,
                              agentEconomic: ''
                            }));
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                <path d="M12 11a4 4 0 100-8 4 4 0 000 8zm0 2c-2.67 0-8 1.34-8 4v2a1 1 0 001 1h14a1 1 0 001-1v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                              <span className="text-sm font-medium">Persoană Fizică</span>
                            </div>
                            <div className={`h-4 w-4 rounded-full border ${
                              formData.persFizica 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300'
                            }`}>
                              {formData.persFizica && (
                                <span className="flex items-center justify-center h-full text-white text-xs">✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div
                          className={`p-3 border ${fieldErrors.personType ? 'border-red-300' : 'border-gray-200'} ${
                            formData.persJuridica ? 'bg-blue-50 border-blue-300' : 'bg-white'
                          } rounded-lg cursor-pointer hover:bg-blue-50 transition-colors`}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              persFizica: false,
                              persJuridica: true
                            }));
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
                              </svg>
                              <span className="text-sm font-medium">Persoană Juridică</span>
                            </div>
                            <div className={`h-4 w-4 rounded-full border ${
                              formData.persJuridica 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300'
                            }`}>
                              {formData.persJuridica && (
                                <span className="flex items-center justify-center h-full text-white text-xs">✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {fieldErrors.personType && (
                        <p className="mt-1 text-sm text-red-600">Selectați tipul persoanei</p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Statut <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {statusOptions.map(option => (
                          <div
                            key={option.value}
                            className={`p-3 border ${fieldErrors.statut ? 'border-red-300' : 'border-gray-200'} ${
                              parseInt(formData.statut, 10) === option.value ? option.color : 'bg-white'
                            } rounded-lg cursor-pointer hover:bg-gray-50 transition-colors`}
                            onClick={() => setFormData(prev => ({ ...prev, statut: option.value }))}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d={option.icon} />
                                </svg>
                                <span className="text-sm font-medium">{option.label}</span>
                              </div>
                              <div className={`h-4 w-4 rounded-full border ${
                                parseInt(formData.statut, 10) === option.value
                                  ? 'border-blue-500 bg-blue-500' 
                                  : 'border-gray-300'
                              }`}>
                                {parseInt(formData.statut, 10) === option.value && (
                                  <span className="flex items-center justify-center h-full text-white text-xs">✓</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {fieldErrors.statut && (
                        <p className="mt-1 text-sm text-red-600">Selectați statutul</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Agent Economic (only for persJuridica) */}
                {activeStep === 2 && formData.persJuridica && (
                  <div className="space-y-5 h-[50vh]">
                    <div className="form-group h-full flex flex-col">
                      <SearchableSelect
                        id="agentEconomic"
                        name="agentEconomic"
                        options={businesses}
                        value={formData.agentEconomic}
                        onChange={handleChange}
                        placeholder="Căutați după denumire sau IDNO..."
                        label="Agent economic Denumire / IDNO"
                        required={true}
                        error={fieldErrors.agentEconomic}
                      />
                      {fieldErrors.agentEconomic && (
                        <p className="mt-1 text-sm text-red-600">Acest câmp este obligatoriu</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2/3: Conținut Apel */}
                {((activeStep === 2 && !formData.persJuridica) || activeStep === 3) && (
                  <div className="space-y-5">
                    {/* Produs */}
                    <div className="form-group">
                      <SearchableSelect
                        id="categorieProdus"
                        name="categorieProdus"
                        options={products}
                        value={formData.categorieProdus}
                        onChange={handleChange}
                        placeholder="Căutați produs..."
                        label="Produs (Obligatoriu produs sau serviciu)"
                        required={false}
                        error={fieldErrors.categorieProdus}
                      />
                    </div>

                    {/* Serviciu */}
                    <div className="form-group">
                      <SearchableSelect
                        id="categorieServiciu"
                        name="categorieServiciu"
                        options={services}
                        value={formData.categorieServiciu}
                        onChange={handleChange}
                        placeholder="Căutați serviciu..."
                        label="Serviciu (Obligatoriu produs sau serviciu)"
                        required={false}
                        error={fieldErrors.categorieServiciu}
                      />
                    </div>

                    {/* Detalii consultație */}
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Detalii consultație <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="detalii"
                        value={formData.detalii}
                        onChange={handleChange}
                        rows={5}
                        className={`w-full px-3 py-2 border ${fieldErrors.detalii ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                        placeholder="Introduceți detalii despre consultație..."
                      ></textarea>
                      {fieldErrors.detalii && (
                        <p className="mt-1 text-sm text-red-600">Acest câmp este obligatoriu</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with navigation controls */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <div>
                  {documentData && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="text-red-500 hover:text-red-700 px-3 py-1 rounded transition-colors duration-200"
                      disabled={loading}
                    >
                      Șterge
                    </button>
                  )}
                </div>

                <div className="flex space-x-3">
                  {activeStep > 1 && (
                    <button
                      type="button"
                      onClick={goToPreviousStep}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      disabled={loading}
                    >
                      Înapoi
                    </button>
                  )}
                  
                  {(activeStep < 3 || (activeStep === 2 && !formData.persJuridica)) ? (
                    <button
                      type="button"
                      onClick={goToNextStep}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      disabled={loading}
                    >
                      Continuă
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors
                        ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Se salvează...
                        </span>
                      ) : 'Salvează Document'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditDocumentModal;