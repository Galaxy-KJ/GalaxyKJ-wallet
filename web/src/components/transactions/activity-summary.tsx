"use client";

import { Card } from "@/components/ui/card";
import { Line } from "react-chartjs-2";
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
  ChartOptions,
  ChartData,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export function ActivitySummary() {
  const data: ChartData<"line"> = {
    labels: ["1 Mar", "5 Mar", "10 Mar", "15 Mar", "20 Mar", "25 Mar", "30 Mar"],
    datasets: [
      {
        label: "Received",
        data: [0, 100, 200, 250, 300, 450, 475],
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#10B981",
        pointBorderColor: "#0F1225",
        pointBorderWidth: 2,
      },
      {
        label: "Sent",
        data: [0, 50, 75, 100, 100, 125, 125],
        borderColor: "#60A5FA",
        backgroundColor: "rgba(96, 165, 250, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#60A5FA",
        pointBorderColor: "#0F1225",
        pointBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#9CA3AF",
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 18, 37, 0.9)",
        titleColor: "#F3F4F6",
        bodyColor: "#D1D5DB",
        padding: 12,
        borderColor: "rgba(75, 85, 99, 0.3)",
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (context) => {
            if (context.parsed.y !== undefined) {
              return `${context.dataset.label}: ${context.parsed.y} XLM`;
            }
            return "";
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(75, 85, 99, 0.1)",
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 11,
          },
          callback: (tickValue: string | number) => `${tickValue} XLM`,
        },
      },
    },
  };

  return (
    <Card className="bg-card border-border p-6">
      <h2 className="text-lg font-semibold mb-6">Activity Summary</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-muted-foreground">Received (30d)</div>
            <div className="text-xl font-semibold text-[#10B981]">+475.5 XLM</div>
            <div className="text-sm text-muted-foreground">+350 USDC</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Sent (30d)</div>
            <div className="text-xl font-semibold text-[#60A5FA]">-125 XLM</div>
            <div className="text-sm text-muted-foreground">-50 USDC</div>
          </div>
        </div>
        <div className="h-[240px]">
          <Line data={data} options={options} />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">5 transactions found</div>
          <div className="flex gap-2">
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              CSV
            </button>
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              PDF
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
