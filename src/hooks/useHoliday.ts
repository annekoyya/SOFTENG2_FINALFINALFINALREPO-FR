import { useState, useCallback } from "react";
import { authFetch } from "./api";
import type { Holiday } from "@/types/holiday";

export function useHoliday() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setLoading] = useState(false);

  const fetchHolidays = useCallback(async (year?: number) => {
    setLoading(true);
    try {
      const p = year ? `?year=${year}` : "";
      const res = await authFetch(`/api/holidays${p}`);
      setHolidays(await res.json());
    } finally { setLoading(false); }
  }, []);

  const createHoliday = useCallback(async (data: Partial<Holiday>) => {
    const res = await authFetch("/api/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create holiday");
    return res.json();
  }, []);

  const deleteHoliday = useCallback(async (id: number) => {
    const res = await authFetch(`/api/holidays/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete holiday");
  }, []);

  return { holidays, isLoading, fetchHolidays, createHoliday, deleteHoliday };
}