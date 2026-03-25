// ── types/salaryRevision.ts ───────────────────────────────────────────────────

export type RevisionReason =
  | "promotion"
  | "annual_review"
  | "merit"
  | "market_adjustment"
  | "correction"
  | "other";

export interface SalaryRevision {
  id: number;
  employee_id: number;
  employee_name?: string;
  department?: string;
  previous_salary: number;
  new_salary: number;
  change_amount: number;    // new - previous
  change_pct: number;       // % change
  reason: RevisionReason;
  notes?: string;
  effective_date: string;
  approved_by?: number;
  approved_by_name?: string;
  created_at: string;
}

export const REVISION_REASON_LABELS: Record<RevisionReason, string> = {
  promotion:          "Promotion",
  annual_review:      "Annual review",
  merit:              "Merit increase",
  market_adjustment:  "Market adjustment",
  correction:         "Correction",
  other:              "Other",
};