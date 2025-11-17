import { useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CropPerformanceData {
  crop: string;
  totalQuantity: number;
  avgYield: number;
  totalRevenue: number;
  harvestCount: number;
  farmCount: number;
}

interface CropPerformanceChartProps {
  data: CropPerformanceData[];
  loading?: boolean;
  metric?: "quantity" | "yield" | "revenue";
}

export function CropPerformanceChart({ 
  data, 
  loading, 
  metric = "revenue" 
}: CropPerformanceChartProps) {
  const chartRef = useRef<ChartJS<"bar">>(null);

  // Sort data by the selected metric
  const sortedData = [...data].sort((a, b) => {
    if (metric === "quantity") return b.totalQuantity - a.totalQuantity;
    if (metric === "yield") return b.avgYield - a.avgYield;
    return b.totalRevenue - a.totalRevenue;
  });

  const chartData = {
    labels: sortedData.map(d => d.crop),
    datasets: [
      {
        label: metric === "quantity" 
          ? "Total Harvest (MT)" 
          : metric === "yield" 
          ? "Average Yield (MT/ha)" 
          : "Total Revenue (₱)",
        data: sortedData.map(d => {
          if (metric === "quantity") return d.totalQuantity;
          if (metric === "yield") return d.avgYield;
          return d.totalRevenue;
        }),
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",   // green
          "rgba(59, 130, 246, 0.8)",  // blue
          "rgba(251, 146, 60, 0.8)",  // orange
          "rgba(168, 85, 247, 0.8)",  // purple
          "rgba(236, 72, 153, 0.8)",  // pink
        ],
        borderColor: [
          "rgb(34, 197, 94)",
          "rgb(59, 130, 246)",
          "rgb(251, 146, 60)",
          "rgb(168, 85, 247)",
          "rgb(236, 72, 153)",
        ],
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const dataIndex = context.dataIndex;
            const item = sortedData[dataIndex];
            const lines = [];
            
            if (metric === "quantity") {
              lines.push(`Total Harvest: ${item.totalQuantity.toLocaleString()} MT`);
            } else if (metric === "yield") {
              lines.push(`Avg Yield: ${item.avgYield.toFixed(2)} MT/ha`);
            } else {
              lines.push(`Total Revenue: ₱${item.totalRevenue.toLocaleString()}`);
            }
            
            lines.push(`Farms: ${item.farmCount}`);
            lines.push(`Harvests: ${item.harvestCount}`);
            
            return lines;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (metric === "revenue") {
              return "₱" + Number(value).toLocaleString();
            }
            return Number(value).toLocaleString();
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
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
