import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Loader2 } from "lucide-react";
import { authFetch } from "@/hooks/api";
import { useAuth } from "@/hooks/useAuth";
import type { LeaveBalance, LeaveType } from "@/types/leave";
import { LEAVE_POLICIES, LEAVE_LABEL } from "@/types/leave";

// ── Colour per leave type ─────────────────────────────────────────────────────

const TYPE_COLOR: Record<LeaveType, string> = {
  vacation:    "bg-blue-500",
  sick:        "bg-red-400",
  emergency:   "bg-orange-400",
  maternity:   "bg-pink-400",
  paternity:   "bg-violet-400",
  bereavement: "bg-gray-400",
  solo_parent: "bg-teal-400",
  unpaid:      "bg-gray-300",
};

const TYPE_BG: Record<LeaveType, string> = {
  vacation:    "bg-blue-50 border-blue-100",
  sick:        "bg-red-50 border-red-100",
  emergency:   "bg-orange-50 border-orange-100",
  maternity:   "bg-pink-50 border-pink-100",
  paternity:   "bg-violet-50 border-violet-100",
  bereavement: "bg-gray-50 border-gray-100",
  solo_parent: "bg-teal-50 border-teal-100",
  unpaid:      "bg-gray-50 border-gray-100",
};

// ── Single balance row ────────────────────────────────────────────────────────

