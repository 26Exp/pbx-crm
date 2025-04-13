import React, { useState, useEffect } from 'react';
import { getApiUrl, getAuthHeaders, fetchAllPages } from './services/apiUtils';
import config from './config';
import apiService from './services/api';

const NewDocumentForm = ({ addDocument }) => {
  const [formData, setFormData] = useState({
    numePrenume: '',
    continutConsultatie: '',
    dataApel: '',
    localitate: '',
    personType: '',
    agentEconomic: '',
    categorieProdus: '',
    categorieServiciu: '',
    detalii: '',
  });

  // State for reference data
  const [cities, setCities] = useState([]);
  const [domains, setDomains] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);

  // State for form submission
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]); // Changed to array
  const [success, setSuccess] = useState(false);

  // We're now using the fetchAllPages utility from apiUtils.js

  // Fetch reference data on component mount
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        // Fetch all reference data concurrently using our API service
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

        setCities(citiesData || []);
        setDomains(domainsData || []);
        setBusinesses(businessesData || []);
        setProducts(productsData || []);
        setServices(servicesData || []);
      } catch (err) {
        console.error(err);
        setErrors(['Eroare la încărcarea datelor. Vă rugăm să încercați din nou.']);
      }
    };

    fetchReferenceData();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
    } = formData;

    const newErrors = [];

    if (!numePrenume) newErrors.push('Vă rugăm să completați Nume și Prenume.');
    if (!continutConsultatie) newErrors.push('Vă rugăm să selectați Domeniul Consultație.');
    if (!dataApel) newErrors.push('Vă rugăm să selectați Data apelului.');
    if (!localitate) newErrors.push('Vă rugăm să selectați Localitatea (CUATM).');
    if (!formData.personType)
      newErrors.push('Vă rugăm să selectați tipul persoanei (Fizică sau Juridică).');
    if (formData.personType === 'persJuridica' && !agentEconomic)
      newErrors.push('Vă rugăm să selectați Agent Economic pentru Persoană Juridică.');
    if (!categorieProdus) newErrors.push('Vă rugăm să selectați Categorie Produs.');
    if (!categorieServiciu) newErrors.push('Vă rugăm să selectați Categorie Serviciu.');
    if (!detalii) newErrors.push('Vă rugăm să completați Detalii consultație.');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return false;
    }

    // Additional validations can be added here (e.g., format checks)
    setErrors([]);
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors([]); // Reset previous errors
    setSuccess(false);

    // Map formData to API fields
    const mappedData = {
      // call_id: parseInt(formData.nrDeIesire), // Removed as per instruction
      name: formData.numePrenume,
      domain_id: parseInt(formData.continutConsultatie, 10),
      call_id: 1,
      city_id: parseInt(formData.localitate, 10),
      business_id:
        formData.personType === 'persJuridica' ? parseInt(formData.agentEconomic, 10) : null,
      product_id: parseInt(formData.categorieProdus, 10),
      service_id: parseInt(formData.categorieServiciu, 10),
      details: formData.detalii,
      status: 1, // Set appropriate status code
    };

    try {
      // Use our API service to create a new document
      const response = await apiService.documents.create(mappedData);
      
      console.log('Document creat:', response);
      setSuccess(true);
      addDocument(response); // Assuming addDocument updates the parent component
      // Reset form after successful submission
      setFormData({
        numePrenume: '',
        continutConsultatie: '',
        dataApel: '',
        localitate: '',
        personType: '',
        agentEconomic: '',
        categorieProdus: '',
        categorieServiciu: '',
        detalii: '',
      });
    } catch (err) {
      console.error(err);
      // Errors are already set above
    } finally {
      setLoading(false);
    }
  };

  // Render select options helper function
  const renderSelectOptions = (dataArray) =>
    dataArray.map((item) => (
      <option key={item.id} value={item.id}>
        {item.name}
      </option>
    ));

  return (
    <form onSubmit={handleSubmit} className="p-2 max-w-4xl mx-auto">
      {/* Display success message */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          Documentul a fost creat cu succes!
        </div>
      )}

      {/* Display error messages */}
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          <ul className="list-disc pl-5">
            {errors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-between mt-4">
          <button
            type="button"
            className="text-red-500"
            onClick={() => {
              // Handle form cancellation (reset form)
              setFormData({
                numePrenume: '',
                continutConsultatie: '',
                dataApel: '',
                localitate: '',
                personType: '',
                agentEconomic: '',
                categorieProdus: '',
                categorieServiciu: '',
                detalii: '',
              });
              setErrors([]);
              setSuccess(false);
            }}
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

          {/* Domeniul Consultatie - select */}
          <div>
            <label htmlFor="continutConsultatie" className="block mb-1">
              *Domeniul Consultație
            </label>
            <select
              id="continutConsultatie"
              name="continutConsultatie"
              value={formData.continutConsultatie}
              onChange={handleChange}
              className="border rounded p-2 w-full"
              required
            >
              <option value="">Select...</option>
              {domains.length > 0 ? (
                renderSelectOptions(domains)
              ) : (
                <option disabled>Se încarcă...</option>
              )}
            </select>
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

          {/* Localitatea (CUATM) */}
          <div>
            <label htmlFor="localitate" className="block mb-1">
              *Localitatea (CUATM)
            </label>
            <select
              id="localitate"
              name="localitate"
              value={formData.localitate}
              onChange={handleChange}
              className="border rounded p-2 w-full"
              required
            >
              <option value="">Select...</option>
              {cities.length > 0 ? (
                renderSelectOptions(cities)
              ) : (
                <option disabled>Se încarcă...</option>
              )}
            </select>
          </div>

          {/* Radio buttons */}
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
                  checked={formData.personType === 'persFizica'}
                  onChange={handleChange}
                  className="cursor-pointer"
                />
              </label>
            </div>
          </div>
          <div className="col-span-1">
            <div className="flex items-center justify-between border border-gray-300 rounded-[10px] p-2 hover:bg-blue-500 hover:text-white">
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
                  checked={formData.personType === 'persJuridica'}
                  onChange={handleChange}
                  className="cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Agent Economic Section (Only show if Persoană Juridică is selected) */}
      {formData.personType === 'persJuridica' && (
        <div className="bg-sky-100 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">2. Agent Economic</h2>
          <div>
            <label htmlFor="agentEconomic" className="block mb-1">
              *Agent economic Denumire / IDNO
            </label>
            <select
              id="agentEconomic"
              name="agentEconomic"
              value={formData.agentEconomic}
              onChange={handleChange}
              className="border rounded p-2 w-full"
              required
            >
              <option value="">Select...</option>
              {businesses.length > 0 ? (
                renderSelectOptions(businesses)
              ) : (
                <option disabled>Se încarcă...</option>
              )}
            </select>
          </div>
        </div>
      )}

      {/* 3. Detalii Apel Section */}
      <div className="bg-sky-100 p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">3. Conținut Apel</h2>
        <div className="grid grid-cols-1 gap-4">
          {/* Categorie Produs */}
          <div>
            <label htmlFor="categorieProdus" className="block mb-1">
              A. Produs
            </label>
            <select
              id="categorieProdus"
              name="categorieProdus"
              value={formData.categorieProdus}
              onChange={handleChange}
              className="border rounded p-2 w-full"
              required
            >
              <option value="">Select...</option>
              {products.length > 0 ? (
                renderSelectOptions(products)
              ) : (
                <option disabled>Se încarcă...</option>
              )}
            </select>
          </div>

          {/* Categorie Serviciu */}
          <div>
            <label htmlFor="categorieServiciu" className="block mb-1">
              B. Serviciu
            </label>
            <select
              id="categorieServiciu"
              name="categorieServiciu"
              value={formData.categorieServiciu}
              onChange={handleChange}
              className="border rounded p-2 w-full"
              required
            >
              <option value="">Select...</option>
              {services.length > 0 ? (
                renderSelectOptions(services)
              ) : (
                <option disabled>Se încarcă...</option>
              )}
            </select>
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
    </form>
  );
};

export default NewDocumentForm;
