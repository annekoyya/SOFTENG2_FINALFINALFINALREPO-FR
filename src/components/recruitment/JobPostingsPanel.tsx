import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, XCircle, Edit2, ChevronRight } from "lucide-react";
import type { JobPosting, JobStatus } from "@/types/recruitment";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Front Desk", "Housekeeping", "Food & Beverage", "Maintenance",
  "Security", "Sales & Marketing", "Finance", "HR", "IT", "Management",
];

const EMPLOYMENT_TYPES = [
  { value: "full_time",    label: "Full-time" },
  { value: "part_time",    label: "Part-time" },
  { value: "contractual",  label: "Contractual" },
  { value: "probationary", label: "Probationary" },
];

function statusBadge(status: JobStatus) {
  const map: Record<JobStatus, string> = {
    draft:     "bg-gray-100 text-gray-600 border-gray-200",
    open:      "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed:    "bg-red-50 text-red-600 border-red-200",
    cancelled: "bg-orange-50 text-orange-600 border-orange-200",
  };
  return (
    <Badge className={`${map[status]} border rounded-full text-xs font-medium px-2 py-0.5`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function formatPHP(n: number) {
  return `₱${n.toLocaleString("en-PH")}`;
}

// ─── Job Form Dialog ───────────────────────────────────────────────────────────

interface JobFormProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: Partial<JobPosting>) => Promise<void>;
  initial?: Partial<JobPosting>;
}

function JobFormDialog({ open, onClose, onCreate, initial }: JobFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title:           initial?.title ?? "",
    department:      initial?.department ?? "",
    employment_type: initial?.employment_type ?? "full_time",
    location:        initial?.location ?? "Blue Lotus Hotel, Davao City",
    salary_min:      initial?.salary_min?.toString() ?? "",
    salary_max:      initial?.salary_max?.toString() ?? "",
    slots:           initial?.slots?.toString() ?? "1",
    description:     initial?.description ?? "",
    requirements:    initial?.requirements ?? "",
    closes_at:       initial?.closes_at ?? "",
    status:          initial?.status ?? "open",
  });

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title || !form.department || !form.description) {
      toast({ title: "Please fill in title, department, and description.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await onCreate({
        ...form,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : undefined,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : undefined,
        slots: parseInt(form.slots) || 1,
      });
      toast({ title: "Job posting saved." });
      onClose();
    } catch {
      toast({ title: "Failed to save job posting.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit job posting" : "New job posting"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium">Job title</label>
            <Input placeholder="e.g. Front Desk Officer" value={form.title} onChange={f("title")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Department</label>
            <Select value={form.department} onValueChange={(v) => setForm((p) => ({ ...p, department: v }))}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Employment type</label>
            <Select value={form.employment_type} onValueChange={(v) => setForm((p) => ({ ...p, employment_type: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Salary min (₱)</label>
            <Input placeholder="e.g. 18000" value={form.salary_min} onChange={f("salary_min")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Salary max (₱)</label>
            <Input placeholder="e.g. 25000" value={form.salary_max} onChange={f("salary_max")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Slots / headcount</label>
            <Input type="number" min="1" value={form.slots} onChange={f("slots")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Closes on</label>
            <Input type="date" value={form.closes_at} onChange={f("closes_at")} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium">Location</label>
            <Input value={form.location} onChange={f("location")} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium">Job description</label>
            <Textarea rows={4} placeholder="Responsibilities, role overview…" value={form.description} onChange={f("description")} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium">Requirements</label>
            <Textarea rows={3} placeholder="Qualifications, experience, skills…" value={form.requirements} onChange={f("requirements")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Saving…" : "Save posting"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface JobPostingsPanelProps {
  jobs: JobPosting[];
  isLoading: boolean;
  canManage: boolean;
  onSelect: (job: JobPosting) => void;
  onCreate: (data: Partial<JobPosting>) => Promise<void>;
  onUpdate: (id: number, data: Partial<JobPosting>) => Promise<void>;
  onClose: (id: number) => Promise<void>;
  onRefresh: () => void;
}

export default function JobPostingsPanel({
  jobs, isLoading, canManage, onSelect, onCreate, onUpdate, onClose, onRefresh,
}: JobPostingsPanelProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JobPosting | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | JobStatus>("all");

  const filtered = jobs.filter((j) => statusFilter === "all" || j.status === statusFilter);

  const counts = {
    all: jobs.length,
    open: jobs.filter((j) => j.status === "open").length,
    draft: jobs.filter((j) => j.status === "draft").length,
    closed: jobs.filter((j) => j.status === "closed").length,
    cancelled: jobs.filter((j) => j.status === "cancelled").length,
  };

  const handleClose = async (job: JobPosting) => {
    try {
      await onClose(job.id);
      toast({ title: "Job posting closed." });
      onRefresh();
    } catch {
      toast({ title: "Failed to close posting.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter + add */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-0.5 bg-muted/50 p-1 rounded-lg">
          {(["all", "open", "draft", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                statusFilter === s ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1 opacity-50">({counts[s]})</span>
            </button>
          ))}
        </div>
        {canManage && (
          <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
            <Plus className="w-3.5 h-3.5" />
            New posting
          </Button>
        )}
      </div>

      {/* Job cards */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-10">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No job postings found.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((job) => (
            <div
              key={job.id}
              className="rounded-lg border border-border/60 bg-card p-4 hover:border-border transition-colors cursor-pointer group"
              onClick={() => onSelect(job)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{job.title}</span>
                    {statusBadge(job.status)}
                    <Badge className="bg-muted text-muted-foreground border-0 rounded-full text-xs">
                      {EMPLOYMENT_TYPES.find((t) => t.value === job.employment_type)?.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {job.department} · {job.location}
                    {job.salary_min && job.salary_max
                      ? ` · ${formatPHP(job.salary_min)} – ${formatPHP(job.salary_max)}`
                      : ""}
                    {job.closes_at ? ` · Closes ${new Date(job.closes_at).toLocaleDateString("en-PH")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{job.applications_count ?? 0} applicants</span>
                    <span className="text-border">·</span>
                    <span>{job.slots} slot{job.slots !== 1 ? "s" : ""}</span>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm" variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={(e) => { e.stopPropagation(); setEditing(job); }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      {job.status === "open" && (
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); handleClose(job); }}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <JobFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onCreate={async (data) => { await onCreate(data); onRefresh(); }}
      />
      {editing && (
        <JobFormDialog
          open={!!editing}
          onClose={() => setEditing(null)}
          initial={editing}
          onCreate={async (data) => { await onUpdate(editing.id, data); onRefresh(); setEditing(null); }}
        />
      )}
    </div>
  );
}