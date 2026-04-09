// src/pages/Attendance.tsx
// REPLACE ENTIRE FILE

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { authFetch } from "@/hooks/api";
import {
  Users, UserCheck, UserX, Clock, Calendar, Download,
  Upload, Loader2, CheckCircle, XCircle, Search, AlertCircle,
  RefreshCw, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: "present" | "late" | "absent" | "on_leave" | "half_day";
  minutes_late: number;
  hours_worked: number;
  notes: string | null;
  employee?: { id: number; first_name: string; last_name: string; department: string };
}

interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name: string | null;
  department: string | null;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  rejected_reason?: string | null;
  created_at: string;
}

interface LeaveBalance {
  id: number;
  leave_type: string;
  entitled_days: number;
  used_days: number;
  carried_over: number;
  remaining_days: number;
}

interface LiveStatus {
  total_employees: number;
  present: number;
  late: number;
  absent: number;
  on_leave: number;
  date: string;
  recent_clockins: { id: number; name: string; department: string; time: string; status: string }[];
  dept_breakdown: { department: string; clocked_in: number; total: number }[];
}

interface MonthlyStats {
  present: number;
  late: number;
  absent: number;
  on_leave: number;
  total_hours: number;
  minutes_late: number;
}

const STATUS_COLORS: Record<string, string> = {
  present:  "bg-green-100 text-green-700",
  late:     "bg-amber-100 text-amber-700",
  absent:   "bg-red-100 text-red-700",
  on_leave: "bg-blue-100 text-blue-700",
  half_day: "bg-orange-100 text-orange-700",
};

const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation:    "Vacation",
  sick:        "Sick Leave",
  emergency:   "Emergency",
  maternity:   "Maternity",
  paternity:   "Paternity",
  bereavement: "Bereavement",
  solo_parent: "Solo Parent",
  unpaid:      "Unpaid",
};

// ─── Safe API fetch ───────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res  = await authFetch(url, options);
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? "Request failed");
  return (body.data ?? body) as T;
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 1 — LIVE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════