function BalanceRow({
  balance,
  canAdjust,
  onAdjust,
}: {
  balance: LeaveBalance;
  canAdjust: boolean;
  onAdjust: (b: any) => void;
}) {
  const totalDays = balance.entitled_days + balance.carried_over;
  const usedDays = balance.used_days;
  const remainingDays = balance.remaining_days;
  const pct = totalDays > 0 ? Math.min(100, Math.round((usedDays / totalDays) * 100)) : 0;

  const policy = LEAVE_POLICIES.find((p) => p.leave_type === balance.leave_type);

  return (
    <div className={`rounded-lg border p-3 ${TYPE_BG[balance.leave_type]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${TYPE_COLOR[balance.leave_type]}`} />
          <span className="text-sm font-medium">{LEAVE_LABEL[balance.leave_type]}</span>
          {!policy?.paid && (
            <span className="text-[10px] bg-gray-200 text-gray-600 rounded px-1">unpaid</span>
          )}
          {balance.carried_over > 0 && (
            <span className="text-[10px] text-muted-foreground">
              +{balance.carried_over} carried
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {remainingDays}
            <span className="text-xs font-normal text-muted-foreground">
              /{totalDays} days left
            </span>
          </span>
          {canAdjust && (
            <button
              onClick={() => onAdjust(balance)}
              className="p-1 rounded hover:bg-black/5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar: used / remaining */}
      <div className="h-1.5 rounded-full bg-black/5 overflow-hidden flex">
        <div
          className={`h-full ${TYPE_COLOR[balance.leave_type]} transition-all`}
          style={{ width: `${pct}%` }}
        />
        {balance.pending_days > 0 && (
          <div
            className="h-full bg-amber-300 transition-all"
            style={{
              width: `${Math.min(100 - pct, Math.round((balance.pending_days / totalDays) * 100))}%`,
            }}
          />
        )}
      </div>

      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
        <span>Used: {usedDays}</span>
        {balance.pending_days > 0 && (
          <span className="text-amber-600">Pending: {balance.pending_days}</span>
        )}
        <span>Remaining: {remainingDays}</span>
      </div>
    </div>
  );
}

// ── Adjust dialog ─────────────────────────────────────────────────────────────

interface AdjustDialogProps {
  open: boolean;
  balance: LeaveBalance | null;
  onClose: () => void;
  onSave: (employeeId: number, leaveType: LeaveType, adjustment: number, reason: string) => Promise<void>;
}

function AdjustDialog({ open, balance, onClose, onSave }: AdjustDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [adjustment, setAdjustment] = useState("");
  const [reason, setReason] = useState("");

  if (!balance) return null;

  const handleSave = async () => {
    const adj = parseFloat(adjustment);
    if (isNaN(adj)) {
      toast({ title: "Enter a valid number (positive to add, negative to deduct).", variant: "destructive" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Reason is required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await onSave(balance.employee_id, balance.leave_type, adj, reason);
      toast({ title: "Balance adjusted." });
      setAdjustment("");
      setReason("");
      onClose();
    } catch {
      toast({ title: "Failed to adjust balance.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust — {LEAVE_LABEL[balance.leave_type]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 text-sm">
          <div className="rounded-lg bg-muted/40 p-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Entitled</p>
              <p className="font-semibold">{balance.entitled_days}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Used</p>
              <p className="font-semibold">{balance.used_days}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="font-semibold">{balance.remaining_days}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Adjustment (+ to add, − to deduct days)
            </label>
            <Input
              placeholder="e.g. 2 or -1"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reason</label>
            <Input
              placeholder="e.g. Conversion of cash, error correction…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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

// ── Main component - Shows only logged-in user's balances ─────────────────────

interface LeaveBalanceCardProps {
  canAdjust?: boolean;
}

export default function LeaveBalanceCard({ canAdjust = false }: LeaveBalanceCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [adjusting, setAdjusting] = useState<LeaveBalance | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());

  // First, get the employee ID for the logged-in user
  const fetchEmployeeId = async () => {
    try {
      const res = await authFetch("/api/employees?email=" + user?.email);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const emp = data.data[0];
        setEmployeeId(emp.id);
        setEmployeeName(`${emp.first_name} ${emp.last_name}`);
        return emp.id;
      }
    } catch (error) {
      console.error("Failed to fetch employee:", error);
    }
    return null;
  };

  const fetchBalances = async (empId: number) => {
    setLoading(true);
    try {
      // Fetch only balances for this specific employee
      const res = await authFetch(`/api/leave-balances?employee_id=${empId}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        // Filter to ensure we only show this employee's balances
        const userBalances = data.data.filter((b: LeaveBalance) => b.employee_id === empId);
        setBalances(userBalances);
      }
    } catch (error) {
      console.error("Failed to fetch balances:", error);
      toast({ title: "Error", description: "Failed to load leave balances", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const empId = await fetchEmployeeId();
      if (empId) {
        await fetchBalances(empId);
      } else {
        setLoading(false);
      }
    };
    loadData();
  }, [year]);

  const handleAdjust = async (employeeIdNum: number, leaveType: LeaveType, adjustment: number, reason: string) => {
    const res = await authFetch("/api/leave-balances/adjust", {
      method: "POST",
      body: JSON.stringify({ employee_id: employeeIdNum, leave_type: leaveType, adjustment, reason }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    await fetchBalances(employeeIdNum);
  };

  // Only show leave types that have an entitlement or a non-zero balance
  const visible = balances.filter(
    (b) => b.entitled_days > 0 || b.used_days > 0 || b.carried_over > 0
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
          <p className="text-sm text-gray-500 mt-2">Loading your leave balances...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
        <p className="text-sm font-medium">{employeeName || "Your Leave Balances"}</p>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="text-xs border rounded px-2 py-1 bg-transparent"
          >
            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
          </select>
        </div>
      </div>
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {visible.length === 0 ? (
          <p className="text-xs text-muted-foreground col-span-2 text-center py-4">
            No leave balances found. Contact HR to set up your leave credits.
          </p>
        ) : (
          visible.map((b) => (
            <BalanceRow
              key={b.leave_type}
              balance={b}
              canAdjust={canAdjust}
              onAdjust={setAdjusting}
            />
          ))
        )}
      </div>
      <AdjustDialog
        open={!!adjusting}
        balance={adjusting}
        onClose={() => setAdjusting(null)}
        onSave={handleAdjust}
      />
    </div>
  );
}