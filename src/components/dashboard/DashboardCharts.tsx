// src/components/dashboard/DashboardCharts.tsx
import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PayrollTrendPoint { month: string; gross: number; net: number; }
export interface AttendanceSummary { status: string; count: number; }
export interface DeptHeadcount     { department: string; count: number; }

// ── Colour palette (matches system) ──────────────────────────────────────────

const BLUE   = "#378ADD";
const TEAL   = "#1D9E75";
const AMBER  = "#EF9F27";
const RED    = "#E24B4A";
const PURPLE = "#7F77DD";
const GRAY   = "#888780";

// ── Payroll Trend Line Chart ───────────────────────────────────────────────────

export function PayrollTrendChart({ data }: { data: PayrollTrendPoint[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();

    chartRef.current = new Chart(ref.current, {
      type: "line",
      data: {
        labels: data.map((d) => d.month),
        datasets: [
          {
            label: "Gross pay",
            data: data.map((d) => d.gross),
            borderColor: BLUE,
            backgroundColor: BLUE + "18",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: BLUE,
          },
          {
            label: "Net pay",
            data: data.map((d) => d.net),
            borderColor: TEAL,
            backgroundColor: TEAL + "18",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: TEAL,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ` ${ctx.dataset.label}: ₱${Number(ctx.raw).toLocaleString("en-PH")}`,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              font: { size: 10 },
              callback: (v) => `₱${Number(v) / 1000}k`,
            },
            grid: { color: "#88878018" },
          },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  return <canvas ref={ref} />;
}

// ── Attendance Doughnut ────────────────────────────────────────────────────────

const ATTENDANCE_COLORS: Record<string, string> = {
  present:  TEAL,
  absent:   RED,
  late:     AMBER,
  on_leave: BLUE,
  holiday:  PURPLE,
};

export function AttendanceDoughnut({ data }: { data: AttendanceSummary[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();

    chartRef.current = new Chart(ref.current, {
      type: "doughnut",
      data: {
        labels: data.map((d) => d.status.replace("_", " ")),
        datasets: [{
          data: data.map((d) => d.count),
          backgroundColor: data.map((d) => ATTENDANCE_COLORS[d.status] ?? GRAY),
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 10, font: { size: 11 }, padding: 12 },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  return <canvas ref={ref} />;
}

// ── Department Headcount Bar ───────────────────────────────────────────────────

export function DeptHeadcountBar({ data }: { data: DeptHeadcount[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current?.destroy();

    chartRef.current = new Chart(ref.current, {
      type: "bar",
      data: {
        labels: data.map((d) => d.department),
        datasets: [{
          label: "Headcount",
          data: data.map((d) => d.count),
          backgroundColor: BLUE + "CC",
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.raw} employee${Number(ctx.raw) !== 1 ? "s" : ""}`,
            },
          },
        },
        scales: {
          y: {
            ticks: { font: { size: 10 }, stepSize: 1 },
            grid:  { color: "#88878018" },
            beginAtZero: true,
          },
          x: {
            ticks: { font: { size: 10 }, maxRotation: 30 },
            grid:  { display: false },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  return <canvas ref={ref} />;
}