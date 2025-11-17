import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, startOfMonth, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Farm {
  averageYield: number;
  registrationDate: Date;
}

interface YieldTrendsLineChartProps {
  farms: Farm[];
}

export function YieldTrendsLineChart({ farms }: YieldTrendsLineChartProps) {
  const chartData = useMemo(() => {
    if (farms.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Group farms by month and calculate average yield
    const yieldByMonth: Record<string, { total: number; count: number }> = {};
    
    farms.forEach(farm => {
      if (farm.averageYield > 0) {
        const monthKey = format(startOfMonth(farm.registrationDate), 'yyyy-MM');
        if (!yieldByMonth[monthKey]) {
          yieldByMonth[monthKey] = { total: 0, count: 0 };
        }
        yieldByMonth[monthKey].total += farm.averageYield;
        yieldByMonth[monthKey].count += 1;
      }
    });

    // Sort by month
    const sorted = Object.entries(yieldByMonth)
      .sort(([a], [b]) => a.localeCompare(b));

    const labels = sorted.map(([month]) => format(parseISO(month + '-01'), 'MMM yyyy'));
    const data = sorted.map(([, { total, count }]) => (total / count).toFixed(2));

    return {
      labels,
      datasets: [
        {
          label: 'Average Yield (t/ha)',
          data,
          borderColor: 'rgba(16, 185, 129, 1)', // green-500
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgba(16, 185, 129, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    };
  }, [farms]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y} t/ha`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Yield (t/ha)',
        },
        grid: {
          display: true,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (farms.length === 0 || chartData.labels.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No yield data available
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  );
}
