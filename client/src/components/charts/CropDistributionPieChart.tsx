import { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Farm {
  crops: string[];
}

interface CropDistributionPieChartProps {
  farms: Farm[];
}

export function CropDistributionPieChart({ farms }: CropDistributionPieChartProps) {
  const chartData = useMemo(() => {
    // Aggregate crop counts
    const cropCounts: Record<string, number> = {};
    
    farms.forEach(farm => {
      farm.crops.forEach(crop => {
        cropCounts[crop] = (cropCounts[crop] || 0) + 1;
      });
    });

    // Sort by count descending
    const sorted = Object.entries(cropCounts)
      .sort(([, a], [, b]) => b - a);

    const labels = sorted.map(([crop]) => crop);
    const data = sorted.map(([, count]) => count);

    // Generate colors for each crop
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // blue
      'rgba(16, 185, 129, 0.8)',   // green
      'rgba(251, 146, 60, 0.8)',   // orange
      'rgba(139, 92, 246, 0.8)',   // purple
      'rgba(236, 72, 153, 0.8)',   // pink
      'rgba(245, 158, 11, 0.8)',   // amber
      'rgba(20, 184, 166, 0.8)',   // teal
      'rgba(239, 68, 68, 0.8)',    // red
    ];

    const borderColors = [
      'rgba(59, 130, 246, 1)',
      'rgba(16, 185, 129, 1)',
      'rgba(251, 146, 60, 1)',
      'rgba(139, 92, 246, 1)',
      'rgba(236, 72, 153, 1)',
      'rgba(245, 158, 11, 1)',
      'rgba(20, 184, 166, 1)',
      'rgba(239, 68, 68, 1)',
    ];

    return {
      labels,
      datasets: [
        {
          label: 'Number of Farms',
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: borderColors.slice(0, labels.length),
          borderWidth: 1,
        },
      ],
    };
  }, [farms]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} farm${value !== 1 ? 's' : ''} (${percentage}%)`;
          }
        }
      },
    },
  };

  if (farms.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No crop data available
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <Pie data={chartData} options={options} />
    </div>
  );
}
