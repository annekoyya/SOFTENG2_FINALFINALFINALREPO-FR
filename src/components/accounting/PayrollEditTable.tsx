import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Pencil,
  Check,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PayslipStatus = "draft" | "computed" | "approved" | "paid";

export interface PayslipRow {
  id: number;
  employee_id: number;
  employee_name: string;
  department: string;
  basic_salary: number;
  overtime_amount: number;
  total_allowances: number;
  total_deductions: number;
  net_pay: number;
  status: PayslipStatus;
  has_warnings?: boolean;
  warning_message?: string;
}

export interface PayslipEditPayload {
  payslip_id: number;
  overtime_amount: number;
  total_allowances: number;
  note?: string;
}

interface PayrollEditTableProps {
  payslips: PayslipRow[];
  isLoading: boolean;
  /** Admin/Accountant only — hides edit controls for other roles */
  canEdit: boolean;
  onSaveEdit: (payload: PayslipEditPayload) => Promise<void>;
  onRefresh: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatPHP(amount: number) {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function StatusBadge({ status }: { status: PayslipStatus }) {
  const map: Record<PayslipStatus, string> = {
    draft: "bg-gray-100 text-gray-600 border-gray-200",
    computed: "bg-blue-50 text-blue-700 border-blue-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paid: "bg-violet-50 text-violet-700 border-violet-200",
  };
  const labels: Record<PayslipStatus, string> = {
    draft: "Draft",
    computed: "Computed",
    approved: "Approved",
    paid: "Paid",
  };
  return (
    <Badge
      className={`${map[status]} border rounded-full text-xs font-medium px-2 py-0.5`}
    >
      {labels[status]}
    </Badge>
  );
}

// ─── Editable Row ─────────────────────────────────────────────────────────────

interface EditableRowProps {
  payslip: PayslipRow;
  canEdit: boolean;
  onSave: (payload: PayslipEditPayload) => Promise<void>;
  onRefresh: () => void;
}

function EditableRow({ payslip, canEdit, onSave, onRefresh }: EditableRowProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    overtime_amount: String(payslip.overtime_amount),
    total_allowances: String(payslip.total_allowances),
    note: "",
  });

  const isLocked =
    payslip.status === "approved" || payslip.status === "paid";

  const parseAmount = (v: string) => {
    const n = parseFloat(v.replace(/,/g, ""));
    return isNaN(n) || n < 0 ? 0 : n;
  };

  const previewNet =
    payslip.basic_salary +
    parseAmount(form.overtime_amount) +
    parseAmount(form.total_allowances) -
    payslip.total_deductions;

  const handleSave = async () => {
    if (!form.note.trim()) {
      toast({
        title: "Note required",
        description: "Please add a note describing this adjustment.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await onSave({
        payslip_id: payslip.id,
        overtime_amount: parseAmount(form.overtime_amount),
        total_allowances: parseAmount(form.total_allowances),
        note: form.note,
      });
      toast({
        title: "Payslip updated",
        description: "Changes logged in audit trail.",
      });
      setEditing(false);
      onRefresh();
    } catch {
      toast({ title: "Failed to save changes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      overtime_amount: String(payslip.overtime_amount),
      total_allowances: String(payslip.total_allowances),
      note: "",
    });
    setEditing(false);
  };

  if (!editing) {
    return (
      <TableRow className="hover:bg-muted/20 text-sm">
        <TableCell className="font-medium">
          <div className="flex items-center gap-1.5">
            {payslip.employee_name}
            {payslip.has_warnings && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-[200px]">
                    {payslip.warning_message ?? "Has payslip warnings"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {payslip.department}
          </span>
        </TableCell>
        <TableCell className="font-mono">{formatPHP(payslip.basic_salary)}</TableCell>
        <TableCell className="font-mono">{formatPHP(payslip.overtime_amount)}</TableCell>
        <TableCell className="font-mono">{formatPHP(payslip.total_allowances)}</TableCell>
        <TableCell className="font-mono text-red-600">
          −{formatPHP(payslip.total_deductions)}
        </TableCell>
        <TableCell className="font-mono font-semibold">
          {formatPHP(payslip.net_pay)}
        </TableCell>
        <TableCell>
          <StatusBadge status={payslip.status} />
        </TableCell>
        {canEdit && (
          <TableCell className="text-right">
            {isLocked ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-default">
                      Locked
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    Payslip is {payslip.status} — cannot edit
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => setEditing(true)}
              >
                <Pencil className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
            )}
          </TableCell>
        )}
      </TableRow>
    );
  }

  // ── Editing state ────────────────────────────────────────────────────────────
  return (
    <>
      <TableRow className="bg-blue-50/60 border-l-2 border-l-blue-400 text-sm">
        <TableCell className="font-medium">
          <div>{payslip.employee_name}</div>
          <span className="text-xs text-muted-foreground">
            {payslip.department}
          </span>
        </TableCell>

        {/* Basic salary — read-only */}
        <TableCell>
          <div className="flex flex-col">
            <span className="font-mono text-muted-foreground text-xs">Basic</span>
            <span className="font-mono font-medium">
              {formatPHP(payslip.basic_salary)}
            </span>
          </div>
        </TableCell>

        {/* Overtime — editable */}
        <TableCell>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Overtime</span>
            <Input
              className="h-8 w-32 font-mono text-sm"
              value={form.overtime_amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, overtime_amount: e.target.value }))
              }
            />
          </div>
        </TableCell>

        {/* Allowances — editable */}
        <TableCell>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Allowances</span>
            <Input
              className="h-8 w-32 font-mono text-sm"
              value={form.total_allowances}
              onChange={(e) =>
                setForm((f) => ({ ...f, total_allowances: e.target.value }))
              }
            />
          </div>
        </TableCell>

        {/* Deductions — read-only */}
        <TableCell className="font-mono text-red-600">
          −{formatPHP(payslip.total_deductions)}
        </TableCell>

        {/* Net pay preview */}
        <TableCell>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Preview</span>
            <span
              className={`font-mono font-semibold text-sm ${
                previewNet < 0 ? "text-red-600" : "text-emerald-700"
              }`}
            >
              {formatPHP(previewNet)}
            </span>
          </div>
        </TableCell>

        <TableCell>
          <StatusBadge status={payslip.status} />
        </TableCell>

        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              disabled={saving}
              onClick={handleSave}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              disabled={saving}
              onClick={handleCancel}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Note row */}
      <TableRow className="bg-blue-50/30 border-l-2 border-l-blue-400 border-b border-b-blue-100">
        <TableCell colSpan={8} className="py-2 px-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-blue-700 whitespace-nowrap">
              Reason for adjustment *
            </span>
            <Input
              className="h-7 text-xs max-w-sm"
              placeholder="e.g. Extra overtime approved by manager on March 15…"
              value={form.note}
              onChange={(e) =>
                setForm((f) => ({ ...f, note: e.target.value }))
              }
            />
            <span className="text-xs text-muted-foreground">
              This will be logged in the audit trail.
            </span>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
}

