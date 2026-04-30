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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Calendar, AlertCircle } from "lucide-react";
import type { LeaveRequest, LeaveStatus, LeaveType } from "@/types/leave";
import { LEAVE_LABEL, LEAVE_POLICIES } from "@/types/leave";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeaveStatus }) {
  const map: Record<LeaveStatus, string> = {
    pending:   "bg-amber-50 text-amber-700 border-amber-200",
    approved:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected:  "bg-red-50 text-red-600 border-red-200",
    cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <Badge className={`${map[status]} border rounded-full text-xs font-medium px-2 py-0.5 capitalize`}>
      {status}
    </Badge>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-PH", { 
    month: "short", 
    day: "numeric", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Helper to safely get approval date from various possible field names
function getApprovalDate(req: LeaveRequest): string | null {
  return (req as any).approved_at || 
         (req as any).approval_date || 
         (req as any).processed_at || 
         (req as any).approved_on ||
         null;
}

// ── Reject dialog ─────────────────────────────────────────────────────────────

function RejectDialog({
  open, onClose, onReject,
}: {
  open: boolean;
  onClose: () => void;
  onReject: (reason: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) {
      toast({ title: "Please provide a reason.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await onReject(reason);
      setReason("");
      onClose();
    } catch {
      toast({ title: "Failed to reject.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Reject leave request</DialogTitle></DialogHeader>
        <div className="space-y-2 py-2">
          <label className="text-sm font-medium">Reason for rejection</label>
          <Input
            placeholder="e.g. Insufficient leave balance, peak season…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={handleReject} disabled={loading}>
            {loading ? "Rejecting…" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface LeaveRequestsTableProps {
  requests: LeaveRequest[];
  isLoading: boolean;
  canManage: boolean;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
  onCancel: (id: number) => Promise<void>;
  onRefresh: () => void;
  currentEmployeeId?: number;
}

type FilterStatus = LeaveStatus | "all";
type FilterType   = LeaveType   | "all";

export default function LeaveRequestsTable({
  requests, isLoading, canManage,
  onApprove, onReject, onCancel, onRefresh, currentEmployeeId,
}: LeaveRequestsTableProps) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter,   setTypeFilter]   = useState<FilterType>("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectingId,   setRejectingId]   = useState<number | null>(null);

  const filtered = requests.filter((r) =>
    (statusFilter === "all" || r.status === statusFilter) &&
    (typeFilter   === "all" || r.leave_type === typeFilter)
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await onApprove(id);
      toast({ title: "Leave approved." });
      onRefresh();
    } catch { toast({ title: "Failed to approve.", variant: "destructive" }); }
    finally { setActionLoading(null); }
  };

  const handleCancel = async (id: number) => {
    setActionLoading(id);
    try {
      await onCancel(id);
      toast({ title: "Request cancelled." });
      onRefresh();
    } catch { toast({ title: "Failed to cancel.", variant: "destructive" }); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-4">
      {/* Pending banner */}
      {canManage && pendingCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{pendingCount} leave request{pendingCount > 1 ? "s" : ""} awaiting approval</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 bg-muted/50 p-1 rounded-lg">
          {(["all", "pending", "approved", "rejected", "cancelled"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                statusFilter === s
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as FilterType)}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {LEAVE_POLICIES.map((p) => (
              <SelectItem key={p.leave_type} value={p.leave_type}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {canManage && (
                <TableHead className="text-xs text-muted-foreground font-medium">Employee</TableHead>
              )}
              <TableHead className="text-xs text-muted-foreground font-medium">Type</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Dates</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-center">Days</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Reason</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="text-center py-10 text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="text-center py-10 text-sm text-muted-foreground">
                  No leave requests found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((req) => {
                const isOwn = req.employee_id === currentEmployeeId;
                const requiresProof = LEAVE_POLICIES.find(
                  (p) => p.leave_type === req.leave_type
                )?.requires_proof;
                const approvalDate = getApprovalDate(req);

                return (
                  <TableRow
                    key={req.id}
                    className={`text-sm hover:bg-muted/20 ${isOwn && canManage ? "bg-blue-50/30" : ""}`}
                  >
                    {canManage && (
                      <TableCell className="font-medium">
                        {req.employee_name}
                        {req.department && (
                          <span className="text-xs text-muted-foreground block">{req.department}</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span>{LEAVE_LABEL[req.leave_type]}</span>
                        {requiresProof && req.days_requested > 3 && (
                          <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-1">
                            proof req.
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {formatDate(req.start_date)}
                        {req.start_date !== req.end_date && (
                          <> → {formatDate(req.end_date)}</>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {req.days_requested}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-muted-foreground text-xs">
                      {req.reason}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={req.status} />
                      {req.rejected_reason && (
                        <p className="text-[10px] text-red-500 mt-0.5 max-w-[120px] truncate">
                          {req.rejected_reason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === "pending" && canManage && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 px-2 text-emerald-600 hover:bg-emerald-50"
                            disabled={actionLoading === req.id}
                            onClick={() => handleApprove(req.id)}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 px-2 text-red-500 hover:bg-red-50"
                            disabled={actionLoading === req.id}
                            onClick={() => setRejectingId(req.id)}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {req.status === "pending" && isOwn && !canManage && (
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 px-2 text-muted-foreground"
                          disabled={actionLoading === req.id}
                          onClick={() => handleCancel(req.id)}
                        >
                          Cancel
                        </Button>
                      )}
                      {req.status === "approved" && (
                        <span className="text-xs text-muted-foreground">
                          {approvalDate ? formatDateTime(approvalDate) : "Approved"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {rejectingId !== null && (
        <RejectDialog
          open={true}
          onClose={() => setRejectingId(null)}
          onReject={async (reason) => {
            await onReject(rejectingId, reason);
            toast({ title: "Leave request rejected." });
            onRefresh();
            setRejectingId(null);
          }}
        />
      )}
    </div>
  );
}