// src/pages/ShiftManagement.tsx
import { useState, useEffect } from "react";
import { authFetch } from "@/hooks/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Clock, Users, Moon, Sun, Sunset } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShiftTemplate {
  id: number;
  name: string;
  start_time: string;   // "06:00"
  end_time: string;     // "14:00"
  shift_type: "morning" | "afternoon" | "night" | "custom";
  differential_pct: number; // e.g. 10 = 10% night differential
  break_minutes: number;
  employee_count?: number;
}

interface EmployeeShift {
  employee_id: number;
  employee_name: string;
  department: string;
  shift_id: number;
  shift_name: string;
  shift_start: string;
  shift_end: string;
  effective_date: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SHIFT_ICONS: Record<string, React.ElementType> = {
  morning:   Sun,
  afternoon: Sunset,
  night:     Moon,
  custom:    Clock,
};

const SHIFT_COLORS: Record<string, string> = {
  morning:   "bg-amber-50 text-amber-700 border-amber-200",
  afternoon: "bg-orange-50 text-orange-700 border-orange-200",
  night:     "bg-blue-50 text-blue-700 border-blue-200",
  custom:    "bg-gray-100 text-gray-600 border-gray-200",
};

// ── Shift Form Dialog ─────────────────────────────────────────────────────────

function ShiftFormDialog({
  open, onClose, initial, onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: ShiftTemplate;
  onSave: (data: Partial<ShiftTemplate>) => Promise<void>;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:             initial?.name             ?? "",
    start_time:       initial?.start_time       ?? "08:00",
    end_time:         initial?.end_time         ?? "17:00",
    shift_type:       initial?.shift_type       ?? "morning",
    differential_pct: String(initial?.differential_pct ?? 0),
    break_minutes:    String(initial?.break_minutes    ?? 60),
  });

