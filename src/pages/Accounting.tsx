// src/pages/Accounting.tsx
import { useState } from "react";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";

// ─── Mock Data ─────────────────────────────────────────────────────────────────

// Mock Pay Periods
const mockPeriods = [
  { id: 1, label: "May 1-15, 2024", start_date: "2024-05-01", end_date: "2024-05-15", status: "paid" },
  { id: 2, label: "April 16-30, 2024", start_date: "2024-04-16", end_date: "2024-04-30", status: "approved" },
  { id: 3, label: "April 1-15, 2024", start_date: "2024-04-01", end_date: "2024-04-15", status: "processing" },
  { id: 4, label: "March 16-31, 2024", start_date: "2024-03-16", end_date: "2024-03-31", status: "open" },
];

// Mock Payslips
const mockPayslips = [
  { id: 1, employee_id: 1, employee_name: "Maria Santos", department: "Front Office", position: "Front Desk Manager", gross_pay: 45000, net_pay: 38500, status: "paid", period_id: 1 },
  { id: 2, employee_id: 2, employee_name: "Juan Dela Cruz", department: "Housekeeping", position: "Housekeeping Supervisor", gross_pay: 38000, net_pay: 32500, status: "paid", period_id: 1 },
  { id: 3, employee_id: 3, employee_name: "Ana Reyes", department: "Food & Beverage", position: "Restaurant Manager", gross_pay: 42000, net_pay: 35900, status: "paid", period_id: 1 },
  { id: 4, employee_id: 4, employee_name: "Carlos Mendoza", department: "Engineering", position: "Maintenance Engineer", gross_pay: 35000, net_pay: 29900, status: "approved", period_id: 2 },
  { id: 5, employee_id: 5, employee_name: "Isabel Garcia", department: "Human Resources", position: "HR Coordinator", gross_pay: 32000, net_pay: 27300, status: "approved", period_id: 2 },
  { id: 6, employee_id: 6, employee_name: "Roberto Cruz", department: "Finance", position: "Senior Accountant", gross_pay: 55000, net_pay: 47000, status: "processing", period_id: 3 },
  { id: 7, employee_id: 7, employee_name: "Patricia Lim", department: "Sales & Marketing", position: "Marketing Associate", gross_pay: 28000, net_pay: 23900, status: "open", period_id: 4 },
  { id: 8, employee_id: 8, employee_name: "Antonio Villanueva", department: "Security", position: "Security Chief", gross_pay: 40000, net_pay: 34200, status: "open", period_id: 4 },
];

// Mock Selected Payslip Details
const mockSelectedPayslip = {
  id: 1,
  employee_id: 1,
  employee_name: "Maria Santos",
  department: "Front Office",
  position: "Front Desk Manager",
  period: "May 1-15, 2024",
  gross_pay: 45000,
  net_pay: 38500,
  status: "paid",
  earnings: [
    { name: "Basic Salary", amount: 25000 },
    { name: "Overtime Pay", amount: 3500 },
    { name: "Holiday Pay", amount: 2500 },
    { name: "Allowances", amount: 5000 },
    { name: "Bonuses", amount: 9000 },
  ],
  deductions: [
    { name: "SSS Contribution", amount: 1350 },
    { name: "PhilHealth", amount: 850 },
    { name: "Pag-IBIG", amount: 200 },
    { name: "Withholding Tax", amount: 4100 },
  ],
  generated_at: "2024-05-16T10:30:00Z",
  approved_at: "2024-05-17T14:20:00Z",
  paid_at: "2024-05-18T09:15:00Z",
};

// Mock Summary Data
const mockSummary = {
  total_employees: 45,
  total_gross: 1850000,
  total_deductions: 320000,
  total_net: 1530000,
  by_department: [
    { department: "Front Office", count: 8, gross: 360000, net: 298000 },
    { department: "Housekeeping", count: 12, gross: 420000, net: 348000 },
    { department: "Food & Beverage", count: 10, gross: 380000, net: 315000 },
    { department: "Engineering", count: 6, gross: 240000, net: 199000 },
    { department: "Finance", count: 5, gross: 250000, net: 207000 },
    { department: "HR", count: 4, gross: 200000, net: 163000 },
  ],
};

