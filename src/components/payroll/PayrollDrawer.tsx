import { Payroll } from "@/types/payroll";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, X, FileText } from "lucide-react";

interface PayrollDrawerProps {
  open: boolean;
  payroll: Payroll | null;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onProcess?: () => void;
  onMarkPaid?: () => void;
  onGeneratePayslip?: () => void;
  isLoading?: boolean;
}

const statusStyles = {
  draft: "bg-gray-100 text-gray-800",
  pending_approval: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  processed: "bg-purple-100 text-purple-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const statusLabels = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  processed: "Processed",
  paid: "Paid",
  failed: "Failed",
};

export function PayrollDrawer({
  open,
  payroll,
  onClose,
  onApprove,
  onReject,
  onProcess,
  onMarkPaid,
  onGeneratePayslip,
  isLoading = false,
}: PayrollDrawerProps) {
  if (!payroll) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const breakdown = payroll.calculation_breakdown;

  // Helper function to safely get amount
  const getAmount = (item: any) => item??.amount ?? 0 || 0;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Payroll Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Employee & Period Info */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Employee</p>
              <p className="font-semibold">
                {payroll.employee?.first_name} {payroll.employee?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {payroll.employee?.email}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Pay Period</p>
                <p className="font-semibold">
                  {formatDate(payroll.pay_period_start)} to{" "}
                  {formatDate(payroll.pay_period_end)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  className={cn(
                    "mt-1",
                    statusStyles[payroll.status as keyof typeof statusStyles]
                  )}
                >
                  {statusLabels[payroll.status as keyof typeof statusLabels]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Earnings Breakdown */}
          {breakdown?.earnings && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Earnings</h3>
              <div className="space-y-2">
                {getAmount(breakdown?.earnings?.base_salary) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {breakdown?.earnings?.base_salary?.label || "Base Salary"}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(getAmount(breakdown?.earnings?.base_salary))}
                    </span>
                  </div>
                )}
                {getAmount(breakdown?.earnings?.overtime_pay) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {breakdown?.earnings?.overtime_pay?.label || "Overtime Pay"}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(getAmount(breakdown?.earnings?.overtime_pay))}
                    </span>
                  </div>
                )}
                {getAmount(breakdown?.earnings?.bonuses) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {breakdown?.earnings?.bonuses?.label || "Bonuses"}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(getAmount(breakdown?.earnings?.bonuses))}
                    </span>
                  </div>
                )}
                {getAmount(breakdown?.earnings?.allowances) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {breakdown?.earnings?.allowances?.label || "Allowances"}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(getAmount(breakdown?.earnings?.allowances))}
                    </span>
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Gross Salary</span>
                  <span className="text-success">{formatCurrency(payroll.gross_salary)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Deductions Breakdown */}
          {breakdown?.deductions && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Deductions</h3>
              <div className="space-y-2">
                {getAmount(breakdown?.deductions?.sss_contribution) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {breakdown?.deductions?.sss_contribution?.label || "SSS Contribution"}
                    </span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(getAmount(breakdown?.deductions?.sss_contribution))}
                    </span>
                  </div>
                )}
                {getAmount(breakdown?.deductions?.philhealth_contribution) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {breakdown?.deductions?.philhealth_contribution?.label || "PhilHealth"}
                    </span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(getAmount(breakdown?.deductions?.philhealth_contribution))}
                    </span>
                  </div>
                )}
                {getAmount(breakdown?.deductions?.pagibig_contribution) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {breakdown?.deductions?.pagibig_contribution?.label || "Pag-IBIG"}
                    </span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(getAmount(breakdown?.deductions?.pagibig_contribution))}
                    </span>
                  </div>
                )}
                {getAmount(breakdown?.deductions?.tax_withholding) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {breakdown?.deductions?.tax_withholding?.label || "Withholding Tax"}
                    </span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(getAmount(breakdown?.deductions?.tax_withholding))}
                    </span>
                  </div>
                )}
                {getAmount(breakdown?.deductions?.other_deductions) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {breakdown?.deductions?.other_deductions?.label || "Other Deductions"}
                    </span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(getAmount(breakdown?.deductions?.other_deductions))}
                    </span>
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Deductions</span>
                  <span className="text-destructive">
                    -{formatCurrency(payroll.total_deductions)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Net Salary Summary */}
          <div className="rounded-lg bg-success/10 border border-success/20 p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-foreground">
                Net Salary
              </span>
              <span className="text-2xl font-bold text-success">
                {formatCurrency(payroll.net_salary)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {payroll.notes && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm bg-muted p-3 rounded-lg">{payroll.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-border pt-6 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {payroll.status === "draft" && onApprove && (
                <Button
                  onClick={onApprove}
                  className="bg-blue-600 hover:bg-blue-700 text-white col-span-2"
                  disabled={isLoading}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Submit for Approval
                </Button>
              )}

              {payroll.status === "pending_approval" && onApprove && (
                <Button
                  onClick={onApprove}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isLoading}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              )}

              {payroll.status === "pending_approval" && onReject && (
                <Button
                  onClick={onReject}
                  variant="destructive"
                  disabled={isLoading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              )}

              {payroll.status === "approved" && onProcess && (
                <Button
                  onClick={onProcess}
                  className="col-span-2"
                  disabled={isLoading}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Process Payroll
                </Button>
              )}

              {payroll.status === "processed" && onMarkPaid && (
                <Button
                  onClick={onMarkPaid}
                  className="col-span-2 bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
              )}
            </div>

            {onGeneratePayslip && (
              <Button
                onClick={onGeneratePayslip}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate Payslip PDF
              </Button>
            )}

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}