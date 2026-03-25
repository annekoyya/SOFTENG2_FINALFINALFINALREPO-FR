// src/hooks/useReports.ts
import { useState, useCallback } from "react";
import { authFetch } from "./api";
import type { ReportFilter } from "@/types/reports";

export function useReports() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Requests a PDF from the backend and triggers a browser download.
   * The backend returns a PDF blob; we create an object URL and click it.
   */
  const generatePDF = useCallback(async (filters: ReportFilter) => {
    setGenerating(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
      });

      const res = await authFetch(`/api/reports/generate?${params.toString()}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to generate report." }));
        throw new Error(err.message ?? "Failed to generate report.");
      }

      // Trigger download
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;

      // Filename from Content-Disposition header or fallback
      const cd   = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="?([^"]+)"?/);
      a.download  = match?.[1] ?? `${filters.report_type}_report.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generating, error, generatePDF };
}