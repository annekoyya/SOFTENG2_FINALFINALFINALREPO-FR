// src/components/performance/TemplatesTab.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Edit } from "lucide-react";
import type { EvaluationTemplate } from "@/hooks/usePerformance";

interface Props {
  templates: EvaluationTemplate[];
  isLoading: boolean;
  canManage: boolean;
  onCreateTemplate: (data: Partial<EvaluationTemplate>) => Promise<EvaluationTemplate>;
  onUpdateTemplate: (id: number, data: Partial<EvaluationTemplate>) => Promise<void>;
}

const periodLabels: Record<string, string> = {
  monthly: "Monthly", quarterly: "Quarterly", semi_annual: "Semi-Annual",
  annual: "Annual", probationary: "Probationary", custom: "Custom",
};

const scaleLabels: Record<string, string> = {
  "1_to_5": "1–5", "1_to_10": "1–10", percentage: "0–100%",
};

// Fix: form state uses exact union types instead of plain string
interface TemplateForm {
  title: string;
  description: string;
  period_type: EvaluationTemplate["period_type"];
  rating_scale: EvaluationTemplate["rating_scale"];
  department: string;
  is_active: boolean;
}

export function TemplatesTab({ templates, isLoading, canManage, onCreateTemplate, onUpdateTemplate }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch]         = useState("");
  const [saving, setSaving]         = useState(false);
  const [form, setForm] = useState<TemplateForm>({
    title: "", description: "", period_type: "quarterly",
    rating_scale: "1_to_5", department: "", is_active: true,
  });

  const filtered = templates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    setSaving(true);
    try {
      await onCreateTemplate(form);
      setDialogOpen(false);
      setForm({ title: "", description: "", period_type: "quarterly", rating_scale: "1_to_5", department: "", is_active: true });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Template
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">No templates yet</p>
          {canManage && <p className="mt-1 text-sm text-muted-foreground">Create your first evaluation template</p>}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(t => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{t.title}</CardTitle>
                  <Badge variant={t.is_active ? "default" : "secondary"} className="shrink-0">
                    {t.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {t.description && <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">{periodLabels[t.period_type]}</Badge>
                  <Badge variant="outline" className="text-xs">{scaleLabels[t.rating_scale]}</Badge>
                  {t.department && <Badge variant="outline" className="text-xs">{t.department}</Badge>}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-muted-foreground">By {t.creator?.name ?? "System"}</p>
                  {canManage && (
                    <Button variant="ghost" size="sm" className="h-7 px-2"
                      onClick={() => onUpdateTemplate(t.id, { is_active: !t.is_active })}>
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Evaluation Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input className="mt-1" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Annual Performance Review" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input className="mt-1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Period Type</label>
                <Select value={form.period_type}
                  onValueChange={v => setForm(f => ({ ...f, period_type: v as EvaluationTemplate["period_type"] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(periodLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Rating Scale</label>
                <Select value={form.rating_scale}
                  onValueChange={v => setForm(f => ({ ...f, rating_scale: v as EvaluationTemplate["rating_scale"] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(scaleLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Department (optional)</label>
              <Input className="mt-1" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Leave blank for all departments" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.title}>
              {saving ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}