// src/components/performance/KpisTab.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Kpi } from "@/hooks/usePerformance";
import type { Employee } from "@/types/employee";

interface Props {
  kpis: Kpi[];
  employees: Employee[];
  isLoading: boolean;
  canManage: boolean;
  onCreateKpi: (data: Partial<Kpi>) => Promise<Kpi>;
  onUpdateProgress: (id: number, value: number) => Promise<void>;
}

const statusStyles: Record<string, string> = {
  active:       "bg-blue-100 text-blue-800",
  achieved:     "bg-green-100 text-green-800",
  not_achieved: "bg-red-100 text-red-800",
  cancelled:    "bg-gray-100 text-gray-800",
};

const categoryLabels: Record<string, string> = {
  productivity: "Productivity", quality: "Quality", attendance: "Attendance",
  customer_service: "Customer Service", teamwork: "Teamwork", other: "Other",
};

// Fix: form state typed with exact union types
interface KpiForm {
  employee_id: string;
  title: string;
  description: string;
  unit: string;
  target_value: string;
  category: Kpi["category"];
  start_date: string;
  end_date: string;
}

export function KpisTab({ kpis, employees, isLoading, canManage, onCreateKpi, onUpdateProgress }: Props) {
  const [createOpen, setCreateOpen]         = useState(false);
  const [updateOpen, setUpdateOpen]         = useState(false);
  const [selectedKpi, setSelectedKpi]       = useState<Kpi | null>(null);
  const [newValue, setNewValue]             = useState("");
  const [saving, setSaving]                 = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState("all");

  const [form, setForm] = useState<KpiForm>({
    employee_id: "", title: "", description: "", unit: "",
    target_value: "", category: "productivity",
    start_date: "", end_date: "",
  });

  const filtered = kpis.filter(k =>
    employeeFilter === "all" || String(k.employee_id) === employeeFilter
  );

  const getProgress = (kpi: Kpi) => {
    if (kpi.target_value === 0) return 0;
    return Math.min(100, Math.round((kpi.current_value / kpi.target_value) * 100));
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await onCreateKpi({
        ...form,
        employee_id: Number(form.employee_id),
        target_value: Number(form.target_value),
      });
      setCreateOpen(false);
      setForm({ employee_id: "", title: "", description: "", unit: "", target_value: "", category: "productivity", start_date: "", end_date: "" });
    } finally { setSaving(false); }
  };

  const handleUpdateProgress = async () => {
    if (!selectedKpi) return;
    setSaving(true);
    try {
      await onUpdateProgress(selectedKpi.id, Number(newValue));
      setUpdateOpen(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Employees" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.first_name} {e.last_name}</SelectItem>)}
          </SelectContent>
        </Select>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} className="ml-auto">
            <Plus className="mr-2 h-4 w-4" /> Add KPI
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Target className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">No KPIs set</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(kpi => {
            const pct = getProgress(kpi);
            return (
              <Card key={kpi.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{kpi.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {kpi.employee?.first_name} {kpi.employee?.last_name}
                      </p>
                    </div>
                    <Badge className={cn("text-xs", statusStyles[kpi.status])}>
                      {kpi.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {kpi.description && <p className="text-xs text-muted-foreground">{kpi.description}</p>}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{kpi.current_value}{kpi.unit ? ` ${kpi.unit}` : ""}</span>
                      <span className="text-muted-foreground">/ {kpi.target_value}{kpi.unit ? ` ${kpi.unit}` : ""}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-right text-muted-foreground">{pct}% complete</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{categoryLabels[kpi.category]}</Badge>
                    {kpi.status === "active" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs"
                        onClick={() => { setSelectedKpi(kpi); setNewValue(String(kpi.current_value)); setUpdateOpen(true); }}>
                        <TrendingUp className="mr-1 h-3 w-3" /> Update
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add KPI</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Employee *</label>
              <Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input className="mt-1" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Customer Satisfaction Score" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Target Value *</label>
                <Input className="mt-1" type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Unit</label>
                <Input className="mt-1" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. %, calls" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={form.category}
                onValueChange={v => setForm(f => ({ ...f, category: v as Kpi["category"] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(categoryLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.employee_id || !form.title}>
              {saving ? "Creating..." : "Add KPI"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Update Progress</DialogTitle></DialogHeader>
          <div>
            <label className="text-sm font-medium">
              Current Value {selectedKpi?.unit ? `(${selectedKpi.unit})` : ""}
            </label>
            <Input className="mt-1" type="number" value={newValue}
              onChange={e => setNewValue(e.target.value)} max={selectedKpi?.target_value} />
            <p className="mt-1 text-xs text-muted-foreground">Target: {selectedKpi?.target_value}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateProgress} disabled={saving || !newValue}>
              {saving ? "Saving..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}