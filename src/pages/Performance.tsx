// src/pages/Performance.tsx
// REPLACE ENTIRE FILE

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  useEvaluation, type EvaluationForm, type CreateFormData,
  type EvaluationSection, type QuestionResponse,
} from "@/hooks/useEvaluation";
import { EvaluationFormBuilder } from "@/components/evaluation/EvaluationFormBuilder";
import { EvaluationAnalytics } from "@/components/evaluation/EvaluationAnalytics";
import {
  Plus, Search, TrendingUp, Send, Loader2, Eye, Edit,
  Trash2, ChevronLeft, ChevronRight, ClipboardList, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type View = "list" | "create" | "edit" | "analytics" | "fill";

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft:  "bg-amber-100 text-amber-700",
  closed: "bg-gray-100 text-gray-600",
};

// ─── HR Fill-in Form Dialog ───────────────────────────────────────────────────

interface FillFormProps {
  open: boolean;
  onClose: () => void;
  assignment: { id: number; form: { title: string; department: string; sections: EvaluationSection[] } } | null;
  onSubmit: (assignmentId: number, responses: QuestionResponse[]) => Promise<void>;
}

function FillFormDialog({ open, onClose, assignment, onSubmit }: FillFormProps) {
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [saving, setSaving]       = useState(false);
  const { toast }                 = useToast();

  if (!assignment) return null;

  const setRating = (questionId: number, rating: number) =>
    setResponses(p => ({ ...p, [questionId]: { question_id: questionId, rating } }));

  const setText = (questionId: number, text: string) =>
    setResponses(p => ({ ...p, [questionId]: { question_id: questionId, text_response: text } }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(assignment.id, Object.values(responses));
      toast({ title: "Submitted!", description: "Your evaluation has been recorded." });
      onClose();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Submit failed", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const RATING_LABELS = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{assignment.form.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{assignment.form.department}</p>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {(assignment.form.sections ?? []).map((section, si) => (
            <div key={si} className="space-y-3">
              <div className="border-b border-border pb-1">
                <h4 className="font-semibold text-sm">{section.title}</h4>
                {section.description && <p className="text-xs text-muted-foreground">{section.description}</p>}
              </div>

              {section.type === "likert" && section.questions?.map((q, qi) => {
                const qid    = q.id ?? (si * 1000 + qi);
                const current = responses[qid]?.rating;
                return (
                  <div key={qi} className="space-y-2">
                    <p className="text-sm">{q.text}</p>
                    <div className="flex gap-2">
                      {(section.likert_options?.length ? section.likert_options : [1,2,3,4,5].map((v,i) => ({ value: v, label: RATING_LABELS[i] }))).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setRating(qid, opt.value)}
                          className={cn(
                            "flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-all",
                            current === opt.value
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-border bg-background text-muted-foreground hover:border-blue-300 hover:bg-blue-50"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {section.type === "open_ended" && section.questions?.map((q, qi) => {
                const qid = q.id ?? (si * 1000 + qi);
                return (
                  <div key={qi} className="space-y-1">
                    <p className="text-sm">{q.text}</p>
                    <Textarea
                      rows={3}
                      placeholder="Your response..."
                      value={responses[qid]?.text_response ?? ""}
                      onChange={e => setText(qid, e.target.value)}
                      className="resize-none"
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Evaluation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Performance() {
  const { toast }             = useToast();
  const { user }              = useAuth();
  const role                  = user?.role ?? "";
  const isAdmin               = role === "Admin" || role === "Manager";
  const isHR                  = role === "HR";

  const {
    forms, analytics, myAssignments, isLoading,
    fetchForms, createForm, updateForm, deleteForm,
    fetchAnalytics, fetchMyAssignments, submitAssignment, sendForm, closeForm,
  } = useEvaluation();

  const [view,         setView]         = useState<View>("list");
  const [search,       setSearch]       = useState("");
  const [editingForm,  setEditingForm]  = useState<EvaluationForm | null>(null);
  const [fillTarget,   setFillTarget]   = useState<{ id: number; form: { title: string; department: string; sections: EvaluationSection[] } } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EvaluationForm | null>(null);
  const [sendingId,    setSendingId]    = useState<number | null>(null);
  const [page,         setPage]         = useState(1);
  const PER_PAGE = 5;

  useEffect(() => {
    fetchForms();
    if (isHR) fetchMyAssignments();
  }, []);

  // ─── Admin/Manager views ──────────────────────────────────────────────────

  if (view === "create") {
    return (
      <DashboardLayout>
        <EvaluationFormBuilder
          onSave={async (data: CreateFormData) => { await createForm(data); toast({ title: "Evaluation created" }); setView("list"); fetchForms(); }}
          onCancel={() => setView("list")}
        />
      </DashboardLayout>
    );
  }

  if (view === "edit" && editingForm) {
    return (
      <DashboardLayout>
        <EvaluationFormBuilder
          initialData={editingForm}
          onSave={async (data) => {
            await updateForm(editingForm.id, data as Partial<EvaluationForm> & { sections?: EvaluationSection[] });
            toast({ title: "Updated" }); setView("list"); fetchForms();
          }}
          onCancel={() => setView("list")}
        />
      </DashboardLayout>
    );
  }

  if (view === "analytics" && analytics) {
    return (
      <DashboardLayout>
        <EvaluationAnalytics analytics={analytics} onBack={() => setView("list")} />
      </DashboardLayout>
    );
  }

  const activeForms = forms.filter(f => f.status === "active");
  const draftForms  = forms.filter(f => f.status === "draft");
  const closedForms = forms.filter(f => f.status === "closed");

  const filtered = activeForms.filter(f =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.department.toLowerCase().includes(search.toLowerCase())
  );
  const pages       = Math.ceil(filtered.length / PER_PAGE);
  const paginated   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Performance Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Evaluation forms and analytics</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setView("create")} className="gap-2">
              <Plus className="h-4 w-4" /> New Evaluation
            </Button>
          )}
        </div>

        {/* ── HR: My Assignments ───────────────────────────────────────────── */}
        {isHR && (
          <div className="space-y-4">
            {/* Pending */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">My Pending Evaluations</h3>
                <Badge className="ml-auto bg-amber-100 text-amber-700 border-0 text-xs">{myAssignments.pending?.length ?? 0}</Badge>
              </div>
              {(!myAssignments.pending || myAssignments.pending.length === 0) ? (
                <div className="px-5 py-10 text-center text-muted-foreground text-sm">
                  No pending evaluations 🎉
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {myAssignments.pending?.map(a => (
                    <div key={a.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="font-medium text-sm">{a.form?.title}</p>
                        <p className="text-xs text-muted-foreground">{a.form?.department}{a.form?.deadline ? ` · Due ${fmtDate(a.form.deadline)}` : ""}</p>
                      </div>
                      <Button size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => setFillTarget(a as typeof fillTarget)}>
                        <Send className="h-3.5 w-3.5" /> Fill out
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed */}
            {(myAssignments.completed?.length ?? 0) > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold text-sm">Completed Evaluations</h3>
                </div>
                <div className="divide-y divide-border">
                  {myAssignments.completed?.map(a => (
                    <div key={a.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="font-medium text-sm">{a.form?.title}</p>
                        <p className="text-xs text-muted-foreground">{a.form?.department}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">Submitted</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Admin/Manager: Evaluation list ──────────────────────────────── */}
        {isAdmin && (
          <>
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search evaluations..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>

            {/* Loading */}
            {isLoading && forms.length === 0 && (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            )}

            {/* Active evaluations */}
            {paginated.length > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/30">
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Active Evaluations</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b border-border">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold">Name</th>
                      <th className="px-5 py-3 text-left font-semibold">Department</th>
                      <th className="px-5 py-3 text-left font-semibold">Progress</th>
                      <th className="px-5 py-3 text-left font-semibold">Deadline</th>
                      <th className="px-5 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginated.map(form => {
                      const total = form.assignments_count ?? 0;
                      const done  = form.responses_count   ?? 0;
                      const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
                      return (
                        <tr key={form.id} className="hover:bg-muted/20">
                          <td className="px-5 py-3 font-medium">{form.title}</td>
                          <td className="px-5 py-3 text-muted-foreground">{form.department}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Progress value={pct} className="h-2 w-24" />
                              <span className="text-xs text-muted-foreground">{done}/{total}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground text-xs">{fmtDate(form.deadline)}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Analytics"
                                onClick={async () => { await fetchAnalytics(form.id); setView("analytics"); }}>
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit"
                                onClick={() => { setEditingForm(form); setView("edit"); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Close"
                                onClick={async () => { await closeForm(form.id); fetchForms(); toast({ title: "Form closed" }); }}>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" title="Delete"
                                onClick={() => setDeleteTarget(form)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground">
                      Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === pages} onClick={() => setPage(p => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Drafts */}
            {draftForms.length > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/30">
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Drafts</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b border-border">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold">Name</th>
                      <th className="px-5 py-3 text-left font-semibold">Department</th>
                      <th className="px-5 py-3 text-left font-semibold">Last edited</th>
                      <th className="px-5 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {draftForms.map(form => (
                      <tr key={form.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3 font-medium">{form.title}</td>
                        <td className="px-5 py-3 text-muted-foreground">{form.department}</td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">{fmtDate(form.updated_at)}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                              onClick={() => { setEditingForm(form); setView("edit"); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600"
                              disabled={sendingId === form.id}
                              onClick={async () => {
                                setSendingId(form.id);
                                try { await sendForm(form.id); toast({ title: "Sent to HR evaluators" }); fetchForms(); }
                                catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
                                finally { setSendingId(null); }
                              }}>
                              {sendingId === form.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500"
                              onClick={() => setDeleteTarget(form)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Closed */}
            {closedForms.length > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/30">
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Closed</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b border-border">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold">Name</th>
                      <th className="px-5 py-3 text-left font-semibold">Department</th>
                      <th className="px-5 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {closedForms.map(form => (
                      <tr key={form.id} className="hover:bg-muted/20">
                        <td className="px-5 py-3 font-medium text-muted-foreground">{form.title}</td>
                        <td className="px-5 py-3 text-muted-foreground">{form.department}</td>
                        <td className="px-5 py-3 text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                            onClick={async () => { await fetchAnalytics(form.id); setView("analytics"); }}>
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && forms.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
                <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="font-medium text-muted-foreground">No evaluations yet</p>
                <Button className="mt-4 gap-2" onClick={() => setView("create")}>
                  <Plus className="h-4 w-4" /> Create First Evaluation
                </Button>
              </div>
            )}
          </>
        )}

        {/* HR Fill-in Dialog */}
        <FillFormDialog
          open={!!fillTarget}
          onClose={() => setFillTarget(null)}
          assignment={fillTarget}
          onSubmit={async (assignmentId, responses) => {
            await submitAssignment(assignmentId, responses);
            fetchMyAssignments();
          }}
        />

        {/* Delete Confirm */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete evaluation?</AlertDialogTitle>
              <AlertDialogDescription>
                "{deleteTarget?.title}" will be permanently deleted. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  if (!deleteTarget) return;
                  try { await deleteForm(deleteTarget.id); toast({ title: "Deleted" }); setDeleteTarget(null); fetchForms(); }
                  catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
                }}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </DashboardLayout>
  );
}