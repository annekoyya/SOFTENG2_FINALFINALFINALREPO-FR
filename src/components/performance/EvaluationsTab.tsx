// src/components/performance/EvaluationsTab.tsx
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, ClipboardList, Eye, Send, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Evaluation, EvaluationTemplate, EvaluationResponse } from "@/hooks/usePerformance";
import type { Employee } from "@/types/employee";

interface Props {
  evaluations: Evaluation[];
  templates: EvaluationTemplate[];
  employees: Employee[];
  isLoading: boolean;
  canEvaluate: boolean;
  canReview: boolean;
  selectedEval: Evaluation | null;
  onFetchEvaluation: (id: number) => Promise<void>;
  onCreateEvaluation: (data: Partial<Evaluation>) => Promise<Evaluation>;
  onSaveResponses: (evalId: number, responses: Partial<EvaluationResponse>[]) => Promise<void>;
  onSubmit: (id: number) => Promise<void>;
  onReview: (id: number, comments: string) => Promise<void>;
}

const statusStyles: Record<string, string> = {
  draft:        "bg-gray-100 text-gray-800",
  submitted:    "bg-amber-100 text-amber-800",
  reviewed:     "bg-blue-100 text-blue-800",
  acknowledged: "bg-purple-100 text-purple-800",
  completed:    "bg-green-100 text-green-800",
};

const ratingStyles: Record<string, string> = {
  outstanding:           "bg-green-100 text-green-800",
  exceeds_expectations:  "bg-blue-100 text-blue-800",
  meets_expectations:    "bg-yellow-100 text-yellow-800",
  needs_improvement:     "bg-orange-100 text-orange-800",
  unsatisfactory:        "bg-red-100 text-red-800",
};

const ratingLabels: Record<string, string> = {
  outstanding: "Outstanding", exceeds_expectations: "Exceeds Expectations",
  meets_expectations: "Meets Expectations", needs_improvement: "Needs Improvement",
  unsatisfactory: "Unsatisfactory",
};

