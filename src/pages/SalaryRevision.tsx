import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEmployees } from "@/hooks/useEmployees";
import { useSalaryRevision } from "@/hooks/useSalaryRevision";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  REVISION_REASON_LABELS,
  type SalaryRevision, type RevisionReason,
} from "@/types/salaryRevision";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatPHP(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function ChangeBadge({ amount, pct }: { amount: number; pct: number }) {
  if (amount > 0) return (
    <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
      <TrendingUp className="w-3.5 h-3.5" />+{formatPHP(amount)} (+{pct.toFixed(1)}%)
    </span>
  );
  if (amount < 0) return (
    <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
      <TrendingDown className="w-3.5 h-3.5" />{formatPHP(amount)} ({pct.toFixed(1)}%)
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-muted-foreground text-xs">
      <Minus className="w-3.5 h-3.5" />No change
    </span>
  );
}

// ── Add Revision Dialog ───────────────────────────────────────────────────────

function AddRevisionDialog({
  open, onClose, employees, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  employees: { id: number; full_name: string; basic_salary: number }[];
  onAdd: (data: any) => Promise<void>;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    new_salary: "",
    reason: "annual_review",
    effective_date: "",
    notes: "",
  });

  const selectedEmp = employees.find((e) => e.id === parseInt(form.employee_id));
  const newSal      = parseFloat(form.new_salary) || 0;
  const diff        = selectedEmp ? newSal - selectedEmp.basic_salary : 0;
  const pct         = selectedEmp && selectedEmp.basic_salary > 0
    ? (diff / selectedEmp.basic_salary) * 100 : 0;

  const handleSubmit = async () => {
    if (!form.employee_id || !form.new_salary || !form.effective_date) {
      toast({ title: "Employee, new salary, and effective date are required.", variant: "destructive" }); return;
    }
    if (newSal <= 0) {
      toast({ title: "Enter a valid salary amount.", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await onAdd({ ...form, employee_id: parseInt(form.employee_id), new_salary: newSal });
      toast({ title: "Salary revision saved." });
      setForm({ employee_id: "", new_salary: "", reason: "annual_review", effective_date: "", notes: "" });
      onClose();
    } catch {
      toast({ title: "Failed to save revision.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New salary revision</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Employee</label>
            <Select value={form.employee_id}
              onValueChange={(v) => setForm((p) => ({ ...p, employee_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select employee…" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.full_name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatPHP(e.basic_salary)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEmp && (
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm flex justify-between">
              <span className="text-muted-foreground">Current salary</span>
              <span className="font-medium">{formatPHP(selectedEmp.basic_salary)}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">New salary (₱/month)</label>
            <div className="flex items-center gap-2">
              <Input placeholder="e.g. 28000" value={form.new_salary}
                onChange={(e) => setForm((p) => ({ ...p, new_salary: e.target.value }))} />
              {selectedEmp && newSal > 0 && (
                <ChangeBadge amount={diff} pct={pct} />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reason</label>
            <Select value={form.reason}
              onValueChange={(v) => setForm((p) => ({ ...p, reason: v as RevisionReason }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(REVISION_REASON_LABELS) as [RevisionReason, string][]).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Effective date</label>
            <Input type="date" value={form.effective_date}
              onChange={(e) => setForm((p) => ({ ...p, effective_date: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Notes (optional)</label>
            <Textarea rows={2} placeholder="Performance review summary, board resolution ref…"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Saving…" : "Save revision"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Timeline row ──────────────────────────────────────────────────────────────

function RevisionRow({ r, showEmployee }: { r: SalaryRevision; showEmployee: boolean }) {
  return (
    <div className="flex gap-4 pb-5 relative">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${
          r.change_amount > 0 ? "bg-emerald-500" :
          r.change_amount < 0 ? "bg-red-400" : "bg-gray-300"
        }`} />
        <div className="w-0.5 bg-border/60 flex-1 mt-1" />
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            {showEmployee && (
              <p className="text-sm font-medium">{r.employee_name}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{formatPHP(r.new_salary)}</span>
              <ChangeBadge amount={r.change_amount} pct={r.change_pct} />
              <Badge className="bg-muted text-muted-foreground border-0 text-[10px] rounded-full px-1.5">
                {REVISION_REASON_LABELS[r.reason]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              From {formatPHP(r.previous_salary)} · Effective{" "}
              {new Date(r.effective_date).toLocaleDateString("en-PH", { dateStyle: "medium" })}
              {r.approved_by_name && ` · Approved by ${r.approved_by_name}`}
            </p>
            {r.notes && (
              <p className="text-xs text-muted-foreground mt-1 italic">{r.notes}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex-shrink-0">
            {new Date(r.created_at).toLocaleDateString("en-PH", { dateStyle: "short" })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SalaryRevisionPage() {
  const { user } = useAuth();
  const canManage = ["Admin", "HR Manager"].includes(user?.role ?? "");

  const { employees, fetchEmployees } = useEmployees();
  const { revisions, isLoading, fetchRevisions, createRevision } = useSalaryRevision();

  const [showAdd, setShowAdd]         = useState(false);
  const [empFilter, setEmpFilter]     = useState<string>("all");

  useEffect(() => { fetchEmployees(); fetchRevisions(); }, []);

  const filtered = empFilter === "all"
    ? revisions
    : revisions.filter((r) => r.employee_id === parseInt(empFilter));

  const empList = employees.map((e) => ({
    id: e.id,
    full_name: `${e.first_name} ${e.last_name}`,
    basic_salary: parseFloat(String(e.basic_salary ?? 0)),
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">Salary revision history</h1>
        <div className="flex items-center gap-2">
          <Select value={empFilter} onValueChange={setEmpFilter}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {empList.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>{e.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManage && (
            <Button size="sm" className="gap-1.5" onClick={() => setShowAdd(true)}>
              <Plus className="w-3.5 h-3.5" />New revision
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No salary revisions recorded yet.
          </p>
        ) : (
          <div>
            {filtered.map((r) => (
              <RevisionRow key={r.id} r={r} showEmployee={empFilter === "all"} />
            ))}
          </div>
        )}
      </div>

      <AddRevisionDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        employees={empList}
        onAdd={async (data) => {
          await createRevision(data);
          fetchRevisions();
          fetchEmployees(); // refresh salary in employee list
        }}
      />
    </div>
  );
}