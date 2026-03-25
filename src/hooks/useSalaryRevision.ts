// ── hooks/useSalaryRevision.ts ────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { authFetch } from "./api";
import type { SalaryRevision, RevisionReason } from "@/types/salaryRevision";

export function useSalaryRevision() {
  const [revisions, setRevisions] = useState<SalaryRevision[]>([]);
  const [isLoading, setLoading]   = useState(false);

  const fetchRevisions = useCallback(async (employeeId?: number) => {
    setLoading(true);
    try {
      const p = employeeId ? `?employee_id=${employeeId}` : "";
      const res = await authFetch(`/api/salary-revisions${p}`);
      setRevisions(await res.json());
    } finally { setLoading(false); }
  }, []);

  const createRevision = useCallback(async (data: {
    employee_id: number;
    new_salary: number;
    reason: RevisionReason;
    effective_date: string;
    notes?: string;
  }) => {
    const res = await authFetch("/api/salary-revisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create revision");
    return res.json();
  }, []);

  return { revisions, isLoading, fetchRevisions, createRevision };
}