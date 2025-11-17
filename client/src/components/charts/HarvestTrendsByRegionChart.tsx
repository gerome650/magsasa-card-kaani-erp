import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HarvestTrendsData {
  municipality: string;
  month: string;
  totalQuantity: number;
  avgYield: number;
  harvestCount: number;
}

interface HarvestTrendsByRegionChartProps {
  data: HarvestTrendsData[];
  loading?: boolean;
}

export function HarvestTrendsByRegionChart({ data, loading }: HarvestTrendsByRegionChartProps) {
  const chartRef = useRef<ChartJS<"line">>(null);

  // Group data by municipality
  const municipalityData = data.reduce((acc, item) => {
    if (!acc[item.municipality]) {
      acc[item.municipality] = [];
    }
    acc[item.municipality].push(item);
    return acc;
  }, {} as Record<string, HarvestTrendsData[]>);

  // Get all unique months sorted
  const allMonths = Array.from(new Set(data.map(d => d.month))).sort();

  // Color palette for different municipalities
  const colors = [
    { border: "rgb(34, 197, 94)", bg: "rgba(34, 197, 94, 0.1)" }, // green
    { border: "rgb(59, 130, 246)", bg: "rgba(59, 130, 246, 0.1)" }, // blue
    { border: "rgb(251, 146, 60)", bg: "rgba(251, 146, 60, 0.1)" }, // orange
    { border: "rgb(168, 85, 247)", bg: "rgba(168, 85, 247, 0.1)" }, // purple
    { border: "rgb(236, 72, 153)", bg: "rgba(236, 72, 153, 0.1)" }, // pink
  ];

  // Create datasets for each municipality
  const datasets = Object.entries(municipalityData).map(([municipality, items], index) => {
    const color = colors[index % colors.length];
    
    // Create data array with values for each month
    const dataPoints = allMonths.map(month => {
      const item = items.find(i => i.month === month);
      return item ? item.totalQuantity : 0;
    });

    return {
      label: municipality,
      data: dataPoints,
      borderColor: color.border,
      backgroundColor: color.bg,
      tension: 0.3,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
    };
  });

  const chartData = {
    labels: allMonths,
    datasets,
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString() + " MT";
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString() + " MT";
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading chart data...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground">No data available</div>
      </div>
    );
  }

  return (
    <div className="h-[400px]">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
