import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import {
  OT_TYPE_LABELS, OT_MULTIPLIERS,
  type OvertimeRequest, type OvertimeStatus, type OvertimeType,
} from "@/types/overtime";

// ── helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OvertimeStatus }) {
  const map: Record<OvertimeStatus, string> = {
    pending:  "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-600 border-red-200",
    paid:     "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <Badge className={`${map[status]} border rounded-full text-xs font-medium px-2 py-0.5 capitalize`}>
      {status}
    </Badge>
  );
}

function formatPHP(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

// ── approve dialog (lets manager adjust hours before approving) ───────────────

function ApproveDialog({
  request, open, onClose, onApprove,
}: {
  request: OvertimeRequest;
  open: boolean;
  onClose: () => void;
  onApprove: (id: number, hours: number) => Promise<void>;
}) {
  const { toast } = useToast();
  const [hours, setHours] = useState(String(request.hours_requested));
  const [loading, setLoading] = useState(false);

  const parsed = parseFloat(hours) || 0;
  const mult   = OT_MULTIPLIERS[request.overtime_type];
  const amount = request.computed_amount
    ? (parsed / request.hours_requested) * request.computed_amount
    : null;

  const handleApprove = async () => {
    if (parsed <= 0 || parsed > 12) {
      toast({ title: "Hours must be between 0.5 and 12.", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await onApprove(request.id, parsed);
      onClose();
    } catch {
      toast({ title: "Failed to approve.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Approve overtime — {request.employee_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 text-sm">
          <div className="rounded-lg bg-muted/40 p-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{new Date(request.date).toLocaleDateString("en-PH", { dateStyle: "medium" })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{OT_TYPE_LABELS[request.overtime_type]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested</span>
              <span className="font-medium">{request.hours_requested} hrs</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Hours to approve
              <span className="text-xs text-muted-foreground ml-1">(can be less than requested)</span>
            </label>
            <div className="flex items-center gap-2">
              <Input type="number" min="0.5" max="12" step="0.5"
                value={hours} onChange={(e) => setHours(e.target.value)}
                className="w-24" />
              {amount && (
                <span className="text-sm text-emerald-600 font-medium">{formatPHP(amount)}</span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Multiplier: {mult}× — approved hours will be included in the next payslip compute.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleApprove} disabled={loading}>
            {loading ? "Approving…" : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── reject dialog ─────────────────────────────────────────────────────────────

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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Reject overtime request</DialogTitle></DialogHeader>
        <div className="space-y-2 py-2">
          <label className="text-sm font-medium">Reason</label>
          <Input placeholder="e.g. Not pre-approved, no business need…"
            value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" disabled={loading} onClick={async () => {
            if (!reason.trim()) {
              toast({ title: "Reason required.", variant: "destructive" }); return;
            }
            setLoading(true);
            try { await onReject(reason); onClose(); }
            catch { toast({ title: "Failed.", variant: "destructive" }); }
            finally { setLoading(false); }
          }}>
            {loading ? "Rejecting…" : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── main component ────────────────────────────────────────────────────────────

type FilterStatus = OvertimeStatus | "all";
type FilterType   = OvertimeType   | "all";

interface OvertimeTableProps {
  requests: OvertimeRequest[];
  isLoading: boolean;
  canManage: boolean;
  onApprove: (id: number, hours: number) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
  onRefresh: () => void;
}

export default function OvertimeTable({
  requests, isLoading, canManage, onApprove, onReject, onRefresh,
}: OvertimeTableProps) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter,   setTypeFilter]   = useState<FilterType>("all");
  const [approving, setApproving] = useState<OvertimeRequest | null>(null);
  const [rejectingId, setRejectingId]  = useState<number | null>(null);

  const filtered = requests.filter((r) =>
    (statusFilter === "all" || r.status === statusFilter) &&
    (typeFilter   === "all" || r.overtime_type === typeFilter)
  );

  const pendingCount  = requests.filter((r) => r.status === "pending").length;
  const approvedHours = requests
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + (r.hours_approved ?? r.hours_requested), 0);

  const handleApprove = async (id: number, hours: number) => {
    try {
      await onApprove(id, hours);
      toast({ title: "Overtime approved. Will be included in next payslip." });
      onRefresh();
    } catch { toast({ title: "Failed.", variant: "destructive" }); }
  };

  const handleReject = async (id: number, reason: string) => {
    try {
      await onReject(id, reason);
      toast({ title: "Overtime request rejected." });
      onRefresh();
    } catch { toast({ title: "Failed.", variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 px-4 py-2.5 bg-muted/40 rounded-lg border text-sm items-center">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Approved this month:</span>
          <span className="font-semibold">{approvedHours.toFixed(1)} hrs</span>
        </div>
        {pendingCount > 0 && (
          <div className="ml-auto flex items-center gap-1.5 text-amber-600 font-medium text-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            {pendingCount} pending approval
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 bg-muted/50 p-1 rounded-lg">
          {(["all","pending","approved","rejected","paid"] as FilterStatus[]).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                statusFilter === s ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>{s}</button>
          ))}
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as FilterType)}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.entries(OT_TYPE_LABELS) as [OvertimeType, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {canManage && <TableHead className="text-xs text-muted-foreground font-medium">Employee</TableHead>}
              <TableHead className="text-xs text-muted-foreground font-medium">Date</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Type</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-center">Req. hrs</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-center">Appr. hrs</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-right">Est. pay</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Reason</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
              {canManage && <TableHead className="text-xs text-muted-foreground font-medium text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={canManage ? 9 : 7} className="text-center py-10 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={canManage ? 9 : 7} className="text-center py-10 text-sm text-muted-foreground">No overtime requests found.</TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id} className="text-sm hover:bg-muted/20">
                {canManage && (
                  <TableCell className="font-medium">
                    {r.employee_name}
                    {r.department && <span className="block text-xs text-muted-foreground">{r.department}</span>}
                  </TableCell>
                )}
                <TableCell className="text-xs">
                  {new Date(r.date).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                </TableCell>
                <TableCell className="text-xs">{OT_TYPE_LABELS[r.overtime_type]}</TableCell>
                <TableCell className="text-center font-mono">{r.hours_requested}</TableCell>
                <TableCell className="text-center font-mono">
                  {r.hours_approved != null ? (
                    <span className={r.hours_approved < r.hours_requested ? "text-amber-600" : ""}>
                      {r.hours_approved}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {r.computed_amount ? formatPHP(r.computed_amount) : "—"}
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">
                  {r.reason}
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                  {r.rejected_reason && (
                    <p className="text-[10px] text-red-500 mt-0.5 max-w-[120px] truncate">{r.rejected_reason}</p>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    {r.status === "pending" ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost"
                          className="h-7 px-2 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => setApproving(r)}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="ghost"
                          className="h-7 px-2 text-red-500 hover:bg-red-50"
                          onClick={() => setRejectingId(r.id)}>
                          <XCircle className="w-3.5 h-3.5 mr-1" />Reject
                        </Button>
                      </div>
                    ) : r.status === "approved" ? (
                      <span className="text-xs text-muted-foreground">
                        {r.approved_by_name ? `By ${r.approved_by_name}` : "Approved"}
                      </span>
                    ) : r.status === "paid" ? (
                      <span className="text-xs text-violet-600">In payslip</span>
                    ) : null}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {approving && (
        <ApproveDialog request={approving} open={!!approving}
          onClose={() => setApproving(null)}
          onApprove={handleApprove} />
      )}
      {rejectingId !== null && (
        <RejectDialog open={true}
          onClose={() => setRejectingId(null)}
          onReject={(reason) => handleReject(rejectingId, reason)} />
      )}
    </div>
  );
}