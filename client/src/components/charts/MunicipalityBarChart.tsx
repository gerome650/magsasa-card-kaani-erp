import { useMemo } from 'react';
import { useLocation } from 'wouter';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Farm {
  municipality: string;
}

interface MunicipalityBarChartProps {
  farms: Farm[];
}

export function MunicipalityBarChart({ farms }: MunicipalityBarChartProps) {
  const [, navigate] = useLocation();
  const chartData = useMemo(() => {
    // Aggregate farms by municipality
    const municipalityCounts: Record<string, number> = {};
    
    farms.forEach(farm => {
      const municipality = farm.municipality || 'Unknown';
      municipalityCounts[municipality] = (municipalityCounts[municipality] || 0) + 1;
    });

    // Sort by count descending
    const sorted = Object.entries(municipalityCounts)
      .sort(([, a], [, b]) => b - a);

    const labels = sorted.map(([municipality]) => municipality);
    const data = sorted.map(([, count]) => count);

    return {
      labels,
      datasets: [
        {
          label: 'Number of Farms',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue-500
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [farms]);

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.x} farm${context.parsed.x !== 1 ? 's' : ''}`;
          },
          footer: function() {
            return 'Click to filter farms by municipality';
          }
        }
      },
    },
    onClick: (_event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const municipality = chartData.labels[index];
        // Navigate to Farms page with municipality filter
        navigate(`/farms?barangay=${encodeURIComponent(municipality)}`);
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        grid: {
          display: true,
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (farms.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No farm data available
      </div>
    );
  }

  return (
    <div className="h-[300px] cursor-pointer">
      <Bar data={chartData} options={options} />
    </div>
  );
}
