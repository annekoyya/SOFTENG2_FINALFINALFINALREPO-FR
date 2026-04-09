// src/hooks/useEvaluation.ts
// REPLACE ENTIRE FILE

import { useState, useCallback } from "react";
import { authFetch } from "./api";

export interface LikertOption {
  label: string;
  value: number;
  order?: number;
}

export interface EvaluationQuestion {
  id?: number;
  text: string;
  type: "likert" | "open_ended";
  order: number;
}

export interface EvaluationSection {
  id?: number;
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
  responses_data?: string | null;
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
  assignments_count?: number;
  responses_count?: number;
  pending_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFormData {
  title: string;
  department: string;
  deadline?: string;
  date_start?: string;
  sections: EvaluationSection[];
  evaluator_ids: number[];
  save_as_draft?: boolean;
}

export interface QuestionResponse {
  question_id: number;
  rating?: number;
  text_response?: string;
}

export interface AnalyticsData {
  form: { id: number; title: string; department: string; status: string; deadline: string | null };
  total_evaluators: number;
  responses_received: number;
  pending_responses: number;
  average_score: string;
  sections: {
    title: string;
    type: string;
    questions: {
      id?: number;
      text: string;
      type: string;
      likert_summary?: Record<string, number>;
      text_responses?: string[];
      response_count?: number;
      average_rating?: number;
    }[];
  }[];
}

export function useEvaluation() {
  const [forms,         setForms]         = useState<EvaluationForm[]>([]);
  const [analytics,     setAnalytics]     = useState<AnalyticsData | null>(null);
  const [myAssignments, setMyAssignments] = useState<{ pending: EvaluationAssignment[]; completed: EvaluationAssignment[] }>({ pending: [], completed: [] });
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const wrap = async <T>(fn: () => Promise<T>): Promise<T> => {
    setIsLoading(true); setError(null);
    try { return await fn(); }
    catch (e) { const msg = e instanceof Error ? e.message : "Error"; setError(msg); throw e; }
    finally { setIsLoading(false); }
  };

  const fetchForms = useCallback((filters?: { status?: string; department?: string }) =>
    wrap(async () => {
      const p = new URLSearchParams();
      if (filters?.status)     p.set("status",     filters.status);
      if (filters?.department) p.set("department", filters.department);
      const res  = await authFetch(`/api/evaluations?${p}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setForms(Array.isArray(body.data) ? body.data : []);
    }), []);

  const createForm = useCallback((data: CreateFormData) =>
    wrap(async () => {
      const res  = await authFetch("/api/evaluations", { method: "POST", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to create");
      setForms(prev => [body.data, ...prev]);
      return body.data as EvaluationForm;
    }), []);

  const updateForm = useCallback((id: number, data: Partial<EvaluationForm> & { sections?: EvaluationSection[] }) =>
    wrap(async () => {
      const res  = await authFetch(`/api/evaluations/${id}`, { method: "PUT", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to update");
      setForms(prev => prev.map(f => f.id === id ? body.data : f));
    }), []);

  const deleteForm = useCallback((id: number) =>
    wrap(async () => {
      const res  = await authFetch(`/api/evaluations/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to delete");
      setForms(prev => prev.filter(f => f.id !== id));
    }), []);

  const sendForm = useCallback((id: number) =>
    wrap(async () => {
      const res  = await authFetch(`/api/evaluations/${id}/send`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to send");
      setForms(prev => prev.map(f => f.id === id ? { ...f, status: "active" as const } : f));
    }), []);

  const closeForm = useCallback((id: number) =>
    wrap(async () => {
      const res  = await authFetch(`/api/evaluations/${id}/close`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to close");
      setForms(prev => prev.map(f => f.id === id ? { ...f, status: "closed" as const } : f));
    }), []);

  const fetchAnalytics = useCallback((formId: number) =>
    wrap(async () => {
      const res  = await authFetch(`/api/evaluations/${formId}/analytics`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setAnalytics(body.data);
    }), []);

  const fetchMyAssignments = useCallback(() =>
    wrap(async () => {
      const res  = await authFetch("/api/evaluations/my-assignments");
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setMyAssignments(body.data ?? { pending: [], completed: [] });
    }), []);

  const submitAssignment = useCallback((assignmentId: number, responses: QuestionResponse[]) =>
    wrap(async () => {
      const res  = await authFetch(`/api/evaluations/assignments/${assignmentId}/submit`, {
        method: "POST", body: JSON.stringify({ responses }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to submit");
    }), []);

  return {
    forms, analytics, myAssignments, isLoading, error,
    fetchForms, createForm, updateForm, deleteForm,
    sendForm, closeForm, fetchAnalytics, fetchMyAssignments, submitAssignment,
    clearError: () => setError(null),
  };
}