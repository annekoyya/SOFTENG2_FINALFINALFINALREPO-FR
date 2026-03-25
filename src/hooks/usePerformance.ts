// src/hooks/usePerformance.ts
import { useState, useCallback } from "react";
import { authFetch } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvaluationQuestion {
  id: number;
  evaluation_template_id: number;
  question: string;
  description: string | null;
  type: "rating" | "text" | "yes_no" | "multiple_choice";
  options: string[] | null;
  category: string | null;
  weight: number;
  order: number;
  is_required: boolean;
}

export interface EvaluationTemplate {
  id: number;
  title: string;
  description: string | null;
  created_by: number;
  period_type: "monthly" | "quarterly" | "semi_annual" | "annual" | "probationary" | "custom";
  rating_scale: "1_to_5" | "1_to_10" | "percentage";
  is_active: boolean;
  department: string | null;
  questions?: EvaluationQuestion[];
  creator?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

export interface EvaluationResponse {
  id: number;
  evaluation_id: number;
  evaluation_question_id: number;
  score: number | null;
  text_response: string | null;
  weighted_score: number | null;
  comment: string | null;
  question?: EvaluationQuestion;
}

export interface Evaluation {
  id: number;
  employee_id: number;
  evaluation_template_id: number;
  evaluator_id: number;
  period_start: string;
  period_end: string;
  period_label: string | null;
  status: "draft" | "submitted" | "reviewed" | "acknowledged" | "completed";
  total_score: number | null;
  max_possible_score: number | null;
  percentage_score: number | null;
  overall_rating: "outstanding" | "exceeds_expectations" | "meets_expectations" | "needs_improvement" | "unsatisfactory" | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  manager_comments: string | null;
  acknowledged_at: string | null;
  employee_comments: string | null;
  notes: string | null;
  employee?: { id: number; first_name: string; last_name: string; department: string };
  template?: EvaluationTemplate;
  evaluator?: { id: number; name: string };
  responses?: EvaluationResponse[];
  created_at: string;
}

export interface Kpi {
  id: number;
  employee_id: number;
  set_by: number;
  title: string;
  description: string | null;
  unit: string | null;
  target_value: number;
  current_value: number;
  weight: number;
  start_date: string;
  end_date: string;
  status: "active" | "achieved" | "not_achieved" | "cancelled";
  category: "productivity" | "quality" | "attendance" | "customer_service" | "teamwork" | "other";
  notes: string | null;
  employee?: { id: number; first_name: string; last_name: string };
}

export interface Goal {
  id: number;
  employee_id: number;
  set_by: number;
  title: string;
  description: string | null;
  due_date: string;
  progress: number;
  priority: "low" | "medium" | "high" | "critical";
  status: "not_started" | "in_progress" | "completed" | "overdue" | "cancelled";
  category: "professional_development" | "performance" | "project" | "behavioral" | "other";
  evaluation_id: number | null;
  completion_notes: string | null;
  completed_at: string | null;
  employee?: { id: number; first_name: string; last_name: string };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePerformance() {
  const [templates, setTemplates]       = useState<EvaluationTemplate[]>([]);
  const [evaluations, setEvaluations]   = useState<Evaluation[]>([]);
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [kpis, setKpis]                 = useState<Kpi[]>([]);
  const [goals, setGoals]               = useState<Goal[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const handleError = (err: unknown) => {
    setError(err instanceof Error ? err.message : "An error occurred");
  };

  // ─── Templates ─────────────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/performance/templates");
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch templates");
      setTemplates(body.data?.data ?? body.data ?? []);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const createTemplate = useCallback(async (data: Partial<EvaluationTemplate>): Promise<EvaluationTemplate> => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/performance/templates", { method: "POST", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to create template");
      setTemplates(prev => [body.data, ...prev]);
      return body.data;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const updateTemplate = useCallback(async (id: number, data: Partial<EvaluationTemplate>) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/performance/templates/${id}`, { method: "PUT", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to update template");
      setTemplates(prev => prev.map(t => t.id === id ? body.data : t));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Evaluations ───────────────────────────────────────────────────────────

  const fetchEvaluations = useCallback(async (filters?: { status?: string; employee_id?: number }) => {
    setIsLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.status)      params.append("status", filters.status);
      if (filters?.employee_id) params.append("employee_id", String(filters.employee_id));
      const res  = await authFetch(`/api/performance/evaluations?${params}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch evaluations");
      setEvaluations(body.data?.data ?? body.data ?? []);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const fetchEvaluation = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/performance/evaluations/${id}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch evaluation");
      setSelectedEval(body.data);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const createEvaluation = useCallback(async (data: Partial<Evaluation>): Promise<Evaluation> => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/performance/evaluations", { method: "POST", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to create evaluation");
      setEvaluations(prev => [body.data, ...prev]);
      return body.data;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const saveResponses = useCallback(async (evalId: number, responses: Partial<EvaluationResponse>[]) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/performance/evaluations/${evalId}/responses`, { method: "POST", body: JSON.stringify({ responses }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to save responses");
      return body.data;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const submitEvaluation = useCallback(async (id: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/performance/evaluations/${id}/submit`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to submit");
      setEvaluations(prev => prev.map(e => e.id === id ? body.data : e));
      if (selectedEval?.id === id) setSelectedEval(body.data);
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, [selectedEval]);

  const reviewEvaluation = useCallback(async (id: number, comments: string) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/performance/evaluations/${id}/review`, { method: "POST", body: JSON.stringify({ comments }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to review");
      setEvaluations(prev => prev.map(e => e.id === id ? body.data : e));
      if (selectedEval?.id === id) setSelectedEval(body.data);
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, [selectedEval]);

  // ─── KPIs ──────────────────────────────────────────────────────────────────

  const fetchKpis = useCallback(async (employeeId?: number) => {
    setIsLoading(true); setError(null);
    try {
      const params = employeeId ? `?employee_id=${employeeId}` : "";
      const res  = await authFetch(`/api/performance/kpis${params}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch KPIs");
      setKpis(body.data?.data ?? body.data ?? []);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const createKpi = useCallback(async (data: Partial<Kpi>): Promise<Kpi> => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/performance/kpis", { method: "POST", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to create KPI");
      setKpis(prev => [body.data, ...prev]);
      return body.data;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const updateKpiProgress = useCallback(async (id: number, currentValue: number) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/performance/kpis/${id}/progress`, { method: "PATCH", body: JSON.stringify({ current_value: currentValue }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to update KPI");
      setKpis(prev => prev.map(k => k.id === id ? body.data : k));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  // ─── Goals ─────────────────────────────────────────────────────────────────

  const fetchGoals = useCallback(async (employeeId?: number) => {
    setIsLoading(true); setError(null);
    try {
      const params = employeeId ? `?employee_id=${employeeId}` : "";
      const res  = await authFetch(`/api/performance/goals${params}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to fetch goals");
      setGoals(body.data?.data ?? body.data ?? []);
    } catch (err) { handleError(err); }
    finally { setIsLoading(false); }
  }, []);

  const createGoal = useCallback(async (data: Partial<Goal>): Promise<Goal> => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch("/api/performance/goals", { method: "POST", body: JSON.stringify(data) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to create goal");
      setGoals(prev => [body.data, ...prev]);
      return body.data;
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  const updateGoalProgress = useCallback(async (id: number, progress: number, notes?: string) => {
    setIsLoading(true); setError(null);
    try {
      const res  = await authFetch(`/api/performance/goals/${id}/progress`, { method: "PATCH", body: JSON.stringify({ progress, notes }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Failed to update goal");
      setGoals(prev => prev.map(g => g.id === id ? body.data : g));
    } catch (err) { handleError(err); throw err; }
    finally { setIsLoading(false); }
  }, []);

  return {
    templates, evaluations, selectedEval, kpis, goals, isLoading, error,
    fetchTemplates, createTemplate, updateTemplate,
    fetchEvaluations, fetchEvaluation, createEvaluation, saveResponses,
    submitEvaluation, reviewEvaluation,
    fetchKpis, createKpi, updateKpiProgress,
    fetchGoals, createGoal, updateGoalProgress,
    clearSelectedEval: () => setSelectedEval(null),
    clearError: () => setError(null),
  };
}