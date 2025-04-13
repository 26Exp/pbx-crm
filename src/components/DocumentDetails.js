// DocumentDetails.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../services/api';
import { getApiUrl, getAuthHeaders, fetchAllPages } from '../services/apiUtils';

const DocumentDetails = () => {
  const { documentId } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lookup maps
  const [citiesMap, setCitiesMap] = useState({});
  const [domainsMap, setDomainsMap] = useState({});
  const [businessesMap, setBusinessesMap] = useState({});
  const [servicesMap, setServicesMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use API service to fetch document data
        const documentData = await apiService.documents.getById(documentId);

        // Fetch related entities using our fetchAllPages utility
        const [citiesData, domainsData, businessesData, servicesData] = await Promise.all([
          apiService.refData.getCities(),
          apiService.refData.getDomains(),
          apiService.refData.getBusinesses(),
          apiService.refData.getServices(),
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

        // Map document data to include names instead of IDs
        const doc = documentData.data;
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
          detalii: doc.details,
          domain_id: doc.domain_id,
          city_id: doc.city_id,
          business_id: doc.business_id,
          service_id: doc.service_id,
          product_id: doc.product_id,
          nume: doc.name,
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Detalii Document</h1>
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <tbody>
          <tr>
            <td className="py-3 px-4 border-b font-bold">Nr.</td>
            <td className="py-3 px-4 border-b">{document.nr}</td>
          </tr>
          <tr>
            <td className="py-3 px-4 border-b font-bold">Statut</td>
            <td className="py-3 px-4 border-b">
              <span
                className={`py-1 px-3 rounded-full text-sm ${
                  document.statut === 'Inchis'
                    ? 'bg-green-100 text-green-600'
                    : document.statut === 'Respins'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {document.statut}
              </span>
            </td>
          </tr>
          <tr>
            <td className="py-3 px-4 border-b font-bold">Nume & Prenume</td>
            <td className="py-3 px-4 border-b">{document.nume}</td>
          </tr>
          <tr>
            <td className="py-3 px-4 border-b font-bold">Domeniul Consultație</td>
            <td className="py-3 px-4 border-b">{document.continutConsultatie}</td>
          </tr>
          <tr>
            <td className="py-3 px-4 border-b font-bold">Data apelului</td>
            <td className="py-3 px-4 border-b">{document.dataApel}</td>
          </tr>
          <tr>
            <td className="py-3 px-4 border-b font-bold">Localitatea (CUATM)</td>
            <td className="py-3 px-4 border-b">{document.localitate}</td>
          </tr>
          <tr>
            <td className="py-3 px-4 border-b font-bold">Pers. Fizică</td>
            <td className="py-3 px-4 border-b">{document.persFizica ? 'Da' : 'Nu'}</td>
          </tr>
          <tr>
            <td className="py-3 px-4 border-b font-bold">Pers. Juridică</td>
            <td className="py-3 px-4 border-b">{document.persJuridica ? 'Da' : 'Nu'}</td>
          </tr>
          <tr>
            <td className="py-3 px-4 border-b font-bold">Agent economic / Denumire / IDNO</td>
            <td className="py-3 px-4 border-b">{document.agentEconomic}</td>
          </tr>
          <tr>
            <td className="py-3 px-4 border-b font-bold">Categorie Informație</td>
            <td className="py-3 px-4 border-b">{document.categorieInformatie}</td>
          </tr>
          <tr>
            <td className="py-3 px-4 border-b font-bold">Detalii</td>
            <td className="py-3 px-4 border-b">{document.detalii}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default DocumentDetails;
