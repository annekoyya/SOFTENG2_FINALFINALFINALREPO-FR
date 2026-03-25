// src/components/evaluation/EvaluationAnalytics.tsx
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { AnalyticsData } from "@/hooks/useEvaluation";

interface Props {
  analytics: AnalyticsData;
  onBack: () => void;
}

const LABEL_COLORS: Record<string, string> = {
  Excellent: "#F59E0B",
  Great:     "#EF4444",
  Poor:      "#8B5CF6",
  Bad:       "#EC4899",
};

function LikertPieChart({ summary }: { summary: Record<string, number> }) {
  const data = Object.entries(summary).map(([name, value]) => ({ name, value }));
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={100} height={100}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={45} dataKey="value">
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={LABEL_COLORS[entry.name] ?? "#94a3b8"}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: LABEL_COLORS[entry.name] ?? "#94a3b8" }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EvaluationAnalytics({ analytics, onBack }: Props) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-sm text-muted-foreground">
            Performance Management /{" "}
            <span className="text-foreground font-medium">
              Evaluation Analytics
            </span>
          </div>
        </div>
        <Button size="sm">Generate</Button>
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">

        {/* Form meta */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Evaluation Name
            </label>
            <Input
              value={analytics.form.title}
              readOnly
              className="mt-1 bg-muted/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Evaluators
              </label>
              <Input
                value={analytics.total_evaluators}
                readOnly
                className="mt-1 bg-muted/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Responses Received
              </label>
              <Input
                value={analytics.responses_received}
                readOnly
                className="mt-1 bg-muted/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Pending Responses
              </label>
              <Input
                value={analytics.pending_responses}
                readOnly
                className="mt-1 bg-muted/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Average Respondent
              </label>
              <Input
                value={analytics.average_score}
                readOnly
                className="mt-1 bg-muted/30"
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        {analytics.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-4">
            <div className="border-b border-border pb-2">
              <h3 className="font-semibold text-foreground">{section.title}</h3>
            </div>

            {/* Likert questions */}
            {section.questions
              .filter((q) => q.type === "likert")
              .map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{q.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {Object.values(q.likert_summary ?? {}).reduce(
                          (a, b) => a + b,
                          0
                        )}{" "}
                        responses
                      </p>
                    </div>
                    {q.likert_summary && (
                      <LikertPieChart summary={q.likert_summary} />
                    )}
                  </div>
                </div>
              ))}

            {/* Open-ended questions */}
            {section.questions
              .filter((q) => q.type === "open_ended")
              .map((q, qIdx) => (
                <div key={qIdx} className="space-y-2">
                  <p className="text-sm font-medium">{q.text}</p>
                  <div className="space-y-2">
                    {q.text_responses?.map((resp, rIdx) => (
                      <div
                        key={rIdx}
                        className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-foreground"
                      >
                        {resp}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ))}

      </div>{/* ← closing rounded-xl card — was missing, caused line 139 error */}
    </div>
  );
}