// Mock Audit Logs
const mockAuditLogs = [
  { id: 1, action: "Payroll generated", user: "System", timestamp: "2024-05-16T08:00:00Z", details: "Period: May 1-15, 2024" },
  { id: 2, action: "Payslip approved", user: "Admin User", timestamp: "2024-05-17T09:30:00Z", details: "Maria Santos - May 2024" },
  { id: 3, action: "Bulk email sent", user: "Accountant", timestamp: "2024-05-17T10:15:00Z", details: "15 payslips emailed" },
  { id: 4, action: "Payslip marked as paid", user: "Accountant", timestamp: "2024-05-18T11:00:00Z", details: "Maria Santos" },
  { id: 5, action: "Adjustment added", user: "HR Manager", timestamp: "2024-05-19T14:20:00Z", details: "Overtime adjustment for Juan Dela Cruz" },
];

// Mock Export Data
const mockExportData = {
  payroll_summary: {
    period: "May 1-15, 2024",
    generated_date: "2024-05-20",
    total_employees: 45,
    total_gross: 1850000,
    total_deductions: 320000,
    total_net: 1530000,
  },
  department_breakdown: [
    { department: "Front Office", employees: 8, gross: 360000, deductions: 62000, net: 298000 },
    { department: "Housekeeping", employees: 12, gross: 420000, deductions: 72000, net: 348000 },
    { department: "Food & Beverage", employees: 10, gross: 380000, deductions: 65000, net: 315000 },
    { department: "Engineering", employees: 6, gross: 240000, deductions: 41000, net: 199000 },
    { department: "Finance", employees: 5, gross: 250000, deductions: 43000, net: 207000 },
    { department: "HR", employees: 4, gross: 200000, deductions: 37000, net: 163000 },
  ],
};

const statusStyles: Record<string, string> = {
  open: "bg-gray-100 text-gray-700",
  processing: "bg-blue-100 text-blue-700",
  computed: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-700",
};

// ─── Payslip Table Component ─────────────────────────────────────────────────

