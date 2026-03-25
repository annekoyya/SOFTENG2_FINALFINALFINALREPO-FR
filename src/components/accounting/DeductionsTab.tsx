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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Plus, Shield, Trash2, Info } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type RequiredId =
  | "sss_number"
  | "philhealth_number"
  | "pagibig_number"
  | "tin_number"
  | "none";

export interface DeductionCategory {
  id: number;
  name: string;
  /** Which government ID must be present for this deduction to apply */
  required_id: RequiredId;
  /** If true, a missing ID raises a warning; if false, deduction is skipped silently */
  is_mandatory: boolean;
  /** Fixed amount. null means it's table-based (SSS/PhilHealth/PagIBIG) */
  fixed_amount?: number | null;
  description?: string;
  is_system: boolean; // system = gov-mandated, cannot delete
}

export interface EmployeeDeductionWarning {
  employee_id: number;
  employee_name: string;
  missing_ids: RequiredId[];
  skipped_deductions: string[];
}

interface DeductionsTabProps {
  categories: DeductionCategory[];
  warnings: EmployeeDeductionWarning[];
  isLoading: boolean;
  canManage: boolean;
  onAdd: (data: {
    name: string;
    required_id: RequiredId;
    is_mandatory: boolean;
    fixed_amount?: number;
    description?: string;
  }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onRefresh: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const REQUIRED_ID_OPTIONS: { label: string; value: RequiredId }[] = [
  { label: "None required", value: "none" },
  { label: "SSS number", value: "sss_number" },
  { label: "PhilHealth ID", value: "philhealth_number" },
  { label: "Pag-IBIG MID", value: "pagibig_number" },
  { label: "TIN", value: "tin_number" },
];

const ID_LABELS: Record<RequiredId, string> = {
  sss_number: "SSS",
  philhealth_number: "PhilHealth",
  pagibig_number: "Pag-IBIG",
  tin_number: "TIN",
  none: "—",
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatPHP(amount: number) {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function RequiredIdBadge({ id }: { id: RequiredId }) {
  if (id === "none") return <span className="text-muted-foreground text-xs">—</span>;
  const colorMap: Record<RequiredId, string> = {
    sss_number: "bg-blue-50 text-blue-700 border-blue-200",
    philhealth_number: "bg-green-50 text-green-700 border-green-200",
    pagibig_number: "bg-violet-50 text-violet-700 border-violet-200",
    tin_number: "bg-orange-50 text-orange-700 border-orange-200",
    none: "",
  };
  return (
    <Badge
      className={`${colorMap[id]} border rounded-full text-xs font-medium px-2 py-0.5`}
    >
      {ID_LABELS[id]}
    </Badge>
  );
}

// ─── Add Category Dialog ──────────────────────────────────────────────────────

interface AddCategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: DeductionsTabProps["onAdd"];
}

function AddCategoryDialog({ open, onClose, onAdd }: AddCategoryDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    required_id: "none" as RequiredId,
    is_mandatory: true,
    fixed_amount: "",
    description: "",
  });

  const reset = () =>
    setForm({
      name: "",
      required_id: "none",
      is_mandatory: true,
      fixed_amount: "",
      description: "",
    });

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({
        title: "Name required",
        variant: "destructive",
      });
      return;
    }
    let fixed: number | undefined;
    if (form.fixed_amount) {
      fixed = parseFloat(form.fixed_amount.replace(/,/g, ""));
      if (isNaN(fixed) || fixed < 0) {
        toast({ title: "Invalid amount", variant: "destructive" });
        return;
      }
    }
    setLoading(true);
    try {
      await onAdd({
        name: form.name.trim(),
        required_id: form.required_id,
        is_mandatory: form.is_mandatory,
        fixed_amount: fixed,
        description: form.description || undefined,
      });
      toast({ title: "Deduction category added" });
      reset();
      onClose();
    } catch {
      toast({ title: "Failed to add category", variant: "destructive" });
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
          <DialogTitle>Add deduction category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category name</label>
            <Input
              placeholder="e.g. Uniform loan, Cash advance…"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              Required government ID
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px] text-xs">
                    If the employee is missing this ID, the deduction will be
                    skipped and a warning shown on their payslip.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </label>
            <Select
              value={form.required_id}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, required_id: v as RequiredId }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUIRED_ID_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Fixed amount (₱){" "}
              <span className="text-xs opacity-60">
                — leave blank if table-based
              </span>
            </label>
            <Input
              placeholder="e.g. 500"
              value={form.fixed_amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, fixed_amount: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Mandatory?
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="mandatory"
                  checked={form.is_mandatory}
                  onChange={() =>
                    setForm((f) => ({ ...f, is_mandatory: true }))
                  }
                />
                Yes — warn if missing ID
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="mandatory"
                  checked={!form.is_mandatory}
                  onChange={() =>
                    setForm((f) => ({ ...f, is_mandatory: false }))
                  }
                />
                No — always deduct
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Description{" "}
              <span className="text-xs opacity-60">(optional)</span>
            </label>
            <Input
              placeholder="Internal notes…"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding…" : "Add category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function DeductionsTab({
  categories,
  warnings,
  isLoading,
  canManage,
  onAdd,
  onDelete,
  onRefresh,
}: DeductionsTabProps) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDelete(id);
      toast({ title: "Category removed" });
      onRefresh();
    } catch {
      toast({ title: "Failed to remove category", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning panel — employees with missing gov IDs */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
            <AlertTriangle className="w-4 h-4" />
            {warnings.length} employee{warnings.length > 1 ? "s" : ""} have
            missing government IDs — some deductions were skipped
          </div>
          <div className="space-y-2">
            {warnings.map((w) => (
              <div
                key={w.employee_id}
                className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs text-amber-800"
              >
                <span className="font-medium min-w-[160px]">
                  {w.employee_name}
                </span>
                <span className="text-amber-600">
                  Missing:{" "}
                  {w.missing_ids.map((id) => ID_LABELS[id]).join(", ")} →
                  Skipped: {w.skipped_deductions.join(", ")}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-600">
            Complete government IDs in each employee's profile to resolve
            these warnings.
          </p>
        </div>
      )}

      {/* Categories table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Deduction categories</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Deductions with a required ID are skipped (with a warning) if the
              employee's profile is missing that ID.
            </p>
          </div>
          {canManage && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add category
            </Button>
          )}
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs text-muted-foreground font-medium">
                  Category
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">
                  Required ID
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">
                  Mandatory
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">
                  Fixed amount
                </TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">
                  Missing ID action
                </TableHead>
                {canManage && (
                  <TableHead className="w-10" />
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
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 6 : 5}
                    className="text-center py-10 text-sm text-muted-foreground"
                  >
                    No categories configured.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow
                    key={cat.id}
                    className="hover:bg-muted/20 text-sm"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {cat.is_system && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">
                                Government-mandated — cannot be removed
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cat.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <RequiredIdBadge id={cat.required_id} />
                    </TableCell>
                    <TableCell>
                      {cat.is_mandatory ? (
                        <span className="text-xs font-medium text-emerald-700">
                          Yes
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {cat.fixed_amount != null
                        ? formatPHP(cat.fixed_amount)
                        : (
                          <span className="text-muted-foreground text-xs">
                            Table-based
                          </span>
                        )}
                    </TableCell>
                    <TableCell>
                      {cat.required_id === "none" ? (
                        <span className="text-xs text-muted-foreground">
                          Always deduct
                        </span>
                      ) : cat.is_mandatory ? (
                        <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Skip + warn
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Skip silently
                        </span>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        {!cat.is_system && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                            disabled={deletingId === cat.id}
                            onClick={() => handleDelete(cat.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddCategoryDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={async (data) => {
          await onAdd(data);
          onRefresh();
        }}
      />
    </div>
  );
}