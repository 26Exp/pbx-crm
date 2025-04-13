import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { FaFileExport } from 'react-icons/fa'; // Importing the export icon
import { CSVLink } from "react-csv";  // Import CSVLink for export
import apiService from '../services/api';
import config from '../config';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LineChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use our API service to get documents
        const data = await apiService.documents.getAll();

        // Make sure data is an array
        const documentsArray = Array.isArray(data) ? data : 
                              (data?.data && Array.isArray(data.data) ? data.data : []);
        
        // Process data for Line Chart
        const dateCounts = documentsArray.reduce((acc, doc) => {
          if (doc && doc.created_at) {
            const date = new Date(doc.created_at).toLocaleDateString('en-CA');
            acc[date] = (acc[date] || 0) + 1;
          }
          return acc;
        }, {});

        const labels = Object.keys(dateCounts);
        const values = Object.values(dateCounts);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Documente create',
              data: values,
              fill: true,
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              borderColor: '#6366F1',
              tension: 0.4,
            },
          ],
        });

        // Store the data for export
        window.lineChartData = labels.map((date, index) => ({
          date,
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
      <div className="relative flex items-center w-full">
  {/* Export Icon */}
  <CSVLink
    data={window.lineChartData}
    headers={[
      { label: 'Date', key: 'date' },
      { label: 'Document Count', key: 'count' }
    ]}
    filename="line_chart_data.csv"
  >
    <FaFileExport
      size={20} // Smaller icon size
      className="mr-2 text-gray-500 cursor-pointer hover:text-black"  // Margin to space icon from title
    />
  </CSVLink>

  {/* Title */}
  <h2 className="text-lg font-bold mb-0">Documente create în timp</h2>

  {/* Subtitle */}
  <span className="text-gray-500 ml-auto">Ultima perioadă</span> {/* ml-auto for right alignment */}
</div>

      <Line data={chartData} options={options} />

      
    </div>
  );
};

export default LineChart;