function PayslipTable({ payslips, isLoading, onView }: any) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700">Processing</Badge>;
      case "open":
        return <Badge className="bg-gray-100 text-gray-700">Open</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">Loading payslips...</p>
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
                No payslips found
              </TableCell>
            </TableRow>
          ) : (
            payslips.map((payslip: any) => (
              <TableRow key={payslip.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{payslip.employee_name}</TableCell>
                <TableCell>{payslip.department}</TableCell>
                <TableCell>{payslip.position}</TableCell>
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

function PayslipDrawer({ payslip, open, onClose }: any) {
  if (!payslip) return null;

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

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Payslip Details</SheetTitle>
          <SheetDescription>
            {payslip.employee_name} - {payslip.period}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Employee Info */}
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Employee Name</p>
                <p className="font-medium">{payslip.employee_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="font-medium">{payslip.department}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Position</p>
                <p className="font-medium">{payslip.position}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pay Period</p>
                <p className="font-medium">{payslip.period}</p>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Earnings</h3>
            <div className="space-y-2">
              {payslip.earnings.map((item: any, index: number) => (
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

          {/* Deductions */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Deductions</h3>
            <div className="space-y-2">
              {payslip.deductions.map((item: any, index: number) => (
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

          {/* Timeline */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Generated</span>
                <span>{formatDate(payslip.generated_at)}</span>
              </div>
              {payslip.approved_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Approved</span>
                  <span>{formatDate(payslip.approved_at)}</span>
                </div>
              )}
              {payslip.paid_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid</span>
                  <span>{formatDate(payslip.paid_at)}</span>
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
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Payroll Summary Tab ─────────────────────────────────────────────────────

function PayrollSummaryTab({ summary }: any) {
  if (!summary) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  return (
    <div className="space-y-6">
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
            {summary.by_department.map((dept: any) => (
              <TableRow key={dept.department}>
                <TableCell className="font-medium">{dept.department}</TableCell>
                <TableCell className="text-center">{dept.count}</TableCell>
                <TableCell className="text-right">{formatCurrency(dept.gross)}</TableCell>
                <TableCell className="text-right">{formatCurrency(dept.net)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Audit Trail Tab ─────────────────────────────────────────────────────────

function AuditTrailTab({ logs }: any) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            logs.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">{formatDate(log.timestamp)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-gray-50">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>{log.user}</TableCell>
                <TableCell className="text-gray-600">{log.details}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Export Tab ──────────────────────────────────────────────────────────────

function ExportTab({ exportData }: any) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  const handleExportPDF = () => {
    alert("Exporting as PDF...");
  };

  const handleExportExcel = () => {
    alert("Exporting as Excel...");
  };

  const handleExportCSV = () => {
    alert("Exporting as CSV...");
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "payroll_export.json";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleExportPDF}>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <FileText className="h-12 w-12 text-red-500 mb-3" />
            <h3 className="font-semibold text-gray-800">Export as PDF</h3>
            <p className="text-xs text-gray-500 mt-1">Download payroll report as PDF</p>
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
            <p className="text-xs text-gray-500 mt-1">Download payroll report as JSON</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Summary Preview */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold">Export Summary Preview</h3>
          <p className="text-sm text-gray-500">Period: {exportData.payroll_summary.period}</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Total Employees</p>
              <p className="text-lg font-semibold">{exportData.payroll_summary.total_employees}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Gross</p>
              <p className="text-lg font-semibold">{formatCurrency(exportData.payroll_summary.total_gross)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Deductions</p>
              <p className="text-lg font-semibold">{formatCurrency(exportData.payroll_summary.total_deductions)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Net Pay</p>
              <p className="text-lg font-semibold">{formatCurrency(exportData.payroll_summary.total_net)}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium mb-2">Department Breakdown</h4>
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Employees</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportData.department_breakdown.map((dept: any) => (
                  <TableRow key={dept.department}>
                    <TableCell>{dept.department}</TableCell>
                    <TableCell className="text-center">{dept.employees}</TableCell>
                    <TableCell className="text-right">{formatCurrency(dept.gross)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(dept.net)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Accounting Page ────────────────────────────────────────────────────

export default function Accounting() {
  const [activePeriodId, setActivePeriodId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState("payslips");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPayslipId, setSelectedPayslipId] = useState<number | null>(null);

  const activePeriod = mockPeriods.find(p => p.id === activePeriodId);
  const filteredPayslips = mockPayslips.filter(p => p.period_id === activePeriodId);
  const selectedPayslip = selectedPayslipId ? mockSelectedPayslip : null;

  const handleViewPayslip = (id: number) => {
    setSelectedPayslipId(id);
    setDrawerOpen(true);
  };

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
                {mockPeriods.map(p => (
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
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Period
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Bulk Email
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Play className="mr-2 h-4 w-4" />
              Compute All
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="payslips" className="rounded-md px-4 py-2">
              Payslips
            </TabsTrigger>
            <TabsTrigger value="summary" className="rounded-md px-4 py-2">
              Summary
            </TabsTrigger>
            <TabsTrigger value="audit" className="rounded-md px-4 py-2">
              Audit Trail
            </TabsTrigger>
            <TabsTrigger value="export" className="rounded-md px-4 py-2">
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payslips">
            <PayslipTable
              payslips={filteredPayslips}
              isLoading={false}
              onView={handleViewPayslip}
            />
          </TabsContent>

          <TabsContent value="summary">
            <PayrollSummaryTab summary={mockSummary} />
          </TabsContent>

          <TabsContent value="audit">
            <AuditTrailTab logs={mockAuditLogs} />
          </TabsContent>

          <TabsContent value="export">
            <ExportTab exportData={mockExportData} />
          </TabsContent>
        </Tabs>

        {/* Payslip Detail Drawer */}
        <PayslipDrawer
          payslip={selectedPayslip}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedPayslipId(null);
          }}
        />
      </div>
    </DashboardLayout>
  );
}