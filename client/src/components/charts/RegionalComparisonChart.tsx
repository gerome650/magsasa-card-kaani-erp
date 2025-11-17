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

interface RegionalData {
  region: string;
  totalHarvest: number;
  avgYield: number;
  totalRevenue: number;
  totalCost: number;
  farmCount: number;
  harvestCount: number;
  roi: number;
}

interface RegionalComparisonChartProps {
  data: RegionalData[];
  loading?: boolean;
  metric?: "harvest" | "yield" | "revenue" | "roi";
}

export function RegionalComparisonChart({ 
  data, 
  loading,
  metric = "revenue" 
}: RegionalComparisonChartProps) {
  const chartRef = useRef<ChartJS<"bar">>(null);

  // Filter out "Other" region if exists
  const filteredData = data.filter(d => d.region !== "Other");

  const chartData = {
    labels: filteredData.map(d => d.region),
    datasets: [
      {
        label: metric === "harvest" 
          ? "Total Harvest (MT)" 
          : metric === "yield" 
          ? "Average Yield (MT/ha)" 
          : metric === "roi"
          ? "ROI (%)"
          : "Total Revenue (₱)",
        data: filteredData.map(d => {
          if (metric === "harvest") return d.totalHarvest;
          if (metric === "yield") return d.avgYield;
          if (metric === "roi") return d.roi;
          return d.totalRevenue;
        }),
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",   // green for first region
          "rgba(59, 130, 246, 0.8)",  // blue for second region
        ],
        borderColor: [
          "rgb(34, 197, 94)",
          "rgb(59, 130, 246)",
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
            const item = filteredData[dataIndex];
            const lines = [];
            
            if (metric === "harvest") {
              lines.push(`Total Harvest: ${item.totalHarvest.toLocaleString()} MT`);
            } else if (metric === "yield") {
              lines.push(`Avg Yield: ${item.avgYield.toFixed(2)} MT/ha`);
            } else if (metric === "roi") {
              lines.push(`ROI: ${item.roi.toFixed(1)}%`);
            } else {
              lines.push(`Total Revenue: ₱${item.totalRevenue.toLocaleString()}`);
            }
            
            lines.push(`Farms: ${item.farmCount}`);
            lines.push(`Harvests: ${item.harvestCount}`);
            lines.push(`Total Cost: ₱${item.totalCost.toLocaleString()}`);
            
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
            if (metric === "roi") {
              return value + "%";
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
