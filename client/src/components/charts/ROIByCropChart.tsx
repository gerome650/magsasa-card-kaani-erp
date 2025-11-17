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

interface ROIData {
  crop: string;
  totalRevenue: number;
  totalCost: number;
  roi: number;
  farmCount: number;
}

interface ROIByCropChartProps {
  data: ROIData[];
  loading?: boolean;
}

export function ROIByCropChart({ data, loading }: ROIByCropChartProps) {
  const chartRef = useRef<ChartJS<"bar">>(null);

  // Sort by ROI descending
  const sortedData = [...data].sort((a, b) => b.roi - a.roi);

  const chartData = {
    labels: sortedData.map(d => d.crop),
    datasets: [
      {
        label: "ROI (%)",
        data: sortedData.map(d => d.roi),
        backgroundColor: sortedData.map(d => 
          d.roi >= 50 
            ? "rgba(34, 197, 94, 0.8)"   // green for high ROI
            : d.roi >= 20 
            ? "rgba(59, 130, 246, 0.8)"  // blue for medium ROI
            : "rgba(251, 146, 60, 0.8)"  // orange for low ROI
        ),
        borderColor: sortedData.map(d => 
          d.roi >= 50 
            ? "rgb(34, 197, 94)"
            : d.roi >= 20 
            ? "rgb(59, 130, 246)"
            : "rgb(251, 146, 60)"
        ),
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y" as const,
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
            
            return [
              `ROI: ${item.roi.toFixed(1)}%`,
              `Revenue: ₱${item.totalRevenue.toLocaleString()}`,
              `Cost: ₱${item.totalCost.toLocaleString()}`,
              `Farms: ${item.farmCount}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value + "%";
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      y: {
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
