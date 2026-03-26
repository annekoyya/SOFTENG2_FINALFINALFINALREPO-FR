// src/pages/Performance.tsx
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Filter, TrendingUp, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvaluation, type EvaluationForm, type CreateFormData } from "@/hooks/useEvaluation";
import { useAuth } from "@/hooks/useAuth";
import { EvaluationFormBuilder } from "@/components/evaluation/EvaluationFormBuilder";
import { EvaluationAnalytics } from "@/components/evaluation/EvaluationAnalytics";
import { useToast } from "@/hooks/use-toast";

type View = "list" | "create" | "analytics";

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  draft:  "bg-amber-100 text-amber-800 border-amber-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function Performance() {
  const { toast }                  = useToast();
  const { isAdmin, isManager }     = useAuth();
  const {
    forms, analytics, isLoading,
    fetchForms, createForm, fetchAnalytics, sendForm,
  } = useEvaluation();

  const [view, setView]             = useState<View>("list");
  const [search, setSearch]         = useState("");
  const [sendingId, setSendingId]   = useState<number | null>(null);

  const canManage = isAdmin() || isManager();

  // ── Load real data on mount ───────────────────────────────────────────────
  useEffect(() => { fetchForms(); }, []);

  const activeForms  = forms.filter(f => f.status !== "draft");
  const draftForms   = forms.filter(f => f.status === "draft");

  const filteredActive = activeForms.filter(f =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.department.toLowerCase().includes(search.toLowerCase())
  );
  const filteredDrafts = draftForms.filter(f =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewAnalytics = async (form: EvaluationForm) => {
    await fetchAnalytics(form.id);
    setView("analytics");
  };

  const handleSendDraft = async (form: EvaluationForm) => {
    setSendingId(form.id);
    try {
      await sendForm(form.id);
      toast({ title: "Evaluation Sent", description: `${form.title} is now active.` });
    } catch {
      toast({ title: "Error", description: "Failed to send evaluation.", variant: "destructive" });
    } finally { setSendingId(null); }
  };

  const handleCreate = async (data: CreateFormData) => {
    try {
      await createForm(data);
      toast({ title: "Success", description: "Evaluation created successfully." });
      setView("list");
      fetchForms(); // Refresh list with real data
    } catch {
      toast({ title: "Error", description: "Failed to create evaluation.", variant: "destructive" });
    }
  };

  // ── Progress helpers ──────────────────────────────────────────────────────
  const getProgress = (form: EvaluationForm) => {
    const total    = (form.responses_count ?? 0) + (form.pending_count ?? 0);
    const received = form.responses_count ?? 0;
    const pct      = total > 0 ? Math.round((received / total) * 100) : 0;
    return { total, received, pct };
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-PH", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  // ── Views ─────────────────────────────────────────────────────────────────

  if (view === "create") {
    return (
      <DashboardLayout>
        <EvaluationFormBuilder
          onSave={handleCreate}
          onCancel={() => setView("list")}
        />
      </DashboardLayout>
    );
  }

  if (view === "analytics" && analytics) {
    return (
      <DashboardLayout>
        <EvaluationAnalytics
          analytics={analytics}
          onBack={() => setView("list")}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Performance Management
        </h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="evaluations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          {canManage && (
            <TabsTrigger value="interviews">Interview Schedule</TabsTrigger>
          )}
        </TabsList>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations" className="space-y-6">
          {canManage && (
            <Button onClick={() => setView("create")} className="gap-2">
              <Plus className="h-4 w-4" />
              New Evaluation
            </Button>
          )}

          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search evaluations"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Loading */}
          {isLoading && forms.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Active Evaluations */}
          {filteredActive.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold">Active Evaluations</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Evaluation Name</th>
                    <th className="px-6 py-3 text-left font-semibold">Department</th>
                    <th className="px-6 py-3 text-left font-semibold">Progress</th>
                    <th className="px-6 py-3 text-left font-semibold">Deadline</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredActive.map(form => {
                    const { total, received, pct } = getProgress(form);
                    return (
                      <tr key={form.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-medium">{form.title}</td>
                        <td className="px-6 py-4 text-muted-foreground">{form.department}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Progress value={pct} className="h-2 w-28" />
                            <span className="text-xs text-muted-foreground items-center">
                              {received}/{total}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{formatDate(form.deadline)}</td>
                        <td className="px-6 py-4">
                          <Badge className={cn("border text-xs capitalize", statusStyles[form.status])}>
                            {form.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                              onClick={() => handleViewAnalytics(form)} title="Analytics">
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Drafts */}
          {filteredDrafts.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold">Drafts</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Evaluation Name</th>
                    <th className="px-6 py-3 text-left font-semibold">Department</th>
                    <th className="px-6 py-3 text-left font-semibold">Last Edited</th>
                    <th className="px-6 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDrafts.map(form => (
                    <tr key={form.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium">{form.title}</td>
                      <td className="px-6 py-4 text-muted-foreground">{form.department}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(form.updated_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary"
                            onClick={() => handleSendDraft(form)}
                            disabled={sendingId === form.id}
                            title="Send to evaluators">
                            {sendingId === form.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Send className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && forms.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
              <TrendingUp className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-lg font-medium text-muted-foreground">No evaluations yet</p>
              {canManage && (
                <Button className="mt-4" onClick={() => setView("create")}>
                  <Plus className="mr-2 h-4 w-4" /> Create First Evaluation
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* Interviews Tab (Admin/Manager only) */}
        {canManage && (
          <TabsContent value="interviews" className="space-y-6">
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
              <p className="text-muted-foreground">Interview scheduling feature (Recruitment integration)</p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </DashboardLayout>
  );
}