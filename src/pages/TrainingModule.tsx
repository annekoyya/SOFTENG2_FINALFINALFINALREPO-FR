// src/pages/TrainingModule.tsx
import { useState, useEffect } from "react";
import { authFetch } from "@/hooks/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, BookOpen, CheckCircle, AlertCircle, Clock, Award, Users,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrainingCourse {
  id: number;
  title: string;
  category: string;
  description?: string;
  duration_hours: number;
  validity_months?: number;  // null = no expiry
  is_mandatory: boolean;
  created_at: string;
}

interface TrainingAssignment {
  id: number;
  employee_id: number;
  employee_name: string;
  department: string;
  course_id: number;
  course_title: string;
  status: "assigned" | "in_progress" | "completed" | "expired";
  assigned_date: string;
  due_date?: string;
  completed_date?: string;
  expires_at?: string;
  score?: number;
  notes?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Orientation", "Safety & Emergency", "Food Safety", "Guest Relations",
  "IT Systems", "HR Policies", "Leadership", "Compliance", "Other",
];

function StatusBadge({ status }: { status: TrainingAssignment["status"] }) {
  const map: Record<string, string> = {
    assigned:    "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    completed:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    expired:     "bg-red-50 text-red-600 border-red-200",
  };
  const label: Record<string, string> = {
    assigned: "Assigned", in_progress: "In progress",
    completed: "Completed", expired: "Expired",
  };
  return (
    <Badge className={`${map[status]} border rounded-full text-xs capitalize px-2 py-0.5`}>
      {label[status]}
    </Badge>
  );
}

// ── Add Course Dialog ─────────────────────────────────────────────────────────

