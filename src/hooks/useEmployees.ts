// src/hooks/useEmployees.ts
import { useState, useCallback } from "react";
import { authFetch } from "./api";
import type { Employee, EmployeeFormData } from "@/types/employee";

interface Filters {
  search?: string;
  status?: string;
  department?: string;
}

export function useEmployees() {
  const [employees,         setEmployees]         = useState<Employee[]>([]);
  const [archivedEmployees, setArchived]          = useState<Employee[]>([]);
  const [selectedEmployee,  setSelected]          = useState<Employee | null>(null);
  const [departments,       setDepartments]       = useState<string[]>([]);
  const [jobCategories,     setJobCategories]     = useState<string[]>([]);
  const [salaryMap,         setSalaryMap]         = useState<Record<string, number>>({});
  const [isLoading,         setIsLoading]         = useState(false);
  const [error,             setError]             = useState<string | null>(null);

  const safe = (data: unknown): Employee[] => {
    if (Array.isArray(data)) return data;
    const d = data as { data?: Employee[] };
    return Array.isArray(d?.data) ? d.data : [];
  };

  const handleError = (err: unknown) =>
    setError(err instanceof Error ? err.message : "An error occurred");

  // ─── Fetch active employees ───────────────────────────────────────────────
  const fetchEmployees = useCallback(async (filters: Filters = {}) => {
    setIsLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search)     params.set("search",     filters.search);
      if (filters.status)     params.set("status",     filters.status);
      if (filters.department) params.set("department", filters.department);
      params.set("per_page", "100");

      const res  = await authFetch(`/api/employees?${params}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setEmployees(safe(body.data));
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  // ─── Fetch archived employees ─────────────────────────────────────────────
  const fetchArchived = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/employees/archived");
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setArchived(safe(body.data));
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  // ─── Fetch single ─────────────────────────────────────────────────────────
  const fetchEmployee = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setSelected(body.data);
      return body.data as Employee;
    } catch (err) { handleError(err); return null; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Create ───────────────────────────────────────────────────────────────
  const createEmployee = useCallback(async (data: EmployeeFormData) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/employees", { method: "POST", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to create");
      setEmployees(prev => [body.data, ...prev]);
      return body.data as Employee;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Update (FIX #2: use PUT + correct endpoint) ──────────────────────────
  const updateEmployee = useCallback(async (id: number, data: Partial<EmployeeFormData>) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to update");
      const updated = body.data as Employee;
      setEmployees(prev => prev.map(e => e.id === id ? updated : e));
      if (selectedEmployee?.id === id) setSelected(updated);
      return updated;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, [selectedEmployee]);

  // ─── Archive (soft delete) ────────────────────────────────────────────────
  const archiveEmployee = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Restore ──────────────────────────────────────────────────────────────
  const restoreEmployee = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}/restore`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setArchived(prev => prev.filter(e => e.id !== id));
      setEmployees(prev => [body.data, ...prev]);
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Purge (FIX #5: "Permanently Delete" only in archived tab, not directory) ─
  const purgeEmployee = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}/purge`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setArchived(prev => prev.filter(e => e.id !== id));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Role update ──────────────────────────────────────────────────────────
  const updateRole = useCallback(async (id: number, role: Employee["role"]) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}/role`, {
        method: "PATCH", body: JSON.stringify({ role }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setEmployees(prev => prev.map(e => e.id === id ? body.data : e));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Dropdowns ───────────────────────────────────────────────────────────
  const fetchDepartments = useCallback(async () => {
    try {
      const res  = await authFetch("/api/employees/departments");
      const body = await res.json();
      setDepartments(Array.isArray(body.data) ? body.data : []);
    } catch { /* non-critical */ }
  }, []);

  const fetchJobCategories = useCallback(async (department?: string) => {
    try {
      const url = department
        ? `/api/employees/job-categories?department=${encodeURIComponent(department)}`
        : "/api/employees/job-categories";
      const res  = await authFetch(url);
      const body = await res.json();
      setJobCategories(Array.isArray(body.data) ? body.data : []);
    } catch { /* non-critical */ }
  }, []);

  const fetchSalaryMap = useCallback(async () => {
    try {
      const res  = await authFetch("/api/employees/salary-mapping");
      const body = await res.json();
      setSalaryMap(body.data ?? {});
      return body.data as Record<string, number>;
    } catch { return {}; }
  }, []);

  // FIX #3: Export to JSON download
  const exportEmployee = useCallback(async (id: number, firstName: string, lastName: string) => {
    try {
      const res  = await authFetch(`/api/employees/${id}/export`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Export failed");
      const blob = new Blob([JSON.stringify(body.data, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `employee_${id}_${lastName}_${firstName}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { handleError(err); }
  }, []);

  return {
    employees,
    archivedEmployees,
    selectedEmployee,
    departments,
    jobCategories,
    salaryMap,
    isLoading,
    error,
    fetchEmployees,
    fetchArchived,
    fetchEmployee,
    createEmployee,
    updateEmployee,
    archiveEmployee,
    restoreEmployee,
    purgeEmployee,
    updateRole,
    fetchDepartments,
    fetchJobCategories,
    fetchSalaryMap,
    exportEmployee,
    setSelectedEmployee: setSelected,
    clearError: () => setError(null),
  };
}