  const handleSave = async () => {
    if (!form.name || !form.start_time || !form.end_time) {
      toast({ title: "Name, start time, and end time are required.", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await onSave({
        ...form,
        differential_pct: parseFloat(form.differential_pct) || 0,
        break_minutes:    parseInt(form.break_minutes) || 60,
      });
      toast({ title: "Shift saved." });
      onClose();
    } catch {
      toast({ title: "Failed to save shift.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit shift" : "New shift template"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Shift name</label>
            <Input placeholder="e.g. Morning shift"
              value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Start time</label>
              <Input type="time" value={form.start_time}
                onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">End time</label>
              <Input type="time" value={form.end_time}
                onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <Select value={form.shift_type}
              onValueChange={(v) => setForm((p) => ({ ...p, shift_type: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="night">Night</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Night differential %</label>
              <Input type="number" min="0" max="100" placeholder="0"
                value={form.differential_pct}
                onChange={(e) => setForm((p) => ({ ...p, differential_pct: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Break (minutes)</label>
              <Input type="number" min="0" max="120"
                value={form.break_minutes}
                onChange={(e) => setForm((p) => ({ ...p, break_minutes: e.target.value }))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Saving…" : "Save shift"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Assign Shift Dialog ───────────────────────────────────────────────────────

function AssignShiftDialog({
  open, shifts, employees, onClose, onAssign,
}: {
  open: boolean;
  shifts: ShiftTemplate[];
  employees: { id: number; full_name: string; department: string }[];
  onClose: () => void;
  onAssign: (employeeId: number, shiftId: number, effectiveDate: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ employee_id: "", shift_id: "", effective_date: "" });

  const handleAssign = async () => {
    if (!form.employee_id || !form.shift_id || !form.effective_date) {
      toast({ title: "All fields are required.", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await onAssign(parseInt(form.employee_id), parseInt(form.shift_id), form.effective_date);
      toast({ title: "Shift assigned." });
      setForm({ employee_id: "", shift_id: "", effective_date: "" });
      onClose();
    } catch {
      toast({ title: "Failed to assign shift.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Assign shift to employee</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Employee</label>
            <Select value={form.employee_id}
              onValueChange={(v) => setForm((p) => ({ ...p, employee_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select employee…" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.full_name} <span className="text-muted-foreground">— {e.department}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Shift</label>
            <Select value={form.shift_id}
              onValueChange={(v) => setForm((p) => ({ ...p, shift_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select shift…" /></SelectTrigger>
              <SelectContent>
                {shifts.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} ({s.start_time}–{s.end_time})
                    {s.differential_pct > 0 && ` +${s.differential_pct}%`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Effective date</label>
            <Input type="date" value={form.effective_date}
              onChange={(e) => setForm((p) => ({ ...p, effective_date: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleAssign} disabled={loading}>{loading ? "Assigning…" : "Assign shift"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ShiftManagement() {
  const { user } = useAuth();
  const canManage = ["Admin", "HR Manager"].includes(user?.role ?? "");

  const [shifts,    setShifts]    = useState<ShiftTemplate[]>([]);
  const [empShifts, setEmpShifts] = useState<EmployeeShift[]>([]);
  const [employees, setEmployees] = useState<{ id: number; full_name: string; department: string }[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [showAssign,setShowAssign]= useState(false);
  const [editing,   setEditing]   = useState<ShiftTemplate | null>(null);
  const [search,    setSearch]    = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, es, emps] = await Promise.all([
        authFetch("/api/shifts").then((r) => r.json()),
        authFetch("/api/employee-shifts").then((r) => r.json()),
        authFetch("/api/employees").then((r) => r.json()),
      ]);
      setShifts(s);
      setEmpShifts(es);
      setEmployees(emps.map((e: any) => ({
        id: e.id,
        full_name: `${e.first_name} ${e.last_name}`,
        department: e.department,
      })));
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const createShift = async (data: Partial<ShiftTemplate>) => {
    const res = await authFetch("/api/shifts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
    fetchAll();
  };

  const updateShift = async (data: Partial<ShiftTemplate>) => {
    const res = await authFetch(`/api/shifts/${editing!.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
    fetchAll();
  };

  const assignShift = async (employeeId: number, shiftId: number, effectiveDate: string) => {
    const res = await authFetch("/api/employee-shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: employeeId, shift_id: shiftId, effective_date: effectiveDate }),
    });
    if (!res.ok) throw new Error();
    fetchAll();
  };

  const filteredEmpShifts = empShifts.filter((es) =>
    !search || es.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    es.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">Shift management</h1>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5"
              onClick={() => setShowAssign(true)}>
              <Users className="w-3.5 h-3.5" />Assign shift
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus className="w-3.5 h-3.5" />New shift
            </Button>
          </div>
        )}
      </div>

      {/* Shift template cards */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Shift templates ({shifts.length})
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {shifts.map((s) => {
            const Icon = SHIFT_ICONS[s.shift_type] ?? Clock;
            return (
              <div key={s.id}
                className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${SHIFT_COLORS[s.shift_type]}`}>
                      <Icon style={{ width: 16, height: 16 }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.start_time} – {s.end_time}</p>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => { setEditing(s); setShowForm(true); }}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{s.break_minutes} min break</span>
                  {s.differential_pct > 0 && (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 border rounded-full text-[10px] px-1.5">
                      +{s.differential_pct}% night diff
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {s.employee_count ?? 0} employees assigned
                </div>
              </div>
            );
          })}
          {shifts.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-6">
              No shift templates yet.
            </p>
          )}
        </div>
      </div>

      {/* Employee shift assignments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Employee assignments ({empShifts.length})
          </p>
          <Input
            className="h-8 w-48 text-xs"
            placeholder="Search employee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs text-muted-foreground font-medium">Employee</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Department</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Shift</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Hours</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Effective</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filteredEmpShifts.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">No assignments found.</TableCell></TableRow>
              ) : filteredEmpShifts.map((es, i) => (
                <TableRow key={i} className="text-sm hover:bg-muted/20">
                  <TableCell className="font-medium">{es.employee_name}</TableCell>
                  <TableCell className="text-muted-foreground">{es.department}</TableCell>
                  <TableCell>
                    <Badge className={`${SHIFT_COLORS["morning"]} border rounded-full text-xs px-2`}>
                      {es.shift_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {es.shift_start} – {es.shift_end}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(es.effective_date).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ShiftFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        initial={editing ?? undefined}
        onSave={editing ? updateShift : createShift}
      />
      <AssignShiftDialog
        open={showAssign}
        shifts={shifts}
        employees={employees}
        onClose={() => setShowAssign(false)}
        onAssign={assignShift}
      />
    </div>
  );
}