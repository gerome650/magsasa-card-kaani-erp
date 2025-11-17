import { useMemo } from 'react';
import { useLocation } from 'wouter';
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
  const [, navigate] = useLocation();
  const chartData = useMemo(() => {
    if (farms.length === 0) {
      return {
        labels: [],
        monthKeys: [],
        datasets: [],
      };
    }

    // Group farms by month and calculate average yield
    const yieldByMonth: Record<string, { total: number; count: number; monthKey: string }> = {};
    
    farms.forEach(farm => {
      if (farm.averageYield > 0) {
        const monthKey = format(startOfMonth(farm.registrationDate), 'yyyy-MM');
        if (!yieldByMonth[monthKey]) {
          yieldByMonth[monthKey] = { total: 0, count: 0, monthKey };
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
    const monthKeys = sorted.map(([month]) => month);

    return {
      labels,
      monthKeys,
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
          },
          footer: function() {
            return 'Click to filter farms by month';
          }
        }
      },
    },
    onClick: (_event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const monthKey = chartData.monthKeys[index];
        // Calculate start and end of month for date range filter
        const startDate = `${monthKey}-01`;
        const date = parseISO(startDate);
        const year = date.getFullYear();
        const month = date.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const endDate = `${monthKey}-${lastDay.toString().padStart(2, '0')}`;
        // Navigate to Farms page with date range filter
        navigate(`/farms?startDate=${startDate}&endDate=${endDate}`);
      }
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
    <div className="h-[300px] cursor-pointer">
      <Line data={chartData} options={options} />
    </div>
  );
}