function LiveDashboard() {
  const [status,  setStatus]  = useState<LiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast }             = useToast();

  const load = async () => {
    setLoading(true);
    try { setStatus(await apiFetch("/api/attendance/live-status")); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Failed to load live status", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!status) return null;

  const rate = status.total_employees > 0 ? Math.round(((status.present + status.late) / status.total_employees) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: status.total_employees, icon: Users,     color: "bg-blue-100 text-blue-600" },
          { label: "Present Today",   value: status.present + status.late, icon: UserCheck, color: "bg-green-100 text-green-600" },
          { label: "On Leave",        value: status.on_leave,        icon: Calendar,  color: "bg-blue-100 text-blue-600" },
          { label: "Absent",          value: status.absent,          icon: UserX,     color: "bg-red-100 text-red-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Today's Attendance Rate</span>
          <span className="text-muted-foreground">{status.present + status.late}/{status.total_employees} ({rate}%)</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden flex gap-0.5">
          <div className="h-full bg-green-500 rounded-l-full" style={{ width: `${status.total_employees > 0 ? (status.present / status.total_employees) * 100 : 0}%` }} />
          <div className="h-full bg-amber-400" style={{ width: `${status.total_employees > 0 ? (status.late / status.total_employees) * 100 : 0}%` }} />
        </div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-green-500" />Present: {status.present}</span>
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-amber-400" />Late: {status.late}</span>
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-blue-400" />On Leave: {status.on_leave}</span>
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-red-400" />Absent: {status.absent}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent clock-ins */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Recent Clock-ins</h3>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="divide-y divide-border">
            {status.recent_clockins.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No clock-ins yet today</p>
            ) : status.recent_clockins.map(ci => (
              <div key={ci.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                  {ci.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ci.name}</p>
                  <p className="text-xs text-muted-foreground">{ci.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono">{ci.time}</p>
                  <Badge className={cn("text-[10px] border-0", STATUS_COLORS[ci.status] ?? "bg-gray-100 text-gray-600")}>{ci.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department breakdown */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-sm">Department Breakdown</h3>
          </div>
          <div className="p-4 space-y-3">
            {status.dept_breakdown.map(dept => {
              const pct = dept.total > 0 ? (dept.clocked_in / dept.total) * 100 : 0;
              return (
                <div key={dept.department}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{dept.department}</span>
                    <span className="font-medium">{dept.clocked_in}/{dept.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 2 — ATTENDANCE HISTORY (HR/Admin)
// ═══════════════════════════════════════════════════════════════════════

function AttendanceHistory({ canManage }: { canManage: boolean }) {
  const { toast }                   = useToast();
  const [records,   setRecords]     = useState<AttendanceRecord[]>([]);
  const [loading,   setLoading]     = useState(true);
  const [search,    setSearch]      = useState("");
  const [status,    setStatus]      = useState("all");
  const [startDate, setStartDate]   = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0,10));
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow]   = useState<Partial<AttendanceRecord> & { employee_id?: number; date?: string }>({});
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate, per_page: "100" });
      if (status !== "all") params.set("status", status);
      const data = await apiFetch<{ data: AttendanceRecord[] }>(`/api/attendance?${params}`);
      setRecords(Array.isArray(data) ? data : (data as { data: AttendanceRecord[] }).data ?? []);
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [startDate, endDate, status]);

  const handleExport = () => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    window.open(`/api/attendance/export?${params}`, "_blank");
  };

  const handleSaveManual = async () => {
    if (!editRow.employee_id || !editRow.date) { toast({ title: "Employee and date are required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await apiFetch("/api/attendance/manual", { method: "POST", body: JSON.stringify(editRow) });
      toast({ title: "Record saved" });
      setEditOpen(false); setEditRow({});
      load();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const filtered = records.filter(r => {
    if (!search) return true;
    const name = r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : "";
    return name.toLowerCase().includes(search.toLowerCase()) || r.employee?.department?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
        <Input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)}   className="w-40" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1"><Download className="h-4 w-4" /> Export CSV</Button>
        {canManage && (
          <Button size="sm" className="gap-1" onClick={() => { setEditRow({}); setEditOpen(true); }}>
            <Pencil className="h-4 w-4" /> Manual Entry
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Employee</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Time In</th>
                  <th className="px-4 py-3 text-left font-semibold">Time Out</th>
                  <th className="px-4 py-3 text-right font-semibold">Hours</th>
                  <th className="px-4 py-3 text-center font-semibold">Late</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  {canManage && <th className="px-4 py-3 text-right font-semibold">Edit</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={canManage ? 8 : 7} className="text-center py-12 text-muted-foreground">No records found</td></tr>
                ) : filtered.map(r => (
                  <tr key={`${r.employee_id}-${r.date}`} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : `#${r.employee_id}`}</p>
                      <p className="text-xs text-muted-foreground">{r.employee?.department}</p>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.date}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.time_in ?? "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.time_out ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right text-xs">{r.hours_worked > 0 ? `${r.hours_worked}h` : "—"}</td>
                    <td className="px-4 py-2.5 text-center text-xs">{r.minutes_late > 0 ? <span className="text-amber-600 font-medium">{r.minutes_late}m</span> : "—"}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge className={cn("text-xs border-0 capitalize", STATUS_COLORS[r.status])}>{r.status.replace("_"," ")}</Badge>
                    </td>
                    {canManage && (
                      <td className="px-4 py-2.5 text-right">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={() => { setEditRow({ employee_id: r.employee_id, date: r.date, time_in: r.time_in ?? "", time_out: r.time_out ?? "", status: r.status, notes: r.notes ?? "" }); setEditOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} records</p>
        </>
      )}

      {/* Manual entry dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Manual Attendance Entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Employee ID *</label>
              <Input type="number" className="mt-1" value={editRow.employee_id ?? ""} onChange={e => setEditRow(p => ({ ...p, employee_id: Number(e.target.value) }))} placeholder="Employee ID number" />
            </div>
            <div>
              <label className="text-sm font-medium">Date *</label>
              <Input type="date" className="mt-1" value={editRow.date ?? ""} onChange={e => setEditRow(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Time In</label>
                <Input type="time" className="mt-1" value={editRow.time_in ?? ""} onChange={e => setEditRow(p => ({ ...p, time_in: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Time Out</label>
                <Input type="time" className="mt-1" value={editRow.time_out ?? ""} onChange={e => setEditRow(p => ({ ...p, time_out: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Status (leave blank = auto)</label>
              <Select value={editRow.status ?? ""} onValueChange={v => setEditRow(p => ({ ...p, status: v as AttendanceRecord["status"] }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Auto-calculate" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input className="mt-1" value={editRow.notes ?? ""} onChange={e => setEditRow(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveManual} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 3 — EXCEL IMPORT
// ═══════════════════════════════════════════════════════════════════════

// src/pages/Attendance.tsx
// REPLACE ONLY THE handleImport function in AttendanceImport component

function AttendanceImport() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ saved: number; errors: string[] } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
    setPreview(rows.slice(0, 5));
    setResult(null);
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast({ title: "Please select a file", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

      // Convert to format backend expects (rows, not records)
      const formattedRows = rows
        .filter(r => r.employee_id && r.date)
        .map(r => ({
          employee_id: Number(r.employee_id),
          date: String(r.date).trim(),
          time_in: String(r.time_in || "").trim() || null,
          time_out: String(r.time_out || "").trim() || null,
          shift: String(r.shift || "morning").trim(),
          status: String(r.status || "").trim() || null,
          notes: String(r.notes || "").trim() || null,
        }));

      // Send as 'rows' - matches backend validation
      const res = await authFetch("/api/attendance/import", {
        method: "POST",
        body: JSON.stringify({ rows: formattedRows }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Import failed");

      setResult(body.data);
      toast({ title: `${body.data.saved} records imported` });
      setPreview([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      console.error(e);
      toast({ title: e instanceof Error ? e.message : "Import failed", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold">Import Attendance from Excel</h3>
        <p className="text-sm text-muted-foreground">
          Upload Excel file with columns: employee_id, date (YYYY-MM-DD), time_in (HH:MM:SS), 
          time_out (HH:MM:SS), shift, status, notes
        </p>

        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Click to select .xlsx or .csv file</p>
          <p className="text-xs text-muted-foreground mt-1">Excel serial dates will be converted automatically</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
        </div>

        {preview.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Preview (first 5 rows):</p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/30">
                  <tr>{Object.keys(preview[0]).map(k => <th key={k} className="px-3 py-2 text-left font-medium">{k}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v, j) => <td key={j} className="px-3 py-1.5">{String(v)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Button onClick={handleImport} disabled={importing || !fileRef.current?.files?.length} className="w-full gap-2">
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {importing ? "Importing..." : "Import Records"}
        </Button>
      </div>

      {result && (
        <div className={cn("rounded-xl border p-4 space-y-2", result.errors.length > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50")}>
          <p className="font-medium text-sm flex items-center gap-2">
            {result.errors.length === 0 ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
            {result.saved} records imported successfully
          </p>
          {result.errors.map((err, i) => (
            <p key={i} className="text-xs text-red-600">{err}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 4 — LEAVE REQUESTS
// ═══════════════════════════════════════════════════════════════════════

function LeaveManagement({ canManage, currentEmployeeId }: { canManage: boolean; currentEmployeeId?: number }) {
  const { toast }                     = useToast();
  const [requests,  setRequests]      = useState<LeaveRequest[]>([]);
  const [balances,  setBalances]      = useState<LeaveBalance[]>([]);
  const [loading,   setLoading]       = useState(true);
  const [statusF,   setStatusF]       = useState("all");
  const [formOpen,  setFormOpen]      = useState(false);
  const [rejectId,  setRejectId]      = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting,    setActing]        = useState<number | null>(null);
  const [form, setForm] = useState({
    leave_type: "vacation", start_date: "", end_date: "", reason: "", employee_id: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [reqs, bals] = await Promise.all([
        apiFetch<LeaveRequest[]>("/api/leave-requests"),
        apiFetch<LeaveBalance[]>(`/api/leave-balances${currentEmployeeId ? `?employee_id=${currentEmployeeId}` : ""}`).catch(() => [] as LeaveBalance[]),
      ]);
      setRequests(Array.isArray(reqs) ? reqs : []);
      setBalances(Array.isArray(bals) ? bals : []);
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submitRequest = async () => {
    if (!form.start_date || !form.end_date || !form.reason) {
      toast({ title: "Fill all required fields", variant: "destructive" }); return;
    }
    setActing(-1);
    try {
      const payload: Record<string, string> = { ...form };
      if (!form.employee_id) delete payload.employee_id;
      await apiFetch("/api/leave-requests", { method: "POST", body: JSON.stringify(payload) });
      toast({ title: "Leave request submitted" });
      setFormOpen(false);
      setForm({ leave_type: "vacation", start_date: "", end_date: "", reason: "", employee_id: "" });
      load();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setActing(null); }
  };

  const approve = async (id: number) => {
    setActing(id);
    try { await apiFetch(`/api/leave-requests/${id}/approve`, { method: "POST" }); toast({ title: "Approved" }); load(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setActing(null); }
  };

  const reject = async () => {
    if (!rejectId || !rejectReason.trim()) { toast({ title: "Provide a reason", variant: "destructive" }); return; }
    setActing(rejectId);
    try {
      await apiFetch(`/api/leave-requests/${rejectId}/reject`, { method: "POST", body: JSON.stringify({ reason: rejectReason }) });
      toast({ title: "Rejected" }); setRejectId(null); setRejectReason(""); load();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setActing(null); }
  };

  const cancel = async (id: number) => {
    setActing(id);
    try { await apiFetch(`/api/leave-requests/${id}/cancel`, { method: "POST" }); toast({ title: "Cancelled" }); load(); }
    catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setActing(null); }
  };

  const filtered = requests.filter(r => statusF === "all" || r.status === statusF);
  const pending  = requests.filter(r => r.status === "pending").length;

  const statusColors: Record<string, string> = {
    pending:   "bg-amber-100 text-amber-700",
    approved:  "bg-green-100 text-green-700",
    rejected:  "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-5">
      {/* Leave balance cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {balances.filter(b => ["vacation","sick","emergency","unpaid"].includes(b.leave_type)).map(b => (
            <div key={b.id} className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">{LEAVE_TYPE_LABELS[b.leave_type] ?? b.leave_type}</p>
              <p className="text-xl font-bold mt-1">{b.remaining_days}</p>
              <p className="text-xs text-muted-foreground">of {b.entitled_days + b.carried_over} days remaining</p>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(b.entitled_days + b.carried_over) > 0 ? (b.remaining_days / (b.entitled_days + b.carried_over)) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* Status filter pills */}
          <div className="flex items-center gap-0.5 bg-muted/50 p-1 rounded-lg">
            {["all","pending","approved","rejected"].map(s => (
              <button key={s} onClick={() => setStatusF(s)}
                className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all capitalize",
                  statusF === s ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {s}{s === "pending" && pending > 0 ? ` (${pending})` : ""}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Request Leave
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                {canManage && <th className="px-4 py-3 text-left font-semibold">Employee</th>}
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Dates</th>
                <th className="px-4 py-3 text-center font-semibold">Days</th>
                <th className="px-4 py-3 text-left font-semibold">Reason</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={canManage ? 7 : 6} className="text-center py-12 text-muted-foreground">No requests found</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-muted/20">
                  {canManage && (
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{r.employee_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.department}</p>
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <Badge className="text-xs border-0 bg-blue-100 text-blue-700">{LEAVE_TYPE_LABELS[r.leave_type] ?? r.leave_type}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {r.start_date} → {r.end_date}
                  </td>
                  <td className="px-4 py-2.5 text-center font-semibold text-sm">{r.days_requested}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[150px] truncate">{r.reason}</td>
                  <td className="px-4 py-2.5">
                    <Badge className={cn("text-xs border-0 capitalize", statusColors[r.status])}>{r.status}</Badge>
                    {r.rejected_reason && <p className="text-[10px] text-red-500 mt-0.5">{r.rejected_reason}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.status === "pending" && canManage && (
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600 hover:bg-green-50"
                          disabled={acting === r.id} onClick={() => approve(r.id)}>
                          {acting === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-red-500 hover:bg-red-50"
                          disabled={acting === r.id} onClick={() => { setRejectId(r.id); setRejectReason(""); }}>
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                    {r.status === "pending" && r.employee_id === currentEmployeeId && !canManage && (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground"
                        disabled={acting === r.id} onClick={() => cancel(r.id)}>
                        Cancel
                      </Button>
                    )}
                    {r.status === "approved" && <span className="text-xs text-muted-foreground">Approved</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submit form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {canManage && (
              <div>
                <label className="text-sm font-medium">Employee ID (leave blank for yourself)</label>
                <Input className="mt-1" type="number" value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))} placeholder="Optional — defaults to your account" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Leave Type <span className="text-red-500">*</span></label>
              <Select value={form.leave_type} onValueChange={v => setForm(p => ({ ...p, leave_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Start Date <span className="text-red-500">*</span></label>
                <Input type="date" className="mt-1" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">End Date <span className="text-red-500">*</span></label>
                <Input type="date" className="mt-1" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason <span className="text-red-500">*</span></label>
              <textarea className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for leave..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={submitRequest} disabled={acting === -1}>
              {acting === -1 && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectId !== null} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reject Leave Request</DialogTitle></DialogHeader>
          <div>
            <label className="text-sm font-medium">Reason for rejection <span className="text-red-500">*</span></label>
            <Input className="mt-1" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Peak season, insufficient balance..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={reject} disabled={acting === rejectId}>
              {acting === rejectId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Need Plus icon
function Plus({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function Attendance() {
  const { user } = useAuth();
  const role      = user?.role ?? "";
  const canManage = role === "Admin" || role === "HR" || role === "Manager";

  // Get current employee id from user email match (best effort)
  const [currentEmployeeId, setCurrentEmployeeId] = useState<number | undefined>();
  useEffect(() => {
    authFetch("/api/auth/me").then(r => r.json()).then(b => {
      const emp = b.data?.employee ?? b.employee;
      if (emp?.id) setCurrentEmployeeId(emp.id);
    }).catch(() => {});
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Attendance & Timekeeping</h1>
        <p className="text-muted-foreground mt-1">Track workforce attendance, import RFID data, manage leave</p>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className={`grid w-full ${canManage ? "grid-cols-4" : "grid-cols-2"}`}>
          <TabsTrigger value="dashboard"><Clock className="h-4 w-4 mr-2" />Live Dashboard</TabsTrigger>
          {canManage && <TabsTrigger value="history">History</TabsTrigger>}
          {canManage && <TabsTrigger value="import"><Upload className="h-4 w-4 mr-2" />Import</TabsTrigger>}
          <TabsTrigger value="leave"><Calendar className="h-4 w-4 mr-2" />Leave Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6"><LiveDashboard /></TabsContent>
        {canManage && <TabsContent value="history"   className="mt-6"><AttendanceHistory canManage={canManage} /></TabsContent>}
        {canManage && <TabsContent value="import"    className="mt-6"><AttendanceImport /></TabsContent>}
        <TabsContent value="leave" className="mt-6">
          <LeaveManagement canManage={canManage} currentEmployeeId={currentEmployeeId} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}