// ─── Sort control ─────────────────────────────────────────────────────────────

type SortKey = "employee_name" | "net_pay" | "department" | "status";

function useSortedPayslips(payslips: PayslipRow[]) {
  const [sortKey, setSortKey] = useState<SortKey>("employee_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggle = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...payslips].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "employee_name") {
      cmp = a.employee_name.localeCompare(b.employee_name);
    } else if (sortKey === "net_pay") {
      cmp = a.net_pay - b.net_pay;
    } else if (sortKey === "department") {
      cmp = a.department.localeCompare(b.department);
    } else if (sortKey === "status") {
      cmp = a.status.localeCompare(b.status);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  return { sorted, sortKey, sortDir, toggle };
}

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
}) {
  if (sortKey !== col)
    return <ChevronDown className="w-3 h-3 opacity-20 inline ml-1" />;
  return sortDir === "asc" ? (
    <ChevronUp className="w-3 h-3 inline ml-1" />
  ) : (
    <ChevronDown className="w-3 h-3 inline ml-1" />
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PayrollEditTable({
  payslips,
  isLoading,
  canEdit,
  onSaveEdit,
  onRefresh,
}: PayrollEditTableProps) {
  const { sorted, sortKey, sortDir, toggle } = useSortedPayslips(payslips);

  const totalNet = payslips.reduce((s, p) => s + p.net_pay, 0);
  const totalGross = payslips.reduce(
    (s, p) => s + p.basic_salary + p.overtime_amount + p.total_allowances,
    0
  );
  const warningCount = payslips.filter((p) => p.has_warnings).length;

  const colClass =
    "text-xs text-muted-foreground font-medium cursor-pointer select-none hover:text-foreground transition-colors";

  return (
    <div className="space-y-3">
      {/* Summary row */}
      <div className="flex flex-wrap gap-4 px-4 py-2.5 bg-muted/40 rounded-lg border text-sm">
        <div>
          <span className="text-muted-foreground text-xs">Employees</span>
          <p className="font-semibold">{payslips.length}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Total gross</span>
          <p className="font-semibold font-mono">{formatPHP(totalGross)}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Total net pay</span>
          <p className="font-semibold font-mono text-emerald-700">
            {formatPHP(totalNet)}
          </p>
        </div>
        {warningCount > 0 && (
          <div className="ml-auto flex items-center gap-1.5 text-amber-600 font-medium text-xs self-center">
            <AlertCircle className="w-3.5 h-3.5" />
            {warningCount} payslip{warningCount > 1 ? "s" : ""} with warnings
          </div>
        )}
      </div>

      {canEdit && (
        <p className="text-xs text-muted-foreground px-1">
          You can edit <strong>overtime</strong> and <strong>allowances</strong>{" "}
          per payslip. Changes require a note and are logged in the audit trail.
          Approved and paid payslips are locked.
        </p>
      )}

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead
                className={colClass}
                onClick={() => toggle("employee_name")}
              >
                Employee
                <SortIcon col="employee_name" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                Basic salary
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                Overtime
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                Allowances
              </TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">
                Deductions
              </TableHead>
              <TableHead
                className={colClass}
                onClick={() => toggle("net_pay")}
              >
                Net pay
                <SortIcon col="net_pay" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              <TableHead
                className={colClass}
                onClick={() => toggle("status")}
              >
                Status
                <SortIcon col="status" sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
              {canEdit && (
                <TableHead className="text-xs text-muted-foreground font-medium text-right w-20">
                  Edit
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 8 : 7}
                  className="text-center py-10 text-sm text-muted-foreground"
                >
                  Loading payslips…
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 8 : 7}
                  className="text-center py-10 text-sm text-muted-foreground"
                >
                  No payslips for this period. Click "Compute All" to generate
                  them.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((p) => (
                <EditableRow
                  key={p.id}
                  payslip={p}
                  canEdit={canEdit}
                  onSave={onSaveEdit}
                  onRefresh={onRefresh}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}