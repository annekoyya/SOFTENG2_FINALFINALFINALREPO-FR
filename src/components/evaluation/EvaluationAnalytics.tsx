// src/components/evaluation/EvaluationAnalytics.tsx
// REPLACE ENTIRE FILE

import { ArrowLeft, Users, CheckCircle, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AnalyticsData } from "@/hooks/useEvaluation";

interface Props {
  analytics: AnalyticsData;
  onBack: () => void;
}

const RATING_COLORS: Record<string, string> = {
  Excellent: "#22c55e",
  "Very Good": "#3b82f6",
  Good:      "#f59e0b",
  Fair:      "#f97316",
  Poor:      "#ef4444",
};

function DonutChart({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-xs text-muted-foreground text-center py-2">No responses yet</p>;

  const entries = Object.entries(data);
  let cumulative = 0;
  const slices = entries.map(([label, count]) => {
    const pct    = count / total;
    const start  = cumulative;
    cumulative  += pct;
    return { label, count, pct, start };
  });

  const describeArc = (start: number, pct: number) => {
    const r    = 40;
    const cx   = 50; const cy = 50;
    const a1   = (start - 0.25) * 2 * Math.PI;
    const a2   = (start + pct - 0.25) * 2 * Math.PI;
    const x1   = cx + r * Math.cos(a1); const y1 = cy + r * Math.sin(a1);
    const x2   = cx + r * Math.cos(a2); const y2 = cy + r * Math.sin(a2);
    const large = pct > 0.5 ? 1 : 0;
    return `M${cx},${cy} L${x1},${y1} A${r},${r},0,${large},1,${x2},${y2} Z`;
  };

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-20 h-20 shrink-0">
        {slices.map(({ label, start, pct }) => (
          <path key={label} d={describeArc(start, pct)} fill={RATING_COLORS[label] ?? "#94a3b8"} />
        ))}
        <circle cx="50" cy="50" r="26" fill="white" />
        <text x="50" y="55" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1a1a2e">
          {total}
        </text>
      </svg>
      <div className="space-y-1">
        {slices.map(({ label, count, pct }) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: RATING_COLORS[label] ?? "#94a3b8" }} />
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium ml-auto">{count} <span className="text-muted-foreground">({Math.round(pct * 100)}%)</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: RATING_COLORS[label] ?? "#94a3b8" }} />
      </div>
      <span className="w-8 text-right font-medium text-muted-foreground">{count}</span>
    </div>
  );
}

export function EvaluationAnalytics({ analytics, onBack }: Props) {
  const responseRate = analytics.total_evaluators > 0
    ? Math.round((analytics.responses_received / analytics.total_evaluators) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <h1 className="text-xl font-bold">{analytics.form.title}</h1>
          <p className="text-sm text-muted-foreground">{analytics.form.department} · Analytics</p>
        </div>
        <Badge className={cn("ml-auto text-xs border-0 capitalize", {
          "bg-green-100 text-green-700": analytics.form.status === "active",
          "bg-gray-100 text-gray-600":   analytics.form.status === "closed",
          "bg-amber-100 text-amber-700": analytics.form.status === "draft",
        })}>{analytics.form.status}</Badge>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,        label: "Total Evaluators",   value: analytics.total_evaluators,   color: "bg-blue-100 text-blue-600"  },
          { icon: CheckCircle,  label: "Responses Received",  value: analytics.responses_received, color: "bg-green-100 text-green-600" },
          { icon: Clock,        label: "Pending Responses",   value: analytics.pending_responses,  color: "bg-amber-100 text-amber-600" },
          { icon: Star,         label: "Average Score",       value: `${analytics.average_score}/5`, color: "bg-purple-100 text-purple-600" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Response rate bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Response Rate</span>
          <span className="text-muted-foreground">{analytics.responses_received} of {analytics.total_evaluators}</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${responseRate}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{responseRate}% complete</p>
      </div>

      {/* Sections */}
      {analytics.sections.map((section, si) => (
        <div key={si} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <h3 className="font-semibold">{section.title}</h3>
            <Badge className="mt-1 text-xs border-0 bg-gray-100 text-gray-600 capitalize">{section.type.replace("_", " ")}</Badge>
          </div>

          <div className="divide-y divide-border">
            {section.questions.map((q, qi) => (
              <div key={qi} className="p-5">
                <p className="text-sm font-medium mb-3">{q.text}</p>
                <p className="text-xs text-muted-foreground mb-3">{q.response_count ?? 0} response{(q.response_count ?? 0) !== 1 ? "s" : ""}</p>

                {q.type === "likert" && q.likert_summary && Object.keys(q.likert_summary).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Donut */}
                    <DonutChart data={q.likert_summary} />
                    {/* Bars */}
                    <div className="space-y-2">
                      {Object.entries(q.likert_summary).map(([label, count]) => (
                        <RatingBar
                          key={label}
                          label={label}
                          count={count}
                          total={Object.values(q.likert_summary!).reduce((a, b) => a + b, 0)}
                        />
                      ))}
                      {q.average_rating !== undefined && q.average_rating > 0 && (
                        <div className="pt-2 border-t border-border flex items-center gap-2">
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs text-muted-foreground">Average: <strong>{q.average_rating}/5</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {q.type === "likert" && (!q.likert_summary || Object.keys(q.likert_summary).length === 0) && (
                  <p className="text-xs text-muted-foreground">No responses yet</p>
                )}

                {q.type === "open_ended" && (
                  <div className="space-y-2">
                    {q.text_responses && q.text_responses.length > 0 ? (
                      q.text_responses.map((resp, ri) => (
                        <div key={ri} className="rounded-lg bg-muted/30 border border-border px-3 py-2 text-sm">{resp}</div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No responses yet</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {analytics.sections.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No sections data available</div>
      )}
    </div>
  );
}