export function EvaluationsTab({
  evaluations, templates, employees, isLoading, canEvaluate, canReview,
  selectedEval, onFetchEvaluation, onCreateEvaluation, onSaveResponses, onSubmit, onReview,
}: Props) {
  const [createOpen, setCreateOpen]     = useState(false);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [reviewOpen, setReviewOpen]     = useState(false);
  const [reviewComments, setReviewComments] = useState("");
  const [saving, setSaving]             = useState(false);
  const [responses, setResponses]       = useState<Record<number, string>>({});
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    employee_id: "", evaluation_template_id: "",
    period_start: "", period_end: "", period_label: "",
  });

  const filtered = evaluations.filter(e => {
    const name = `${e.employee?.first_name} ${e.employee?.last_name}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async () => {
    setSaving(true);
    try {
      await onCreateEvaluation({
        employee_id: Number(form.employee_id),
        evaluation_template_id: Number(form.evaluation_template_id),
        period_start: form.period_start,
        period_end: form.period_end,
        period_label: form.period_label,
      });
      setCreateOpen(false);
      setForm({ employee_id: "", evaluation_template_id: "", period_start: "", period_end: "", period_label: "" });
    } finally { setSaving(false); }
  };

  const handleView = async (e: Evaluation) => {
    await onFetchEvaluation(e.id);
    setResponses({});
    setDrawerOpen(true);
  };

  const handleSaveResponses = async () => {
    if (!selectedEval) return;
    setSaving(true);
    try {
      const payload = Object.entries(responses).map(([qId, val]) => ({
        evaluation_question_id: Number(qId),
        score: isNaN(Number(val)) ? null : Number(val),
        text_response: isNaN(Number(val)) ? val : null,
      }));
      await onSaveResponses(selectedEval.id, payload);
    } finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    if (!selectedEval) return;
    setSaving(true);
    try {
      await onSubmit(selectedEval.id);
      setDrawerOpen(false);
    } finally { setSaving(false); }
  };

  const handleReview = async () => {
    if (!selectedEval) return;
    setSaving(true);
    try {
      await onReview(selectedEval.id, reviewComments);
      setReviewOpen(false);
      setDrawerOpen(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["draft","submitted","reviewed","acknowledged","completed"].map(s => (
              <SelectItem key={s} value={s}>{s.replace("_"," ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEvaluate && (
          <Button onClick={() => setCreateOpen(true)} className="ml-auto">
            <Plus className="mr-2 h-4 w-4" /> New Evaluation
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">No evaluations found</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Employee</th>
                <th className="px-4 py-3 text-left font-medium">Template</th>
                <th className="px-4 py-3 text-left font-medium">Period</th>
                <th className="px-4 py-3 text-left font-medium">Score</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{e.employee?.first_name} {e.employee?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{e.employee?.department}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.template?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {e.period_label ?? `${e.period_start} – ${e.period_end}`}
                  </td>
                  <td className="px-4 py-3">
                    {e.percentage_score !== null ? (
                      <div className="space-y-1">
                        <p className="font-semibold">{e.percentage_score}%</p>
                        {e.overall_rating && (
                          <Badge className={cn("text-xs", ratingStyles[e.overall_rating])}>
                            {ratingLabels[e.overall_rating]}
                          </Badge>
                        )}
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn("capitalize", statusStyles[e.status])}>
                      {e.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleView(e)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Evaluation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Employee *</label>
              <Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.first_name} {e.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Template *</label>
              <Select value={form.evaluation_template_id} onValueChange={v => setForm(f => ({ ...f, evaluation_template_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.is_active).map(t => <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Period Label</label>
              <Input className="mt-1" value={form.period_label} onChange={e => setForm(f => ({ ...f, period_label: e.target.value }))} placeholder="e.g. Q1 2026" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Start Date *</label>
                <input type="date" value={form.period_start} onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">End Date *</label>
                <input type="date" value={form.period_end} onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.employee_id || !form.evaluation_template_id}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluation Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedEval?.employee?.first_name} {selectedEval?.employee?.last_name} — {selectedEval?.period_label ?? selectedEval?.period_start}
            </SheetTitle>
          </SheetHeader>

          {selectedEval && (
            <div className="mt-6 space-y-6">
              {/* Status + Score */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={cn("capitalize", statusStyles[selectedEval.status])}>
                  {selectedEval.status.replace("_", " ")}
                </Badge>
                {selectedEval.percentage_score !== null && (
                  <Badge className={cn(selectedEval.overall_rating ? ratingStyles[selectedEval.overall_rating] : "")}>
                    {selectedEval.percentage_score}% — {selectedEval.overall_rating ? ratingLabels[selectedEval.overall_rating] : ""}
                  </Badge>
                )}
              </div>

              {/* Questions */}
              {selectedEval.template?.questions && selectedEval.template.questions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Evaluation Form</h3>
                  {selectedEval.template.questions.map(q => {
                    const existing = selectedEval.responses?.find(r => r.evaluation_question_id === q.id);
                    const val = responses[q.id] ?? String(existing?.score ?? existing?.text_response ?? "");
                    return (
                      <Card key={q.id}>
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-sm">{q.question}</p>
                              {q.description && <p className="text-xs text-muted-foreground mt-0.5">{q.description}</p>}
                            </div>
                            {q.category && <Badge variant="outline" className="text-xs shrink-0">{q.category}</Badge>}
                          </div>
                          {q.type === "rating" && (
                            <div className="flex items-center gap-2">
                              {[1,2,3,4,5].map(n => (
                                <button key={n} onClick={() => setResponses(r => ({ ...r, [q.id]: String(n) }))}
                                  className={cn("h-9 w-9 rounded-full border-2 text-sm font-semibold transition-colors",
                                    Number(val) === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50")}>
                                  {n}
                                </button>
                              ))}
                              <span className="text-xs text-muted-foreground ml-1">Weight: {q.weight}</span>
                            </div>
                          )}
                          {q.type === "text" && (
                            <Textarea value={val} onChange={e => setResponses(r => ({ ...r, [q.id]: e.target.value }))}
                              placeholder="Enter response..." rows={3} disabled={selectedEval.status !== "draft"} />
                          )}
                          {q.type === "yes_no" && (
                            <div className="flex gap-2">
                              {["Yes", "No"].map(opt => (
                                <button key={opt} onClick={() => setResponses(r => ({ ...r, [q.id]: opt }))}
                                  disabled={selectedEval.status !== "draft"}
                                  className={cn("px-4 py-1.5 rounded-md border text-sm font-medium transition-colors",
                                    val === opt ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50")}>
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Manager Comments */}
              {selectedEval.manager_comments && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="text-sm font-medium text-blue-800 mb-1">Manager Comments</p>
                  <p className="text-sm text-blue-700">{selectedEval.manager_comments}</p>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4 flex flex-wrap gap-2">
                {selectedEval.status === "draft" && canEvaluate && (
                  <>
                    <Button variant="outline" onClick={handleSaveResponses} disabled={saving}>
                      {saving ? "Saving..." : "Save Responses"}
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                      <Send className="mr-2 h-4 w-4" />
                      Submit for Review
                    </Button>
                  </>
                )}
                {selectedEval.status === "submitted" && canReview && (
                  <Button onClick={() => setReviewOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Review & Approve
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Evaluation</DialogTitle></DialogHeader>
          <div>
            <label className="text-sm font-medium">Manager Comments</label>
            <Textarea className="mt-2" value={reviewComments} onChange={e => setReviewComments(e.target.value)}
              placeholder="Add your review comments..." rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button onClick={handleReview} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
              {saving ? "Reviewing..." : "Approve Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}