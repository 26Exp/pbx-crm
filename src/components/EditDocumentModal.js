import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { getApiUrl, getAuthHeaders, fetchAllPages } from '../services/apiUtils';
import config from '../config';
import SearchableSelect from './SearchableSelect';

const EditDocumentModal = ({ isOpen, onClose, documentData, updateDocument, callId }) => {
  const [formData, setFormData] = useState({
    numePrenume: '',
    continutConsultatie: '',
    dataApel: '',
    localitate: '',
    persFizica: false,
    persJuridica: false,
    agentEconomic: '',
    categorieProdus: '',
    categorieServiciu: '',
    detalii: '',
    status: 1, // Default status value
  });

  // Reference data state variables
  const [cities, setCities] = useState([]);
  const [domains, setDomains] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);

  // State for form submission
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);

  // Status options mapping
  const statusOptions = [
    { value: 1, label: 'Inchis' },
    { value: 2, label: 'Respins' },
    { value: 3, label: 'Rezolvat' },
  ];

  // We're now using the fetchAllPages utility from our apiUtils.js

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
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
          apiService.get('products'),
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
      }
    };

    fetchReferenceData();
  }, []);

  // Initialize form data with the document data
  useEffect(() => {
    if (documentData) {
      // Map the status label to its corresponding value
      const statusValue = statusOptions.find(
        (option) => option.label === documentData.statut
      )?.value;

      setFormData({
        numePrenume: documentData.numePrenume || '',
        continutConsultatie: documentData.domain_id || '',
        dataApel: documentData.dataApel || '',
        localitate: documentData.city_id || '',
        persFizica: documentData.persFizica || false,
        persJuridica: documentData.persJuridica || false,
        agentEconomic: documentData.business_id || '',
        categorieProdus: documentData.product_id || '',
        categorieServiciu: documentData.service_id || '',
        detalii: documentData.detalii || '',
        status: statusValue || 1, // Default to 1 if status not found
      });
    }
  }, [documentData]);

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
  };
  
  // Track form field errors
  const [fieldErrors, setFieldErrors] = useState({});

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
      status,
    } = formData;

    const newErrors = [];
    const fieldErrorsObj = {};

    if (!numePrenume) {
      newErrors.push('Vă rugăm să completați Nume și Prenume.');
      fieldErrorsObj.numePrenume = true;
    }
    
    if (!continutConsultatie) {
      newErrors.push('Vă rugăm să selectați Domeniul Consultație.');
      fieldErrorsObj.continutConsultatie = true;
    }
    
    if (!dataApel) {
      newErrors.push('Vă rugăm să selectați Data apelului.');
      fieldErrorsObj.dataApel = true;
    }
    
    if (!localitate) {
      newErrors.push('Vă rugăm să selectați Localitatea (CUATM).');
      fieldErrorsObj.localitate = true;
    }
    
    if (!formData.persFizica && !formData.persJuridica) {
      newErrors.push('Vă rugăm să selectați tipul persoanei (Fizică sau Juridică).');
      fieldErrorsObj.personType = true;
    }
    
    if (formData.persJuridica && !agentEconomic) {
      newErrors.push('Vă rugăm să selectați Agent Economic pentru Persoană Juridică.');
      fieldErrorsObj.agentEconomic = true;
    }
    
    if (!categorieProdus) {
      newErrors.push('Vă rugăm să selectați Categorie Produs.');
      fieldErrorsObj.categorieProdus = true;
    }
    
    if (!categorieServiciu) {
      newErrors.push('Vă rugăm să selectați Categorie Serviciu.');
      fieldErrorsObj.categorieServiciu = true;
    }
    
    if (!detalii) {
      newErrors.push('Vă rugăm să completați Detalii consultație.');
      fieldErrorsObj.detalii = true;
    }
    
    if (!status) {
      newErrors.push('Vă rugăm să selectați Statusul.');
      fieldErrorsObj.status = true;
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setFieldErrors(fieldErrorsObj);
      return false;
    }

    setErrors([]);
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
    setErrors([]);
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
      status: parseInt(formData.status, 10),
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
  
      // Close the modal
      onClose();
  
      // Reload the page after successful creation or update
      window.location.reload();
  
    } catch (err) {
      console.error(err);
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

  return (
    isOpen && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative max-h-full overflow-y-auto">
          <button
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            onClick={onClose}
          >
            &times;
          </button>
          <h2 className="text-xl font-semibold mb-4">
            {documentData ? 'Editare Document' : 'Creare Document'}
          </h2>

          {/* Display success or error messages */}
          {success && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
              Documentul a fost {documentData ? 'actualizat' : 'creat'} cu succes!
            </div>
          )}
          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              <ul className="list-disc pl-5">
                {errors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Scrollable content */}
            <div className="max-h-[70vh] overflow-y-auto">
              {/* Form fields */}
              {/* 1. Date Apel Section */}
              <div className="bg-sky-100 p-6 rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-4">1. Date Apel</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nume și Prenume */}
                  <div>
                    <label htmlFor="numePrenume" className="block mb-1">
                      *Nume și Prenume
                    </label>
                    <input
                      id="numePrenume"
                      type="text"
                      name="numePrenume"
                      value={formData.numePrenume}
                      onChange={handleChange}
                      className="border rounded p-2 w-full"
                      required
                    />
                  </div>

                  {/* Domeniul Consultatie - searchable select */}
                  <div>
                    <SearchableSelect
                      id="continutConsultatie"
                      name="continutConsultatie"
                      options={domains}
                      value={formData.continutConsultatie}
                      onChange={handleChange}
                      placeholder="Selectați domeniul..."
                      label="*Domeniul Consultație"
                      required={true}
                      error={fieldErrors.continutConsultatie}
                    />
                  </div>

                  {/* Data apelului */}
                  <div>
                    <label htmlFor="dataApel" className="block mb-1">
                      *Data apelului
                    </label>
                    <input
                      id="dataApel"
                      type="date"
                      name="dataApel"
                      value={formData.dataApel}
                      onChange={handleChange}
                      className="border rounded p-2 w-full"
                      required
                    />
                  </div>

                  {/* Localitatea (CUATM) - searchable select */}
                  <div>
                    <SearchableSelect
                      id="localitate"
                      name="localitate"
                      options={cities}
                      value={formData.localitate}
                      onChange={handleChange}
                      placeholder="Selectați localitatea..."
                      label="*Localitatea (CUATM)"
                      required={true}
                      error={fieldErrors.localitate}
                    />
                  </div>

                  {/* Radio buttons for Person Type */}
                  <div className="col-span-1">
                    <div className="flex items-center justify-between border border-gray-300 rounded-[10px] p-2 hover:bg-blue-500 hover:text-white cursor-pointer">
                      <label
                        htmlFor="persFizica"
                        className="flex items-center justify-between w-full cursor-pointer"
                      >
                        <span className="select-none">Persoană Fizică</span>
                        <input
                          id="persFizica"
                          type="radio"
                          name="personType"
                          value="persFizica"
                          checked={formData.persFizica}
                          onChange={() => {
                            setFormData((prevData) => ({
                              ...prevData,
                              persFizica: true,
                              persJuridica: false,
                              agentEconomic: '',
                            }));
                          }}
                          className="cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="flex items-center justify-between border border-gray-300 rounded-[10px] p-2 hover:bg-blue-500 hover:text-white cursor-pointer">
                      <label
                        htmlFor="persJuridica"
                        className="flex items-center justify-between w-full cursor-pointer"
                      >
                        <span className="select-none">Persoană Juridică</span>
                        <input
                          id="persJuridica"
                          type="radio"
                          name="personType"
                          value="persJuridica"
                          checked={formData.persJuridica}
                          onChange={() => {
                            setFormData((prevData) => ({
                              ...prevData,
                              persFizica: false,
                              persJuridica: true,
                            }));
                          }}
                          className="cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Radio buttons for Status */}
                  <div className="col-span-2 mt-4">
                    <label className="block mb-2">*Status</label>
                    <div className="grid grid-cols-3 gap-4">
                      {statusOptions.map((option) => (
                        <div key={option.value} className="col-span-1">
                          <div
                            className={`flex items-center justify-between border border-gray-300 rounded-[10px] p-2 cursor-pointer ${
                              parseInt(formData.status, 10) === option.value
                                ? 'bg-blue-500 text-white'
                                : 'hover:bg-blue-500 hover:text-white'
                            }`}
                            onClick={() => setFormData({ ...formData, status: option.value })}
                          >
                            <label
                              htmlFor={`status-${option.value}`}
                              className="flex items-center justify-between w-full cursor-pointer"
                            >
                              <span className="select-none">{option.label}</span>
                              <input
                                id={`status-${option.value}`}
                                type="radio"
                                name="status"
                                value={option.value}
                                checked={parseInt(formData.status, 10) === option.value}
                                onChange={handleChange}
                                className="cursor-pointer"
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Agent Economic Section */}
              {formData.persJuridica && (
                <div className="bg-sky-100 p-6 rounded-lg mb-6">
                  <h2 className="text-lg font-semibold mb-4">2. Agent Economic</h2>
                  <div>
                    <SearchableSelect
                      id="agentEconomic"
                      name="agentEconomic"
                      options={businesses}
                      value={formData.agentEconomic}
                      onChange={handleChange}
                      placeholder="Căutați după denumire sau IDNO..."
                      label="*Agent economic Denumire / IDNO"
                      required={true}
                      error={fieldErrors.agentEconomic}
                    />
                  </div>
                </div>
              )}

              {/* 3. Detalii Apel Section */}
              <div className="bg-sky-100 p-6 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">3. Conținut Apel</h2>
                <div className="grid grid-cols-1 gap-4">
                  {/* Categorie Produs - searchable select */}
                  <div>
                    <SearchableSelect
                      id="categorieProdus"
                      name="categorieProdus"
                      options={products}
                      value={formData.categorieProdus}
                      onChange={handleChange}
                      placeholder="Căutați produs..."
                      label="A. Produs"
                      required={true}
                      error={fieldErrors.categorieProdus}
                    />
                  </div>

                  {/* Categorie Serviciu - searchable select */}
                  <div>
                    <SearchableSelect
                      id="categorieServiciu"
                      name="categorieServiciu"
                      options={services}
                      value={formData.categorieServiciu}
                      onChange={handleChange}
                      placeholder="Căutați serviciu..."
                      label="B. Serviciu"
                      required={true}
                      error={fieldErrors.categorieServiciu}
                    />
                  </div>

                  {/* Detalii */}
                  <div>
                    <label htmlFor="detalii" className="block mb-1">
                      *Detalii consultație
                    </label>
                    <textarea
                      id="detalii"
                      name="detalii"
                      value={formData.detalii}
                      onChange={handleChange}
                      className="border rounded p-2 w-full"
                      required
                      placeholder="Introduceți detalii suplimentare..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between mt-6">
              {documentData && (
                <button
                  type="button"
                  className="text-red-500"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Șterge
                </button>
              )}
              <div>
                <button
                  type="button"
                  className="text-gray-500 mr-4"
                  onClick={onClose}
                  disabled={loading}
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  className={`bg-blue-500 text-white py-2 px-4 rounded ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={loading}
                >
                  {loading ? 'Salvând...' : 'Salvează'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  );
};

export default EditDocumentModal;
