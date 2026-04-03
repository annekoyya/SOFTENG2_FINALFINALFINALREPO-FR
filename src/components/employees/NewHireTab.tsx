// src/components/employees/NewHireTab.tsx
// Drop this as a new tab inside src/pages/Employees.tsx (Admin only)
// Import and add:  <NewHireTab />  inside a Tab panel gated by role === "Admin"

import { useState, useEffect } from "react";
import { authFetch } from "@/hooks/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CheckCircle, UserPlus, BookOpen } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type NewHireStatus = "pending" | "complete" | "transferred";

interface NewHire {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  job_category: string;
  start_date: string;
  status: NewHireStatus;
  training_program?: string;
  training_notes?: string;
  created_at: string;
  // set when transferred
  employee_id?: number;
  source?: string; // 'direct' | 'recruitment'
}

const TRAINING_PROGRAMS = [
  "Hotel operations orientation",
  "Front desk procedures",
  "Housekeeping standards",
  "Food safety & hygiene",
  "Fire safety & emergency",
  "Guest relations",
  "POS & billing system",
  "Security protocols",
  "Custom",
];

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: NewHireStatus }) {
  const map: Record<NewHireStatus, string> = {
    pending:     "bg-amber-50 text-amber-700 border-amber-200",
    complete:    "bg-blue-50 text-blue-700 border-blue-200",
    transferred: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <Badge className={`${map[status]} border rounded-full text-xs px-2 py-0.5 capitalize`}>
      {status}
    </Badge>
  );
}

// ── Training Program Dialog ───────────────────────────────────────────────────

function TrainingDialog({
  open, hire, onClose, onSave,
}: {
  open: boolean;
  hire: NewHire;
  onClose: () => void;
  onSave: (id: number, program: string, notes: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [program, setProgram] = useState(hire.training_program ?? "Hotel operations orientation");
  const [notes,   setNotes]   = useState(hire.training_notes ?? "");

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(hire.id, program, notes);
      toast({ title: "Training program saved." });
      onClose();
    } catch {
      toast({ title: "Failed to save.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Training program — {hire.first_name} {hire.last_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Program</label>
            <Select value={program} onValueChange={setProgram}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRAINING_PROGRAMS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Notes (optional)</label>
            <Input
              placeholder="Schedule, trainer name, room…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NewHireTab() {
  const { toast } = useToast();
  const [hires,       setHires]       = useState<NewHire[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [transferring,setTransferring]= useState<number | null>(null);
  const [trainingHire,setTrainingHire]= useState<NewHire | null>(null);
  const [filter,      setFilter]      = useState<NewHireStatus | "all">("all");

  const fetchHires = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/new-hires");
      const response = await res.json();
      setHires(Array.isArray(response.data) ? response.data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchHires(); }, []);

  const filtered = hires.filter((h) => filter === "all" || h.status === filter);

  const counts = {
    all:         hires.length,
    pending:     hires.filter((h) => h.status === "pending").length,
    complete:    hires.filter((h) => h.status === "complete").length,
    transferred: hires.filter((h) => h.status === "transferred").length,
  };

  const handleTransfer = async (id: number) => {
    setTransferring(id);
    try {
      const res = await authFetch(`/api/new-hires/${id}/transfer`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast({ title: "New hire transferred to Employees." });
      fetchHires();
    } catch {
      toast({ title: "Transfer failed — ensure all required fields are filled.", variant: "destructive" });
    } finally { setTransferring(null); }
  };

  const handleSaveTraining = async (id: number, program: string, notes: string) => {
    const res = await authFetch(`/api/new-hires/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ training_program: program, training_notes: notes }),
    });
    if (!res.ok) throw new Error();
    fetchHires();
  };

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      {counts.complete > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {counts.complete} new hire{counts.complete > 1 ? "s" : ""} ready to transfer to employees
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-0.5 bg-muted/50 p-1 rounded-lg w-fit">
        {(["all","pending","complete","transferred"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
              filter === s ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s} <span className="opacity-50">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs text-muted-foreground font-medium">Name</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Department</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Start date</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Source</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Training program</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                  No new hires found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((hire) => (
                <TableRow key={hire.id} className="text-sm hover:bg-muted/20">
                  <TableCell className="font-medium">
                    {hire.first_name} {hire.last_name}
                    <span className="block text-xs text-muted-foreground">{hire.email}</span>
                  </TableCell>
                  <TableCell>
                    {hire.department}
                    <span className="block text-xs text-muted-foreground">{hire.job_category}</span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {hire.start_date
                      ? new Date(hire.start_date).toLocaleDateString("en-PH", { dateStyle: "medium" })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-muted text-muted-foreground border-0 text-[10px] rounded-full px-1.5 capitalize">
                      {hire.source ?? "direct"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {hire.training_program ? (
                      <span className="text-xs">{hire.training_program}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell><StatusBadge status={hire.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Assign / edit training */}
                      {hire.status !== "transferred" && (
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => setTrainingHire(hire)}
                        >
                          <BookOpen className="w-3.5 h-3.5 mr-1" />
                          {hire.training_program ? "Edit training" : "Set training"}
                        </Button>
                      )}
                      {/* Transfer to employee */}
                      {hire.status === "complete" && (
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 px-2 text-emerald-600 hover:bg-emerald-50"
                          disabled={transferring === hire.id}
                          onClick={() => handleTransfer(hire.id)}
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          Transfer
                        </Button>
                      )}
                      {hire.status === "transferred" && hire.employee_id && (
                        <span className="text-xs text-muted-foreground">
                          → Emp #{hire.employee_id}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {trainingHire && (
        <TrainingDialog
          open={!!trainingHire}
          hire={trainingHire}
          onClose={() => setTrainingHire(null)}
          onSave={handleSaveTraining}
        />
      )}
    </div>
  );
}