// src/hooks/useEmployees.ts
import { useState, useCallback } from "react";
import { authFetch } from "./api";
import { Employee, EmployeeFormData } from "@/types/employee";

export type { Employee };

export interface EmployeeFilters {
  search?: string;
  department?: string;
  employment_type?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface UseEmployeesReturn {
  employees: Employee[];
  archivedEmployees: Employee[];
  selectedEmployee: Employee | null;
  pagination: Omit<PaginatedResponse<Employee>, "data"> | null;
  isLoading: boolean;
  error: string | null;
  fetchEmployees: (filters?: EmployeeFilters) => Promise<void>;
  fetchArchivedEmployees: (search?: string) => Promise<void>;
  fetchEmployee: (id: number) => Promise<void>;
  // Aliased names to match existing page code
  addEmployee: (data: EmployeeFormData) => Promise<Employee>;
  createEmployee: (data: EmployeeFormData) => Promise<Employee>;
  updateEmployee: (id: number, data: EmployeeFormData) => Promise<Employee>;
  updateStatus: (id: number, status: Employee["status"], endDate?: string) => Promise<void>;
  deleteEmployee: (id: number) => Promise<void>;   // alias → archiveEmployee
  archiveEmployee: (id: number) => Promise<void>;
  purgeEmployee: (id: number) => Promise<void>;    // hard delete (admin only)
  restoreEmployee: (id: number) => Promise<void>;
  clearSelectedEmployee: () => void;
  clearError: () => void;
}

export function useEmployees(): UseEmployeesReturn {
  const [employees, setEmployees]                 = useState<Employee[]>([]);
  const [archivedEmployees, setArchivedEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee]   = useState<Employee | null>(null);
  const [pagination, setPagination]               = useState<Omit<PaginatedResponse<Employee>, "data"> | null>(null);
  const [isLoading, setIsLoading]                 = useState(false);
  const [error, setError]                         = useState<string | null>(null);

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : "An error occurred";
    setError(message);
    console.error("Employee error:", err);
  };

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const fetchEmployees = useCallback(async (filters?: EmployeeFilters) => {
    setIsLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.search)          params.append("search", filters.search);
      if (filters?.department)      params.append("department", filters.department);
      if (filters?.employment_type) params.append("employment_type", filters.employment_type);
      if (filters?.status)          params.append("status", filters.status);
      if (filters?.page)            params.append("page", String(filters.page));
      if (filters?.per_page)        params.append("per_page", String(filters.per_page));

      const res  = await authFetch(`/api/employees?${params.toString()}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch employees");

      const payload: PaginatedResponse<Employee> = body.data;
      setEmployees(payload.data);
      setPagination({ current_page: payload.current_page, last_page: payload.last_page, per_page: payload.per_page, total: payload.total });
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const fetchArchivedEmployees = useCallback(async (search?: string) => {
    setIsLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res  = await authFetch(`/api/employees/archived?${params.toString()}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch archived employees");
      setArchivedEmployees(body.data?.data ?? body.data ?? []);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const fetchEmployee = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch employee");
      setSelectedEmployee(body.data);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  // ─── Create ────────────────────────────────────────────────────────────────

  const createEmployee = useCallback(async (data: EmployeeFormData): Promise<Employee> => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/employees", { method: "POST", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to create employee");
      setEmployees((prev) => [body.data, ...prev]);
      return body.data as Employee;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // Alias for pages that use addEmployee
  const addEmployee = createEmployee;

  // ─── Update ────────────────────────────────────────────────────────────────

  const updateEmployee = useCallback(async (id: number, data: EmployeeFormData): Promise<Employee> => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}`, { method: "PUT", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to update employee");
      setEmployees((prev) => prev.map((e) => (e.id === id ? body.data : e)));
      if (selectedEmployee?.id === id) setSelectedEmployee(body.data);
      return body.data as Employee;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, [selectedEmployee]);

  const updateStatus = useCallback(async (id: number, status: Employee["status"], endDate?: string) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, end_date: endDate }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to update status");
      setEmployees((prev) => prev.map((e) => (e.id === id ? body.data : e)));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Archive / Restore / Purge ─────────────────────────────────────────────

  const archiveEmployee = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to archive employee");
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // Alias for pages that use deleteEmployee
  const deleteEmployee = archiveEmployee;

  const purgeEmployee = useCallback(async (id: number) => {
    // Hard delete — permanently removes from DB (admin only)
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}/purge`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to permanently delete employee");
      setArchivedEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const restoreEmployee = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/employees/${id}/restore`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to restore employee");
      setArchivedEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const clearSelectedEmployee = useCallback(() => setSelectedEmployee(null), []);
  const clearError             = useCallback(() => setError(null), []);

  return {
    employees,
    archivedEmployees,
    selectedEmployee,
    pagination,
    isLoading,
    error,
    fetchEmployees,
    fetchArchivedEmployees,
    fetchEmployee,
    addEmployee,
    createEmployee,
    updateEmployee,
    updateStatus,
    deleteEmployee,
    archiveEmployee,
    purgeEmployee,
    restoreEmployee,
    clearSelectedEmployee,
    clearError,
  };
}