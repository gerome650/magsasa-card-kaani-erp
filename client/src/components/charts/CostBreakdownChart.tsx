import { useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CostCategoryData {
  category: string;
  totalAmount: number;
  transactionCount: number;
}

interface CostBreakdownChartProps {
  data: CostCategoryData[];
  loading?: boolean;
}

export function CostBreakdownChart({ data, loading }: CostBreakdownChartProps) {
  const chartRef = useRef<ChartJS<"doughnut">>(null);

  // Sort by amount descending
  const sortedData = [...data].sort((a, b) => b.totalAmount - a.totalAmount);

  const chartData = {
    labels: sortedData.map(d => d.category),
    datasets: [
      {
        label: "Cost Amount",
        data: sortedData.map(d => d.totalAmount),
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",   // green - Seeds
          "rgba(59, 130, 246, 0.8)",  // blue - Fertilizer
          "rgba(251, 146, 60, 0.8)",  // orange - Pesticides
          "rgba(168, 85, 247, 0.8)",  // purple - Labor
          "rgba(236, 72, 153, 0.8)",  // pink - Equipment
          "rgba(14, 165, 233, 0.8)",  // sky - Irrigation
          "rgba(245, 158, 11, 0.8)",  // amber - Other
        ],
        borderColor: [
          "rgb(34, 197, 94)",
          "rgb(59, 130, 246)",
          "rgb(251, 146, 60)",
          "rgb(168, 85, 247)",
          "rgb(236, 72, 153)",
          "rgb(14, 165, 233)",
          "rgb(245, 158, 11)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i] as number;
                const total = (data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor?.[i] as string,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const dataIndex = context.dataIndex;
            const item = sortedData[dataIndex];
            const total = sortedData.reduce((sum, d) => sum + d.totalAmount, 0);
            const percentage = ((item.totalAmount / total) * 100).toFixed(1);
            
            return [
              `${item.category}: ₱${item.totalAmount.toLocaleString()}`,
              `${percentage}% of total costs`,
              `${item.transactionCount} transactions`,
            ];
          },
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
      <Doughnut ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
