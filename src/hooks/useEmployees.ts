// src/hooks/useEmployees.ts
import { useState, useCallback } from "react";
import { authFetch } from "./api";
import type { Employee, EmployeeFormData } from "@/types/employee";

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface Filters {
  search?: string;
  status?: string;
  department?: string;
}

export function useEmployees() {
  const [employees, setEmployees]           = useState<Employee[]>([]);
  const [archivedEmployees, setArchived]    = useState<Employee[]>([]);
  const [selectedEmployee, setSelected]     = useState<Employee | null>(null);
  const [departments, setDepartments]       = useState<string[]>([]);
  const [jobCategories, setJobCategories]   = useState<string[]>([]);
  const [salaryMap, setSalaryMap]           = useState<Record<string, number>>({});
  const [pagination, setPagination]         = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const handleError = (err: unknown) =>
    setError(err instanceof Error ? err.message : "An error occurred");

  // ─── Fetch employees ───────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async (filters: Filters = {}, page = 1) => {
    setIsLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search)     params.set("search", filters.search);
      if (filters.status)     params.set("status", filters.status);
      if (filters.department) params.set("department", filters.department);
      params.set("page", String(page));

      const res  = await authFetch(`/api/employees?${params}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch employees");

      const paged = body.data as PaginatedResponse<Employee>;
      setEmployees(Array.isArray(paged.data) ? paged.data : []);
      setPagination({ current_page: paged.current_page, last_page: paged.last_page, total: paged.total });
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  // ─── Fetch archived employees ──────────────────────────────────────────────
  const fetchArchivedEmployees = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/employees/archived");
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      const paged = body.data as PaginatedResponse<Employee>;
      setArchived(Array.isArray(paged.data) ? paged.data : []);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  // Alias for backward compatibility with existing code
  const fetchArchived = fetchArchivedEmployees;

  // ─── Fetch single ──────────────────────────────────────────────────────────
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

  // ─── Create ────────────────────────────────────────────────────────────────
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

  // ─── Update ────────────────────────────────────────────────────────────────
  const updateEmployee = useCallback(async (id: number, data: Partial<EmployeeFormData>) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}`, { method: "PUT", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to update");
      setEmployees(prev => prev.map(e => e.id === id ? body.data : e));
      if (selectedEmployee?.id === id) setSelected(body.data);
      return body.data as Employee;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, [selectedEmployee]);

  // ─── Archive (soft delete) ─────────────────────────────────────────────────
  const archiveEmployee = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to archive");
      setEmployees(prev => prev.filter(e => e.id !== id));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Restore ───────────────────────────────────────────────────────────────
  const restoreEmployee = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}/restore`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to restore");
      setArchived(prev => prev.filter(e => e.id !== id));
      setEmployees(prev => [body.data, ...prev]);
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Purge ─────────────────────────────────────────────────────────────────
  const purgeEmployee = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}/purge`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to purge");
      setArchived(prev => prev.filter(e => e.id !== id));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Update role ───────────────────────────────────────────────────────────
  const updateRole = useCallback(async (id: number, role: Employee["role"]) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setEmployees(prev => prev.map(e => e.id === id ? body.data : e));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Dropdowns ────────────────────────────────────────────────────────────
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
    } catch { /* non-critical */ }
  }, []);

  return {
    employees,
    archivedEmployees,
    selectedEmployee,
    departments,
    jobCategories,
    salaryMap,
    pagination,
    isLoading,
    error,
    fetchEmployees,
    fetchArchived,        // ← Alias for fetchArchivedEmployees
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
    setSelectedEmployee: setSelected,
    clearError: () => setError(null),
  };
}