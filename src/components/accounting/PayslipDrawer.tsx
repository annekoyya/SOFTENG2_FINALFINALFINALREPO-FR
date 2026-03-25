import { useState } from "react";
import { X, Download, CheckCircle, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Payslip } from "@/hooks/useAccounting";
import { cn } from "@/lib/utils";

interface Props {
  payslip: Payslip | null;
  open: boolean;
  onClose: () => void;
  onAddAdjustment: (id: number, adjustment: { amount: number; description: string }) => Promise<void>;
  onApprove: (id: number) => Promise<void>;
  onMarkPaid: (id: number) => Promise<void>;
  onSendEmail: (id: number) => Promise<void>;
  onDownloadPdf: (id: number) => void;
}

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  computed: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export function PayslipDrawer({
  payslip,
  open,
  onClose,
  onAddAdjustment,
  onApprove,
  onMarkPaid,
  onSendEmail,
  onDownloadPdf,
}: Props) {
  const [activeTab, setActiveTab] = useState("details");
  const [isProcessing, setIsProcessing] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentDesc, setAdjustmentDesc] = useState("");
  const [showBonusForm, setShowBonusForm] = useState(false);
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusDesc, setBonusDesc] = useState("");

  if (!open || !payslip) return null;

  const handleAddAdjustment = async () => {
    if (!adjustmentAmount) return;
    setIsProcessing(true);
    try {
      await onAddAdjustment(payslip.id, {
        amount: parseFloat(adjustmentAmount),
        description: adjustmentDesc || "Manual adjustment",
      });
      setAdjustmentAmount("");
      setAdjustmentDesc("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(payslip.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkPaid = async () => {
    setIsProcessing(true);
    try {
      await onMarkPaid(payslip.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmail = async () => {
    setIsProcessing(true);
    try {
      await onSendEmail(payslip.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddBonus = async () => {
    if (!bonusAmount) return;
    setIsProcessing(true);
    try {
      await onAddAdjustment(payslip.id, {
        amount: parseFloat(bonusAmount),
        description: bonusDesc || "Bonus",
      });
      setBonusAmount("");
      setBonusDesc("");
      setShowBonusForm(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const earnings = [
    { label: "Basic Pay", amount: payslip.basic_pay },
    { label: "Overtime Pay", amount: payslip.overtime_pay },
    { label: "Transport Allowance", amount: payslip.transport_allowance },
    { label: "Meal Allowance", amount: payslip.meal_allowance },
    { label: "Other Allowances", amount: payslip.other_allowances },
    { label: "Bonuses", amount: payslip.bonuses },
    { label: "13th Month Pay", amount: payslip.thirteenth_month_pay },
  ].filter(e => e.amount > 0);

  const deductionItems = [
    { label: "Late Deduction", amount: payslip.late_deduction },
    { label: "Absent Deduction", amount: payslip.absent_deduction },
    { label: "Unpaid Leave Deduction", amount: payslip.unpaid_leave_deduction },
    { label: "SSS Employee", amount: payslip.sss_employee },
    { label: "PhilHealth Employee", amount: payslip.philhealth_employee },
    { label: "Pagibig Employee", amount: payslip.pagibig_employee },
    { label: "BIR Withholding Tax", amount: payslip.bir_withholding_tax },
    { label: "SSS Loan", amount: payslip.sss_loan_deduction },
    { label: "Pagibig Loan", amount: payslip.pagibig_loan_deduction },
    { label: "Company Loan", amount: payslip.company_loan_deduction },
    { label: "Other Deductions", amount: payslip.other_deductions },
  ].filter(d => d.amount > 0);

  return (
    <div className={cn("fixed inset-0 z-50 transition-all duration-300", open ? "bg-black/50" : "pointer-events-none bg-black/0")}>
      <div className={cn("fixed right-0 top-0 h-full w-full max-w-2xl border-l border-border bg-card shadow-lg transition-transform duration-300", open ? "translate-x-0" : "translate-x-full")}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Payslip Details</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {payslip.employee?.full_name} • {payslip.period?.label}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="w-full justify-start border-b border-border rounded-none bg-muted/30 px-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
              <TabsTrigger value="deductions">Deductions</TabsTrigger>
              <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge className={cn("text-xs capitalize border-0", statusStyles[payslip.status])}>
                      {payslip.status}
                    </Badge>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Department</p>
                    <p className="font-medium text-sm">{payslip.employee?.department}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Working Days</p>
                    <p className="font-medium text-sm">{payslip.days_worked}/{payslip.working_days_in_period}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Days Absent</p>
                    <p className="font-medium text-sm">{payslip.days_absent}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-sm mb-4">Earnings</p>
                  <div className="space-y-2">
                    {earnings.map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{e.label}</span>
                        <span className="font-medium text-green-700">
                          ₱{e.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center justify-between">
                    <p className="font-semibold text-sm">Gross Pay</p>
                    <p className="font-bold text-lg text-green-700">
                      ₱{payslip.gross_pay.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-sm mb-4">Employer Contributions</p>
                  <div className="space-y-2">
                    {[
                      { label: "SSS Employer", amount: payslip.sss_employer },
                      { label: "PhilHealth Employer", amount: payslip.philhealth_employer },
                      { label: "Pagibig Employer", amount: payslip.pagibig_employer },
                    ].filter(e => e.amount > 0).map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{e.label}</span>
                        <span className="font-medium">
                          ₱{e.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Bonuses Tab */}
            <TabsContent value="bonuses" className="p-6 space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="font-semibold text-sm mb-2">Current Bonuses</p>
                <p className="text-2xl font-bold text-green-700">
                  ₱{payslip.bonuses.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
              </div>

              {!showBonusForm ? (
                <Button onClick={() => setShowBonusForm(true)} className="w-full gap-2">
                  <DollarSign className="h-4 w-4" /> Add Bonus
                </Button>
              ) : (
                <div className="space-y-3 border border-border rounded-lg p-4 bg-muted/20">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Bonus Amount</label>
                    <Input
                      type="number"
                      value={bonusAmount}
                      onChange={e => setBonusAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                    <Input
                      value={bonusDesc}
                      onChange={e => setBonusDesc(e.target.value)}
                      placeholder="e.g. Performance bonus, attendance bonus"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddBonus} disabled={isProcessing || !bonusAmount} className="flex-1" size="sm">
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                    </Button>
                    <Button onClick={() => setShowBonusForm(false)} variant="outline" className="flex-1" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Deductions Tab */}
            <TabsContent value="deductions" className="p-6 space-y-4">
              <div className="space-y-3">
                {deductionItems.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <span className="text-sm">{d.label}</span>
                    <span className="font-medium text-red-600">
                      ₱{d.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center justify-between">
                <p className="font-semibold text-sm">Total Deductions</p>
                <p className="font-bold text-lg text-red-600">
                  ₱{payslip.total_deductions.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </TabsContent>

            {/* Adjustments Tab */}
            <TabsContent value="adjustments" className="p-6 space-y-4">
              <div className="border border-border rounded-lg p-4 bg-muted/20 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Adjustment Amount</label>
                  <Input
                    type="number"
                    value={adjustmentAmount}
                    onChange={e => setAdjustmentAmount(e.target.value)}
                    placeholder="0.00 (positive or negative)"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <Input
                    value={adjustmentDesc}
                    onChange={e => setAdjustmentDesc(e.target.value)}
                    placeholder="Reason for adjustment..."
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleAddAdjustment}
                  disabled={isProcessing || !adjustmentAmount}
                  className="w-full"
                  size="sm"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Submit Adjustment"}
                </Button>
              </div>

              {payslip.adjustments_note && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Previous Notes</p>
                  <p className="text-sm">{payslip.adjustments_note}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Net Pay</p>
              <p className="text-2xl font-bold text-foreground">
                ₱{payslip.net_pay.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onDownloadPdf(payslip.id)}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <Download className="h-4 w-4" /> PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {payslip.status !== "paid" && (
              <>
                {payslip.status !== "approved" && (
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    size="sm"
                    className="gap-1"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Approve
                  </Button>
                )}
                {payslip.status === "approved" && (
                  <Button
                    onClick={handleMarkPaid}
                    disabled={isProcessing}
                    size="sm"
                    className="gap-1"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                    Mark Paid
                  </Button>
                )}
              </>
            )}
            <Button
              onClick={handleSendEmail}
              disabled={isProcessing}
              variant="outline"
              size="sm"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Email"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}