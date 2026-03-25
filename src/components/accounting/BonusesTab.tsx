import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Plus, AlertCircle } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BonusStatus = "pending" | "approved" | "rejected";

export interface Bonus {
  id: number;
  employee_id: number;
  employee_name: string;
  bonus_type: string;
  amount: number;
  note?: string;
  status: BonusStatus;
  submitted_by?: string;
  approved_by?: string;
  payroll_period_id?: number;
  created_at: string;
}

interface BonusesTabProps {
  periodId: number | null;
  bonuses: Bonus[];
  employees: { id: number; full_name: string }[];
  isLoading: boolean;
  /** true for Admin / Accountant roles */
  canManage: boolean;
  onApprove: (bonusId: number) => Promise<void>;
  onReject: (bonusId: number) => Promise<void>;
  onAdd: (data: {
    employee_id: number;
    bonus_type: string;
    amount: number;
    note?: string;
    payroll_period_id: number;
  }) => Promise<void>;
  onRefresh: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const BONUS_TYPES = [
  "Performance",
  "13th Month",
  "14th Month",
  "Attendance",
  "Anniversary",
  "Holiday",
  "Referral",
  "Other",
];

type FilterValue = BonusStatus | "all";

const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BonusStatus }) {
  const map: Record<BonusStatus, string> = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    rejected: "bg-red-50 text-red-600 border-red-200",
  };
  const label: Record<BonusStatus, string> = {
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
  };
  return (
    <Badge
      className={`${map[status]} border rounded-full text-xs font-medium px-2 py-0.5`}
    >
      {label[status]}
    </Badge>
  );
}

function formatPHP(amount: number) {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

// ─── Add Bonus Dialog ──────────────────────────────────────────────────────────

interface AddBonusDialogProps {
  open: boolean;
  onClose: () => void;
  employees: { id: number; full_name: string }[];
  periodId: number;
  onAdd: BonusesTabProps["onAdd"];
}

function AddBonusDialog({
  open,
  onClose,
  employees,
  periodId,
  onAdd,
}: AddBonusDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employee_id: "",
    bonus_type: "",
    amount: "",
    note: "",
  });

  const reset = () =>
    setForm({ employee_id: "", bonus_type: "", amount: "", note: "" });

  const handleSubmit = async () => {
    if (!form.employee_id || !form.bonus_type || !form.amount) {
      toast({
        title: "Missing fields",
        description: "Please fill in employee, bonus type, and amount.",
        variant: "destructive",
      });
      return;
    }
    const parsed = parseFloat(form.amount.replace(/,/g, ""));
    if (isNaN(parsed) || parsed <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a positive amount.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await onAdd({
        employee_id: parseInt(form.employee_id),
        bonus_type: form.bonus_type,
        amount: parsed,
        note: form.note || undefined,
        payroll_period_id: periodId,
      });
      toast({
        title: "Bonus added",
        description:
          "Added as approved and will be included in the next compute.",
      });
      reset();
      onClose();
    } catch {
      toast({ title: "Failed to add bonus", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Bonus</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Employee</label>
            <Select
              value={form.employee_id}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, employee_id: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee…" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Bonus type</label>
            <Select
              value={form.bonus_type}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, bonus_type: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                {BONUS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Amount (₱)</label>
            <Input
              placeholder="e.g. 5000"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Note{" "}
              <span className="text-xs opacity-60">(optional)</span>
            </label>
            <Input
              placeholder="Reason or reference…"
              value={form.note}
              onChange={(e) =>
                setForm((f) => ({ ...f, note: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding…" : "Add bonus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BonusesTab({
  periodId,
  bonuses,
  employees,
  isLoading,
  canManage,
  onApprove,
  onReject,
  onAdd,
  onRefresh,
}: BonusesTabProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filtered = bonuses.filter(
    (b) => filter === "all" || b.status === filter
  );

  const counts: Record<FilterValue, number> = {
    all: bonuses.length,
    pending: bonuses.filter((b) => b.status === "pending").length,
    approved: bonuses.filter((b) => b.status === "approved").length,
    rejected: bonuses.filter((b) => b.status === "rejected").length,
  };

  const approvedTotal = bonuses
    .filter((b) => b.status === "approved")
    .reduce((sum, b) => sum + b.amount, 0);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await onApprove(id);
      toast({
        title: "Bonus approved",
        description: "Will be included on next compute.",
      });
      onRefresh();
    } catch {
      toast({ title: "Failed to approve", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await onReject(id);
      toast({ title: "Bonus rejected" });
      onRefresh();
    } catch {
      toast({ title: "Failed to reject", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  if (!periodId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <AlertCircle className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm">Select a payroll period to manage bonuses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-muted/40 rounded-lg border text-sm">
        <span className="text-muted-foreground">Approved bonus total:</span>
        <span className="font-semibold text-emerald-700">
          {formatPHP(approvedTotal)}
        </span>
        {counts.pending > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-amber-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {counts.pending} awaiting approval
          </span>
        )}
      </div>

      {/* Filter bar + Add button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-0.5 bg-muted/50 p-1 rounded-lg">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filter === opt.value
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
              <span className="ml-1 opacity-50">({counts[opt.value]})</span>
            </button>
          ))}
        </div>

        {canManage && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add bonus
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs text-muted-foreground font-medium">
                Employee
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                Bonus type
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-right">
                Amount
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                Note
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                Status
              </TableHead>
              {canManage && (
                <TableHead className="text-xs text-muted-foreground font-medium text-right">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 6 : 5}
                  className="text-center py-10 text-sm text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 6 : 5}
                  className="text-center py-10 text-sm text-muted-foreground"
                >
                  No bonuses for this filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((bonus) => (
                <TableRow
                  key={bonus.id}
                  className="hover:bg-muted/20 text-sm"
                >
                  <TableCell className="font-medium">
                    {bonus.employee_name}
                  </TableCell>
                  <TableCell>{bonus.bonus_type}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPHP(bonus.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {bonus.note || "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={bonus.status} />
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {bonus.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            disabled={actionLoading === bonus.id}
                            onClick={() => handleApprove(bonus.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                            disabled={actionLoading === bonus.id}
                            onClick={() => handleReject(bonus.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {bonus.status === "approved"
                            ? `By ${bonus.approved_by ?? "admin"}`
                            : "—"}
                        </span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddBonusDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        employees={employees}
        periodId={periodId}
        onAdd={onAdd}
      />
    </div>
  );
}