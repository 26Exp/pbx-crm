import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { FaFileExport } from 'react-icons/fa'; // Importing the export icon
import { CSVLink } from "react-csv";  // Import CSVLink for export
import apiService from '../services/api';
import config from '../config';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use our API service to get documents
        const data = await apiService.documents.getAll();

        // Make sure data is an array
        const documentsArray = Array.isArray(data) ? data : 
                              (data?.data && Array.isArray(data.data) ? data.data : []);
        
        // Process data for Bar Chart
        const statusCounts = documentsArray.reduce((acc, doc) => {
          if (doc && doc.status) {
            acc[doc.status] = (acc[doc.status] || 0) + 1;
          }
          return acc;
        }, {});

        const labels = Object.keys(statusCounts);
        const values = Object.values(statusCounts);

        // Set colors dynamically
        const backgroundColors = labels.map((status) => {
          if (status === 'Respins') return '#FEE2E2';
          if (status === 'Inchis') return '#D1FAE5';
          return '#6366F1';
        });

        setChartData({
          labels,
          datasets: [
            {
              label: 'Numărul',
              data: values,
              backgroundColor: backgroundColors,
            },
          ],
        });

        // Store the data for export
        window.barChartData = labels.map((status, index) => ({
          status,
          count: values[index],
        }));
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  if (!chartData) return <p>Loading...</p>;

  const options = {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  return (
    <div className="relative">
    <div className="relative flex items-center">
  {/* Export Icon */}
  <CSVLink
    data={window.barChartData}
    headers={[
      { label: 'Status', key: 'status' },
      { label: 'Count', key: 'count' }
    ]}
    filename="bar_chart_data.csv"
  >
    <FaFileExport
      size={20} // Smaller icon size
      className="mr-2 text-gray-500 cursor-pointer hover:text-black"  // Margin to space icon from title
    />
  </CSVLink>

  {/* Title */}
  <h2 className="text-lg font-bold mb-0">Statutul Documentelor</h2>

  {/* Subtitle */}
  <span className="text-gray-500 ml-auto">Statistica curentă</span> {/* ml-auto for right alignment */}
</div>

      <Bar data={chartData} options={options} />

     
     
    </div>
  );
};

export default BarChart;