function AddCourseDialog({
  open, onClose, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (data: Partial<TrainingCourse>) => Promise<void>;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", category: "Orientation", description: "",
    duration_hours: "1", validity_months: "", is_mandatory: false,
  });

  const handleAdd = async () => {
    if (!form.title) { toast({ title: "Title required.", variant: "destructive" }); return; }
    setLoading(true);
    try {
      await onAdd({
        ...form,
        duration_hours:  parseFloat(form.duration_hours) || 1,
        validity_months: form.validity_months ? parseInt(form.validity_months) : undefined,
      });
      toast({ title: "Course added." });
      setForm({ title: "", category: "Orientation", description: "", duration_hours: "1", validity_months: "", is_mandatory: false });
      onClose();
    } catch {
      toast({ title: "Failed to add course.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add training course</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Course title</label>
            <Input placeholder="e.g. Fire safety & emergency response"
              value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration (hours)</label>
              <Input type="number" min="0.5" step="0.5"
                value={form.duration_hours}
                onChange={(e) => setForm((p) => ({ ...p, duration_hours: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Validity (months) <span className="text-xs opacity-60">— leave blank for no expiry</span>
            </label>
            <Input type="number" min="1" placeholder="e.g. 12"
              value={form.validity_months}
              onChange={(e) => setForm((p) => ({ ...p, validity_months: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Description (optional)</label>
            <Textarea rows={2} value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.is_mandatory}
              onChange={(e) => setForm((p) => ({ ...p, is_mandatory: e.target.checked }))} />
            Mandatory for all employees
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleAdd} disabled={loading}>{loading ? "Adding…" : "Add course"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Assign Dialog ─────────────────────────────────────────────────────────────

function AssignDialog({
  open, courses, employees, onClose, onAssign,
}: {
  open: boolean;
  courses: TrainingCourse[];
  employees: { id: number; full_name: string }[];
  onClose: () => void;
  onAssign: (d: { employee_id: number; course_id: number; due_date?: string }) => Promise<void>;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ employee_id: "", course_id: "", due_date: "" });

  const handleAssign = async () => {
    if (!form.employee_id || !form.course_id) {
      toast({ title: "Employee and course required.", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await onAssign({
        employee_id: parseInt(form.employee_id),
        course_id:   parseInt(form.course_id),
        due_date:    form.due_date || undefined,
      });
      toast({ title: "Training assigned." });
      setForm({ employee_id: "", course_id: "", due_date: "" });
      onClose();
    } catch {
      toast({ title: "Failed to assign.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Assign training</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Employee</label>
            <Select value={form.employee_id} onValueChange={(v) => setForm((p) => ({ ...p, employee_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select employee…" /></SelectTrigger>
              <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Course</label>
            <Select value={form.course_id} onValueChange={(v) => setForm((p) => ({ ...p, course_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select course…" /></SelectTrigger>
              <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Due date (optional)</label>
            <Input type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleAssign} disabled={loading}>{loading ? "Assigning…" : "Assign"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TrainingModule() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canManage = ["Admin", "HR Manager"].includes(user?.role ?? "");

  const [courses,     setCourses]     = useState<TrainingCourse[]>([]);
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [employees,   setEmployees]   = useState<{ id: number; full_name: string }[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAssign,    setShowAssign]    = useState(false);
  const [statusFilter,  setStatusFilter]  = useState<string>("all");
  const [completing,    setCompleting]    = useState<number | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, a, emps] = await Promise.all([
        authFetch("/api/training-courses").then((r) => r.json()),
        authFetch("/api/training-assignments").then((r) => r.json()),
        authFetch("/api/employees").then((r) => r.json()),
      ]);
      setCourses(c);
      setAssignments(a);
      setEmployees(emps.map((e: any) => ({ id: e.id, full_name: `${e.first_name} ${e.last_name}` })));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const addCourse = async (data: Partial<TrainingCourse>) => {
    const res = await authFetch("/api/training-courses", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
    fetchAll();
  };

  const assignTraining = async (data: any) => {
    const res = await authFetch("/api/training-assignments", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
    fetchAll();
  };

  const markComplete = async (id: number) => {
    setCompleting(id);
    try {
      await authFetch(`/api/training-assignments/${id}/complete`, { method: "POST" });
      toast({ title: "Marked as completed." });
      fetchAll();
    } catch {
      toast({ title: "Failed.", variant: "destructive" });
    } finally { setCompleting(null); }
  };

  const expiring = assignments.filter((a) => {
    if (!a.expires_at || a.status !== "completed") return false;
    const daysLeft = (new Date(a.expires_at).getTime() - Date.now()) / 86400000;
    return daysLeft <= 30 && daysLeft >= 0;
  });

  const filtered = assignments.filter((a) => statusFilter === "all" || a.status === statusFilter);

  const counts = {
    all:         assignments.length,
    assigned:    assignments.filter((a) => a.status === "assigned").length,
    in_progress: assignments.filter((a) => a.status === "in_progress").length,
    completed:   assignments.filter((a) => a.status === "completed").length,
    expired:     assignments.filter((a) => a.status === "expired").length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">Training & certifications</h1>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5"
              onClick={() => setShowAssign(true)}>
              <Users className="w-3.5 h-3.5" />Assign training
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setShowAddCourse(true)}>
              <Plus className="w-3.5 h-3.5" />Add course
            </Button>
          </div>
        )}
      </div>

      {/* Expiry alert */}
      {expiring.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {expiring.length} certification{expiring.length > 1 ? "s" : ""} expiring within 30 days
        </div>
      )}

      {/* Course catalog */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Course catalog ({courses.length})
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.map((c) => (
            <div key={c.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.category}</p>
                  </div>
                </div>
                {c.is_mandatory && (
                  <Badge className="bg-red-50 text-red-600 border-red-200 border rounded-full text-[10px] px-1.5 flex-shrink-0">
                    Mandatory
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />{c.duration_hours}h
                </span>
                {c.validity_months && (
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3" />Valid {c.validity_months} months
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assignments table */}
      <div>
        <div className="flex items-center gap-0.5 bg-muted/50 p-1 rounded-lg w-fit mb-3">
          {(["all","assigned","in_progress","completed","expired"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                statusFilter === s ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {s.replace("_", " ")} <span className="opacity-50">({counts[s]})</span>
            </button>
          ))}
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs text-muted-foreground font-medium">Employee</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Course</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Due date</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Completed</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Expires</TableHead>
                {canManage && (
                  <TableHead className="text-xs text-muted-foreground font-medium text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={canManage ? 7 : 6} className="text-center py-10 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={canManage ? 7 : 6} className="text-center py-10 text-sm text-muted-foreground">No assignments found.</TableCell></TableRow>
              ) : filtered.map((a) => (
                <TableRow key={a.id} className="text-sm hover:bg-muted/20">
                  <TableCell className="font-medium">
                    {a.employee_name}
                    <span className="block text-xs text-muted-foreground">{a.department}</span>
                  </TableCell>
                  <TableCell>{a.course_title}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.due_date ? new Date(a.due_date).toLocaleDateString("en-PH", { dateStyle: "medium" }) : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.completed_date ? new Date(a.completed_date).toLocaleDateString("en-PH", { dateStyle: "medium" }) : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {a.expires_at ? (
                      <span className={
                        (new Date(a.expires_at).getTime() - Date.now()) / 86400000 <= 30
                          ? "text-amber-600 font-medium"
                          : "text-muted-foreground"
                      }>
                        {new Date(a.expires_at).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                      </span>
                    ) : "—"}
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {["assigned","in_progress"].includes(a.status) && (
                        <Button size="sm" variant="ghost"
                          className="h-7 px-2 text-emerald-600 hover:bg-emerald-50"
                          disabled={completing === a.id}
                          onClick={() => markComplete(a.id)}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />Mark complete
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddCourseDialog open={showAddCourse} onClose={() => setShowAddCourse(false)} onAdd={addCourse} />
      <AssignDialog open={showAssign} courses={courses} employees={employees}
        onClose={() => setShowAssign(false)} onAssign={assignTraining} />
    </div>
  );
}