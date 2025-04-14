import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { FaFileExport } from 'react-icons/fa';
import { CSVLink } from "react-csv";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const LineChart = ({ statisticsData }) => {
  const [chartData, setChartData] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    if (!statisticsData) return;
    
    try {
      // Process monthly evolution data from statistics
      const monthlyData = statisticsData.monthly_evolution || [];
      
      // Prepare data arrays      
      const labels = monthlyData.map(month => month.label);
      const totalValues = monthlyData.map(month => month.total);
      const closedValues = monthlyData.map(month => month.closed);
      const inProgressValues = monthlyData.map(month => month.in_progress);
      
      // Create gradients for charts
      const ctx = document.createElement('canvas').getContext('2d');
      
      const totalGradient = ctx.createLinearGradient(0, 0, 0, 400);
      totalGradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
      totalGradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)');
      
      const closedGradient = ctx.createLinearGradient(0, 0, 0, 400);
      closedGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)'); 
      closedGradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
      
      setChartData({
        labels,
        datasets: [
          {
            label: statisticsData?.chart_config?.total_label || 'Total',
            data: totalValues,
            fill: true,
            backgroundColor: totalGradient,
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: 'rgba(79, 70, 229, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: 'rgba(79, 70, 229, 1)',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
            order: 1
          },
          {
            label: statisticsData?.chart_config?.closed_label || 'Închise',
            data: closedValues,
            fill: true,
            backgroundColor: closedGradient,
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: 'rgba(16, 185, 129, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(16, 185, 129, 1)',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
            order: 2
          },
          {
            label: statisticsData?.chart_config?.in_progress_label || 'În Lucru',
            data: inProgressValues,
            fill: false,
            borderColor: 'rgba(245, 158, 11, 1)',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.4,
            pointBackgroundColor: 'rgba(245, 158, 11, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(245, 158, 11, 1)',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2,
            order: 3
          }
        ],
      });
      
      // Store the data for export (already set from parent component)
      window.lineChartData = monthlyData.map(month => ({
        date: month.label,
        count: month.total,
        in_progress: month.in_progress,
        closed: month.closed
      }));
      
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error processing timeline data:', error);
      
      // Fallback with sample data if data processing fails
      // Use last 12 months in the locale format
      const sampleLabels = Array.from({length: 12}, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - 11 + i);
        return date.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
      });
      const sampleTotalValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9];
      const sampleClosedValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6];
      const sampleInProgressValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      
      // Create gradients for fallback
      const ctx = document.createElement('canvas').getContext('2d');
      
      const totalGradient = ctx.createLinearGradient(0, 0, 0, 400);
      totalGradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
      totalGradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)');
      
      const closedGradient = ctx.createLinearGradient(0, 0, 0, 400);
      closedGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)'); 
      closedGradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
      
      setChartData({
        labels: sampleLabels,
        datasets: [
          {
            label: statisticsData?.chart_config?.total_label || 'Total',
            data: sampleTotalValues,
            fill: true,
            backgroundColor: totalGradient,
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: 'rgba(79, 70, 229, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 4,
            pointHoverRadius: 6,
            order: 1
          },
          {
            label: statisticsData?.chart_config?.closed_label || 'Închise',
            data: sampleClosedValues,
            fill: true,
            backgroundColor: closedGradient,
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: 'rgba(16, 185, 129, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 3,
            pointHoverRadius: 5,
            order: 2
          },
          {
            label: statisticsData?.chart_config?.in_progress_label || 'În Lucru',
            data: sampleInProgressValues,
            fill: false,
            borderColor: 'rgba(245, 158, 11, 1)',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.4,
            pointBackgroundColor: 'rgba(245, 158, 11, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 3,
            pointHoverRadius: 5,
            order: 3
          }
        ],
      });
      
      // Store fallback data for export
      window.lineChartData = sampleLabels.map((date, index) => ({
        date,
        count: sampleTotalValues[index],
        in_progress: sampleInProgressValues[index],
        closed: sampleClosedValues[index]
      }));
      
      setIsDataLoaded(true);
    }
  }, [statisticsData]);

  if (!chartData) return <p>Încărcare...</p>;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          drawBorder: false,
        },
        ticks: {
          precision: 0,
        },
        title: {
          display: true,
          text: statisticsData?.chart_config?.y_axis_title || 'Număr documente',
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: statisticsData?.chart_config?.x_axis_title || 'Lună',
          font: {
            size: 12
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        title: {
          display: true,
          text: statisticsData?.chart_config?.legend_title || 'Legendă',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        padding: 12,
        position: 'nearest',
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          title: function(tooltipItems) {
            return tooltipItems[0].label;
          },
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        },
        displayColors: true,
        caretSize: 6,
        caretPadding: 10
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  return (
    <div className="relative h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {isDataLoaded && (
            <CSVLink
              data={window.lineChartData || []}
              headers={[
                { label: statisticsData?.chart_config?.date_column_label || 'Lună', key: 'date' },
                { label: statisticsData?.chart_config?.total_label || 'Total', key: 'count' },
                { label: statisticsData?.chart_config?.in_progress_label || 'În Lucru', key: 'in_progress' },
                { label: statisticsData?.chart_config?.closed_label || 'Închise', key: 'closed' }
              ]}
              filename={statisticsData?.chart_config?.export_filename || "date_lunare_documente.csv"}
              className="mr-2"
            >
              <FaFileExport
                size={18}
                className="text-gray-500 cursor-pointer hover:text-indigo-600 transition-colors"
              />
            </CSVLink>
          )}
          <h3 className="text-sm font-semibold text-gray-600">{statisticsData?.chart_config?.chart_title || 'Evoluție Lunară Documente'}</h3>
        </div>
        <span className="text-xs text-gray-500">{statisticsData?.chart_config?.chart_subtitle || 'Ultimele 12 luni'}</span>
      </div>
      <div className="h-[calc(100%-2rem)]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default LineChart;
