// src/hooks/useNewHires.ts
import { useState, useCallback } from "react";
import { authFetch } from "./api";

export interface NewHire {
  id: number;
  created_by: number;
  onboarding_status: "pending" | "complete" | "transferred";
  employee_id: number | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  name_extension: string | null;
  date_of_birth: string | null;
  email: string;
  phone_number: string | null;
  home_address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  relationship: string | null;
  tin: string | null;
  sss_number: string | null;
  pagibig_number: string | null;
  philhealth_number: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  start_date: string | null;
  department: string | null;
  job_category: string | null;
  employment_type: "regular" | "probationary" | "contractual" | "part_time" | "intern";
  role: string;
  basic_salary: number | null;
  reporting_manager: string | null;
  transferred_at: string | null;
  creator?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

export type NewHireFormData = Omit<NewHire,
  "id" | "created_by" | "onboarding_status" | "employee_id" |
  "transferred_at" | "creator" | "created_at" | "updated_at"
>;

// Required fields matching backend REQUIRED_FIELDS const
export const REQUIRED_FIELDS: (keyof NewHire)[] = [
  "first_name", "last_name", "date_of_birth", "email",
  "phone_number", "home_address",
  "emergency_contact_name", "emergency_contact_number", "relationship",
  "start_date", "department", "job_category", "basic_salary",
];

export function getCompletionPct(hire: Partial<NewHire>): number {
  const filled = REQUIRED_FIELDS.filter(f => {
    const v = hire[f];
    return v !== null && v !== undefined && v !== "";
  }).length;
  return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

export function getMissingFields(hire: Partial<NewHire>): string[] {
  return REQUIRED_FIELDS.filter(f => {
    const v = hire[f];
    return v === null || v === undefined || v === "";
  }) as string[];
}

export function useNewHires() {
  const [newHires, setNewHires]     = useState<NewHire[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    setError(err instanceof Error ? err.message : "An error occurred");
  };

  const fetchNewHires = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/new-hires");
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch");
      setNewHires(body.data?.data ?? body.data ?? []);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const createNewHire = useCallback(async (data: Partial<NewHireFormData>): Promise<NewHire> => {
    setIsLoading(true); setError(null); setTransferMessage(null);
    try {
      const res  = await authFetch("/api/new-hires", { method: "POST", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to create");
      const hire = body.data as NewHire;
      if (hire.onboarding_status !== "transferred") {
        setNewHires(prev => [hire, ...prev]);
      }
      setTransferMessage(body.message);
      return hire;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const updateNewHire = useCallback(async (id: number, data: Partial<NewHireFormData>): Promise<NewHire> => {
    setIsLoading(true); setError(null); setTransferMessage(null);
    try {
      const res  = await authFetch(`/api/new-hires/${id}`, { method: "PUT", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to update");
      const hire = body.data as NewHire;
      setTransferMessage(body.message);
      // If transferred, remove from new hires list
      if (hire.onboarding_status === "transferred") {
        setNewHires(prev => prev.filter(h => h.id !== id));
      } else {
        setNewHires(prev => prev.map(h => h.id === id ? hire : h));
      }
      return hire;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const deleteNewHire = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/new-hires/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to delete");
      setNewHires(prev => prev.filter(h => h.id !== id));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  return {
    newHires, isLoading, error, transferMessage,
    fetchNewHires, createNewHire, updateNewHire, deleteNewHire,
    clearError: () => setError(null),
    clearTransferMessage: () => setTransferMessage(null),
  };
}