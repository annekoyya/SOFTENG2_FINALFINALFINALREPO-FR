// src/components/performance/GoalsTab.tsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, Flag, CalendarDays, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Goal } from "@/hooks/usePerformance";
import type { Employee } from "@/types/employee";

interface Props {
  goals: Goal[];
  employees: Employee[];
  isLoading: boolean;
  canManage: boolean;
  onCreateGoal: (data: Partial<Goal>) => Promise<Goal>;
  onUpdateProgress: (id: number, progress: number, notes?: string) => Promise<void>;
}

const priorityStyles: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high:     "bg-orange-100 text-orange-800",
  medium:   "bg-yellow-100 text-yellow-800",
  low:      "bg-green-100 text-green-800",
};

const statusStyles: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed:   "bg-green-100 text-green-800",
  overdue:     "bg-red-100 text-red-800",
  cancelled:   "bg-gray-100 text-gray-500",
};

const categoryLabels: Record<string, string> = {
  professional_development: "Professional Dev",
  performance: "Performance", project: "Project",
  behavioral: "Behavioral", other: "Other",
};

// Fix: form state typed with exact union types
interface GoalForm {
  employee_id: string;
  title: string;
  description: string;
  due_date: string;
  priority: Goal["priority"];
  category: Goal["category"];
}

export function GoalsTab({ goals, employees, isLoading, canManage, onCreateGoal, onUpdateProgress }: Props) {
  const [createOpen, setCreateOpen]         = useState(false);
  const [updateOpen, setUpdateOpen]         = useState(false);
  const [selectedGoal, setSelectedGoal]     = useState<Goal | null>(null);
  const [progressVal, setProgressVal]       = useState("");
  const [progressNotes, setProgressNotes]   = useState("");
  const [saving, setSaving]                 = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [statusFilter, setStatusFilter]     = useState("all");

  const [form, setForm] = useState<GoalForm>({
    employee_id: "", title: "", description: "",
    due_date: "", priority: "medium", category: "performance",
  });

  const filtered = goals.filter(g => {
    const matchEmp    = employeeFilter === "all" || String(g.employee_id) === employeeFilter;
    const matchStatus = statusFilter   === "all" || g.status === statusFilter;
    return matchEmp && matchStatus;
  });

  const isOverdue = (g: Goal) =>
    new Date(g.due_date) < new Date() && !["completed", "cancelled"].includes(g.status);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await onCreateGoal({ ...form, employee_id: Number(form.employee_id) });
      setCreateOpen(false);
      setForm({ employee_id: "", title: "", description: "", due_date: "", priority: "medium", category: "performance" });
    } finally { setSaving(false); }
  };

  const handleUpdateProgress = async () => {
    if (!selectedGoal) return;
    setSaving(true);
    try {
      await onUpdateProgress(selectedGoal.id, Number(progressVal), progressNotes);
      setUpdateOpen(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Employees" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.first_name} {e.last_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.keys(statusStyles).map(v => (
              <SelectItem key={v} value={v}>{v.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} className="ml-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Goal
          </Button>
        )}
      </div>

      {/* Goals List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Flag className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">No goals found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(goal => (
            <Card key={goal.id} className={cn("hover:shadow-sm transition-shadow", isOverdue(goal) && "border-red-200")}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{goal.title}</p>
                      {isOverdue(goal) && <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {goal.employee?.first_name} {goal.employee?.last_name}
                    </p>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge className={cn("text-xs capitalize", statusStyles[goal.status])}>
                      {goal.status.replace("_", " ")}
                    </Badge>
                    <Badge className={cn("text-xs capitalize", priorityStyles[goal.priority])}>
                      {goal.priority}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Due: {new Date(goal.due_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span>{goal.progress}% complete</span>
                  </div>
                  <Progress value={goal.progress} className="h-1.5" />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{categoryLabels[goal.category]}</Badge>
                  {!["completed", "cancelled"].includes(goal.status) && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs"
                      onClick={() => { setSelectedGoal(goal); setProgressVal(String(goal.progress)); setProgressNotes(""); setUpdateOpen(true); }}>
                      <TrendingUp className="mr-1 h-3 w-3" /> Update
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Goal</DialogTitle></DialogHeader>
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
              <Input className="mt-1" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Complete Laravel certification" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea className="mt-1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="text-sm font-medium">Due Date *</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select value={form.priority}
                  onValueChange={v => setForm(f => ({ ...f, priority: v as Goal["priority"] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["low","medium","high","critical"] as Goal["priority"][]).map(p => (
                      <SelectItem key={p} value={p}>{p.replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={form.category}
                  onValueChange={v => setForm(f => ({ ...f, category: v as Goal["category"] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(categoryLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.employee_id || !form.title || !form.due_date}>
              {saving ? "Creating..." : "Add Goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle>Update Progress</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Progress (0–100%)</label>
              <Input className="mt-1" type="number" min={0} max={100} value={progressVal}
                onChange={e => setProgressVal(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea className="mt-1" value={progressNotes}
                onChange={e => setProgressNotes(e.target.value)} rows={2} placeholder="What was accomplished?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateProgress} disabled={saving}>
              {saving ? "Saving..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}