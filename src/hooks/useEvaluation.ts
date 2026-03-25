// src/hooks/useEvaluation.ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useCallback } from "react";
import { authFetch } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LikertOption {
  id?: number;
  label: string;
  value: number;
  order?: number;
}

export interface EvaluationQuestion {
  id?: number;
  evaluation_section_id?: number;
  text: string;
  type: "likert" | "open_ended";
  order: number;
}

export interface EvaluationSection {
  id?: number;
  evaluation_form_id?: number;
  title: string;
  description?: string;
  type: "likert" | "open_ended";
  likert_options: LikertOption[];
  questions: EvaluationQuestion[];
  order: number;
}

export interface EvaluationAssignment {
  id: number;
  evaluation_form_id: number;
  user_id: number;
  status: "pending" | "submitted";
  submitted_at: string | null;
  user?: { id: number; name: string; email: string; role: string };
}

export interface EvaluationForm {
  id: number;
  title: string;
  department: string;
  status: "draft" | "active" | "closed";
  deadline: string | null;
  date_start: string | null;
  date_end: string | null;
  created_by: number;
  sections: EvaluationSection[];
  assignments?: EvaluationAssignment[];
  creator?: { id: number; name: string };
  // These come from withCount() on the backend
  assignments_count?: number;
  responses_count?: number;
  pending_count?: number;
  created_at: string;
  updated_at: string;
}

// Explicit type for creating a new form — used by FormBuilder and Performance page
export interface CreateFormData {
  title: string;
  department: string;
  deadline?: string;
  date_start?: string;
  date_end?: string;
  sections: EvaluationSection[];
  evaluator_ids: number[];
  save_as_draft?: boolean;
}

export interface QuestionResponse {
  question_id: number;
  likert_value?: number;
  text_response?: string;
}

export interface AnalyticsData {
  form: {
    id: number;
    title: string;
    department: string;
    status: string;
    deadline: string | null;
  };
  total_evaluators: number;
  responses_received: number;
  pending_responses: number;
  average_score: string;
  sections: {
    title: string;
    type: string;
    questions: {
      text: string;
      type: string;
      likert_summary?: Record<string, number>;
      text_responses?: string[];
    }[];
  }[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEvaluation() {
  const [forms, setForms]               = useState<EvaluationForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<EvaluationForm | null>(null);
  const [analytics, setAnalytics]       = useState<AnalyticsData | null>(null);
  const [myAssignments, setMyAssignments] = useState<EvaluationAssignment[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const handleError = (err: unknown) => {
    setError(err instanceof Error ? err.message : "An error occurred");
    console.error("Evaluation error:", err);
  };

  // ─── Fetch all forms (Admin/Manager view) ─────────────────────────────────

  const fetchForms = useCallback(async (filters?: { status?: string; department?: string }) => {
    setIsLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.status)     params.append("status", filters.status);
      if (filters?.department) params.append("department", filters.department);

      const res  = await authFetch(`/api/evaluations?${params}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch evaluations");

      setForms(body.data?.data ?? body.data ?? []);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  // ─── Fetch single form ────────────────────────────────────────────────────

  const fetchForm = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/evaluations/${id}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch form");
      setSelectedForm(body.data);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  // ─── Create form ──────────────────────────────────────────────────────────

  const createForm = useCallback(async (data: {
    title: string;
    department: string;
    deadline?: string;
    date_start?: string;
    date_end?: string;
    sections: EvaluationSection[];
    evaluator_ids: number[];
    save_as_draft?: boolean;
  }): Promise<EvaluationForm> => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/evaluations", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to create evaluation");
      const newForm = body.data as EvaluationForm;
      setForms(prev => [newForm, ...prev]);
      return newForm;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Update form ──────────────────────────────────────────────────────────

  const updateForm = useCallback(async (id: number, data: Partial<EvaluationForm>) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/evaluations/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to update");
      setForms(prev => prev.map(f => f.id === id ? body.data : f));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Delete form ──────────────────────────────────────────────────────────

  const deleteForm = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/evaluations/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to delete");
      setForms(prev => prev.filter(f => f.id !== id));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Fetch analytics ─────────────────────────────────────────────────────

  const fetchAnalytics = useCallback(async (formId: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/evaluations/${formId}/analytics`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch analytics");
      setAnalytics(body.data);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  // ─── HR: fetch my assignments ─────────────────────────────────────────────

  const fetchMyAssignments = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/evaluations/my-assignments");
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch assignments");
      setMyAssignments(body.data ?? []);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  // ─── HR: submit evaluation ────────────────────────────────────────────────

  const submitAssignment = useCallback(async (
    assignmentId: number,
    responses: QuestionResponse[]
  ) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(
        `/api/evaluations/assignments/${assignmentId}/submit`,
        { method: "POST", body: JSON.stringify({ responses }) }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to submit");
      // Update assignment status in local state
      setMyAssignments(prev =>
        prev.map(a => a.id === assignmentId ? { ...a, status: "submitted" as const } : a)
      );
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Send draft form (activate it) ───────────────────────────────────────

  const sendForm = useCallback(async (formId: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/evaluations/${formId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "active" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to activate form");
      setForms(prev => prev.map(f => f.id === formId ? { ...f, status: "active" } : f));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  return {
    forms,
    selectedForm,
    analytics,
    myAssignments,
    isLoading,
    error,
    fetchForms,
    fetchForm,
    createForm,
    updateForm,
    deleteForm,
    fetchAnalytics,
    fetchMyAssignments,
    submitAssignment,
    sendForm,
    setSelectedForm,
    clearError: () => setError(null),
  };
}