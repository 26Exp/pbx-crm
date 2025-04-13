import React, { useState } from 'react';
import { getApiUrl, getAuthHeaders } from '../services/apiUtils';
import config from '../config';
import apiService from '../services/api';

const NewElementForm = () => {
  const initialFormData = {
    elementType: '',
    name: '',
    idno: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors = [];

    if (!formData.elementType) {
      newErrors.push('Vă rugăm să selectați tipul elementului.');
    }

    if (!formData.name) {
      newErrors.push('Vă rugăm să introduceți numele elementului.');
    }

    if (formData.elementType === 'Business' && !formData.idno) {
      newErrors.push('IDNO este obligatoriu pentru Agenți economici.');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateForm()) return;
  
    setLoading(true);
    setErrors([]);
    setSuccess(false);
  
    let endpoint = '';
    let body = {};
  
    switch (formData.elementType) {
      case 'Product':
        endpoint = 'products';
        body = { name: formData.name };
        break;
      case 'Service':
        endpoint = 'services';
        body = { name: formData.name };
        break;
      case 'Domain':
        endpoint = 'domains';
        body = { name: formData.name }; // ✅ No institution_id
        break;
      case 'Business':
        endpoint = 'business';
        body = { name: formData.name, idno: formData.idno };
        break;
      default:
        setErrors(['Tip de element invalid.']);
        setLoading(false);
        return;
    }
  
    try {
      // Use our API service for the POST request
      const responseData = await apiService.post(endpoint, body);
  
      // Our API service throws errors automatically, so we only need to handle success
      console.log('Element creat:', responseData);
      setSuccess(true);
      
      // Reset form
      setFormData(initialFormData);
    } catch (err) {
      console.error(err);
      setErrors([err.message || 'A apărut o eroare la trimiterea formularului.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded-lg shadow">
      <h1 className="text-xl font-semibold mb-4">Adăugare Element Nou</h1>
      
      {/* Success message */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          Elementul a fost adăugat cu succes!
        </div>
      )}
      
      {/* Error messages */}
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
        {/* Element Type */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Tip Element
          </label>
          <select
            name="elementType"
            value={formData.elementType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Selectați tipul elementului</option>
            <option value="Product">Produs</option>
            <option value="Service">Serviciu</option>
            <option value="Domain">Domeniu</option>
            <option value="Business">Agent economic</option>
          </select>
        </div>
        
        {/* Name Field */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Denumire
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        {/* IDNO Field - Only show for Business type */}
        {formData.elementType === 'Business' && (
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              IDNO
            </label>
            <input
              type="text"
              name="idno"
              value={formData.idno}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className={`bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? 'Se adaugă...' : 'Adaugă Element'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Crud = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Setări</h1>
      <div className="grid grid-cols-1 gap-8">
        <NewElementForm />
      </div>
    </div>
  );
};

export default Crud;