// src/pages/Accounting.tsx
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Plus,
  Play,
  Mail,
  Download,
  CalendarDays,
  Eye,
  CheckCircle,
  FileText,
  Printer,
  FileSpreadsheet,
  FileJson,
  File,
  Loader2,
} from "lucide-react";
import { usePayslip, type Payslip, type PayrollPeriod, type PayslipSummary, type AuditLog } from "@/hooks/usePayslip";

const statusStyles: Record<string, string> = {
  open: "bg-gray-100 text-gray-700",
  processing: "bg-blue-100 text-blue-700",
  computed: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-700",
};

const payslipStatusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  computed: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

// ─── Payslip Table Component ─────────────────────────────────────────────────

function PayslipTable({ payslips, isLoading, onView }: { 
  payslips: Payslip[]; 
  isLoading: boolean; 
  onView: (id: number) => void;
}) {
  const getStatusBadge = (status: string) => {
    const styles = payslipStatusStyles[status] || "bg-gray-100 text-gray-700";
    return <Badge className={styles}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
        <p className="text-gray-500 mt-2">Loading payslips...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold">Employee</TableHead>
            <TableHead className="font-semibold">Department</TableHead>
            <TableHead className="font-semibold">Position</TableHead>
            <TableHead className="font-semibold text-right">Gross Pay</TableHead>
            <TableHead className="font-semibold text-right">Net Pay</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="font-semibold text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payslips.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No payslips found. Click "Compute All" to generate.
              </TableCell>
            </TableRow>
          ) : (
            payslips.map((payslip) => (
              <TableRow key={payslip.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  {payslip.employee?.first_name} {payslip.employee?.last_name}
                </TableCell>
                <TableCell>{payslip.employee?.department || "—"}</TableCell>
                <TableCell>{payslip.employee?.job_category || "—"}</TableCell>
                <TableCell className="text-right">₱{payslip.gross_pay.toLocaleString()}</TableCell>
                <TableCell className="text-right">₱{payslip.net_pay.toLocaleString()}</TableCell>
                <TableCell className="text-center">{getStatusBadge(payslip.status)}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => onView(payslip.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Payslip Drawer Component ────────────────────────────────────────────────

function PayslipDrawer({ payslip, open, onClose }: { payslip: Payslip | null; open: boolean; onClose: () => void }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!payslip) return null;

  // Build earnings array from payslip data
  const earnings = [
    { name: "Basic Pay", amount: payslip.basic_pay },
    { name: "Overtime Pay", amount: payslip.overtime_pay },
    { name: "Transport Allowance", amount: payslip.transport_allowance },
    { name: "Meal Allowance", amount: payslip.meal_allowance },
    { name: "Other Allowances", amount: payslip.other_allowances },
    { name: "Bonuses", amount: payslip.bonuses },
    { name: "13th Month Pay", amount: payslip.thirteenth_month_pay },
  ].filter(e => e.amount > 0);

  const deductions = [
    { name: "Late Deduction", amount: payslip.late_deduction },
    { name: "Absent Deduction", amount: payslip.absent_deduction },
    { name: "Unpaid Leave", amount: payslip.unpaid_leave_deduction },
    { name: "SSS Contribution", amount: payslip.sss_employee },
    { name: "PhilHealth", amount: payslip.philhealth_employee },
    { name: "Pag-IBIG", amount: payslip.pagibig_employee },
    { name: "Withholding Tax", amount: payslip.bir_withholding_tax },
    { name: "SSS Loan", amount: payslip.sss_loan_deduction },
    { name: "Pag-IBIG Loan", amount: payslip.pagibig_loan_deduction },
    { name: "Company Loan", amount: payslip.company_loan_deduction },
    { name: "Other Deductions", amount: payslip.other_deductions },
  ].filter(d => d.amount > 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Payslip Details</SheetTitle>
          <SheetDescription>
            {payslip.employee?.first_name} {payslip.employee?.last_name} - {payslip.period?.label}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Employee Info */}
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Employee Name</p>
                <p className="font-medium">{payslip.employee?.first_name} {payslip.employee?.last_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="font-medium">{payslip.employee?.department || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Position</p>
                <p className="font-medium">{payslip.employee?.job_category || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pay Period</p>
                <p className="font-medium">{payslip.period?.label || "—"}</p>
              </div>
            </div>
          </div>

          {/* Earnings */}
          {earnings.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Earnings</h3>
              <div className="space-y-2">
                {earnings.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Gross Pay</span>
                    <span className="text-green-600">{formatCurrency(payslip.gross_pay)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deductions */}
          {deductions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Deductions</h3>
              <div className="space-y-2">
                {deductions.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-medium text-red-600">-{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Net Pay</span>
                    <span className="text-emerald-600">{formatCurrency(payslip.net_pay)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              {payslip.computed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Computed</span>
                  <span>{formatDate(payslip.computed_at)}</span>
                </div>
              )}
              {payslip.approved_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Approved</span>
                  <span>{formatDate(payslip.approved_at)}</span>
                </div>
              )}
              {payslip.email_sent_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email Sent</span>
                  <span>{formatDate(payslip.email_sent_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-4 flex gap-2">
            <Button variant="outline" className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            {payslip.pdf_path && (
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" asChild>
                <a href={payslip.pdf_path} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </a>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Payroll Summary Tab ─────────────────────────────────────────────────────

function PayrollSummaryTab({ summary, isLoading }: { summary: PayslipSummary | null; isLoading: boolean }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
        <p className="text-gray-500 mt-2">Loading summary...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">No data available. Select a period and compute payslips.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Employees</p>
          <p className="text-2xl font-bold">{summary.total_employees}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Gross</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.total_gross)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Deductions</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.total_deductions)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Net Pay</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.total_net)}</p>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold">Breakdown by Department</h3>
        </div>
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead className="text-center">Employees</TableHead>
              <TableHead className="text-right">Gross Pay</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(summary.by_department).map(([dept, data]) => (
              <TableRow key={dept}>
                <TableCell className="font-medium">{dept}</TableCell>
                <TableCell className="text-center">{data.count}</TableCell>
                <TableCell className="text-right">{formatCurrency(data.gross)}</TableCell>
                <TableCell className="text-right">{formatCurrency(data.net)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Audit Trail Tab ─────────────────────────────────────────────────────────

function AuditTrailTab({ logs, isLoading }: { logs: AuditLog[]; isLoading: boolean }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
        <p className="text-gray-500 mt-2">Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold">Timestamp</TableHead>
            <TableHead className="font-semibold">Action</TableHead>
            <TableHead className="font-semibold">User</TableHead>
            <TableHead className="font-semibold">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                No audit logs found
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-gray-50">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>{log.performer?.name || `User #${log.user_id}`}</TableCell>
                <TableCell className="text-gray-600">{log.description || "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Export Tab ──────────────────────────────────────────────────────────────

function ExportTab({ period, summary }: { period: PayrollPeriod | undefined; summary: PayslipSummary | null }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  const handleExportPDF = () => {
    if (period) {
      window.open(`/api/payroll-periods/${period.id}/summary-pdf`, "_blank");
    }
  };

  const handleExportExcel = () => {
    alert("Excel export coming soon");
  };

  const handleExportCSV = () => {
    alert("CSV export coming soon");
  };

  const handleExportJSON = async () => {
    if (!summary) return;
    const dataStr = JSON.stringify(summary, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", `payroll_summary_${period?.label || "export"}.json`);
    linkElement.click();
  };

  if (!period) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">Select a period to export data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleExportPDF}>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <FileText className="h-12 w-12 text-red-500 mb-3" />
            <h3 className="font-semibold text-gray-800">Export as PDF</h3>
            <p className="text-xs text-gray-500 mt-1">Download payroll summary as PDF</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleExportExcel}>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <FileSpreadsheet className="h-12 w-12 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-800">Export as Excel</h3>
            <p className="text-xs text-gray-500 mt-1">Download payroll report as XLSX</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleExportCSV}>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <File className="h-12 w-12 text-blue-500 mb-3" />
            <h3 className="font-semibold text-gray-800">Export as CSV</h3>
            <p className="text-xs text-gray-500 mt-1">Download payroll report as CSV</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleExportJSON}>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <FileJson className="h-12 w-12 text-yellow-600 mb-3" />
            <h3 className="font-semibold text-gray-800">Export as JSON</h3>
            <p className="text-xs text-gray-500 mt-1">Download payroll data as JSON</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Summary Preview */}
      {summary && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold">Export Summary Preview</h3>
            <p className="text-sm text-gray-500">Period: {period.label}</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Employees</p>
                <p className="text-lg font-semibold">{summary.total_employees}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Gross</p>
                <p className="text-lg font-semibold">{formatCurrency(summary.total_gross)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Deductions</p>
                <p className="text-lg font-semibold">{formatCurrency(summary.total_deductions)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Net Pay</p>
                <p className="text-lg font-semibold">{formatCurrency(summary.total_net)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Accounting Page ────────────────────────────────────────────────────

export default function Accounting() {
  const { toast } = useToast();
  const {
    periods,
    payslips,
    selectedPayslip,
    summary,
    auditLogs,
    isLoading,
    error,
    fetchPeriods,
    generateNextPeriod,
    fetchPayslips,
    fetchPayslip,
    computeAll,
    approvePayslip,
    markAsPaid,
    fetchSummary,
    fetchAuditLogs,
    sendEmail,
    bulkSendEmail,
    clearSelected,
    clearError,
  } = usePayslip();

  const [activePeriodId, setActivePeriodId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("payslips");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [computing, setComputing] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const activePeriod = periods.find(p => p.id === activePeriodId);

  // Load periods on mount
  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  // Auto-select first period
  useEffect(() => {
    if (periods.length > 0 && !activePeriodId) {
      setActivePeriodId(periods[0].id);
    }
  }, [periods, activePeriodId]);

  // Load data when period changes
  useEffect(() => {
    if (!activePeriodId) return;
    fetchPayslips(activePeriodId);
    fetchSummary(activePeriodId);
    if (activeTab === "audit") fetchAuditLogs(activePeriodId);
  }, [activePeriodId, fetchPayslips, fetchSummary, fetchAuditLogs, activeTab]);

  const handleGeneratePeriod = async () => {
    setGenerating(true);
    try {
      const newPeriod = await generateNextPeriod("semi_monthly");
      setActivePeriodId(newPeriod.id);
      toast({ title: "Success", description: `${newPeriod.label} has been created.` });
    } catch (err) {
      toast({ title: "Error", description: error || "Failed to generate period", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleComputeAll = async () => {
    if (!activePeriodId) return;
    setComputing(true);
    try {
      const result = await computeAll(activePeriodId);
      toast({
        title: "Payroll Computed",
        description: `${result.success.length} payslips generated. ${result.failed.length} failed.`,
      });
      await fetchSummary(activePeriodId);
    } catch (err) {
      toast({ title: "Error", description: error || "Failed to compute payroll", variant: "destructive" });
    } finally {
      setComputing(false);
    }
  };

  const handleBulkEmail = async () => {
    if (!activePeriodId) return;
    setEmailing(true);
    try {
      const result = await bulkSendEmail(activePeriodId);
      toast({
        title: "Emails Sent",
        description: `${result.sent_count} payslips emailed. ${result.failed_count} failed.`,
      });
    } catch (err) {
      toast({ title: "Error", description: error || "Failed to send emails", variant: "destructive" });
    } finally {
      setEmailing(false);
    }
  };

  const handleViewPayslip = async (id: number) => {
    await fetchPayslip(id);
    setDrawerOpen(true);
  };

  // Show error toast if any
  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      clearError();
    }
  }, [error, toast, clearError]);

  const filteredPayslips = payslips.filter(p => p.payroll_period_id === activePeriodId);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Accounting</h1>
          <p className="text-sm text-gray-500 mt-1">Payroll management & payslip generation</p>
        </div>

        {/* Period Selector and Action Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Pay Period:</span>
            </div>
            <Select value={String(activePeriodId)} onValueChange={(v) => setActivePeriodId(Number(v))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    <div className="flex items-center gap-2">
                      <span>{p.label}</span>
                      <Badge className={cn("text-xs", statusStyles[p.status])}>
                        {p.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activePeriod && (
              <Badge className={cn("text-xs", statusStyles[activePeriod.status])}>
                {activePeriod.status.toUpperCase()}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleGeneratePeriod} disabled={generating}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              New Period
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkEmail} disabled={emailing || !activePeriodId}>
              {emailing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Bulk Email
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleComputeAll} disabled={computing || !activePeriodId}>
              {computing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Compute All
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="payslips" className="rounded-md px-4 py-2">Payslips</TabsTrigger>
            <TabsTrigger value="summary" className="rounded-md px-4 py-2">Summary</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-md px-4 py-2">Audit Trail</TabsTrigger>
            <TabsTrigger value="export" className="rounded-md px-4 py-2">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="payslips">
            <PayslipTable payslips={filteredPayslips} isLoading={isLoading} onView={handleViewPayslip} />
          </TabsContent>

          <TabsContent value="summary">
            <PayrollSummaryTab summary={summary} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="audit">
            <AuditTrailTab logs={auditLogs} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="export">
            <ExportTab period={activePeriod} summary={summary} />
          </TabsContent>
        </Tabs>

        {/* Payslip Detail Drawer */}
        <PayslipDrawer payslip={selectedPayslip} open={drawerOpen} onClose={() => { setDrawerOpen(false); clearSelected(); }} />
      </div>
    </DashboardLayout>
  );
}