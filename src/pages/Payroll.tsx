import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PayrollTable } from "@/components/payroll/PayrollTable";
import { PayrollDrawer } from "@/components/payroll/PayrollDrawer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Download,
} from "lucide-react";
import { Payroll, PayrollSummary } from "@/types/payroll";
import { Employee } from "@/types/employee";
import { useToast } from "@/hooks/use-toast";

export default function Payroll() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Selected Payroll
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Create Payroll Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedEmployeeForPayroll, setSelectedEmployeeForPayroll] =
    useState<string>("");
  const [payPeriodStart, setPayPeriodStart] = useState<string>("");
  const [payPeriodEnd, setPayPeriodEnd] = useState<string>("");
  const [isCreatingPayroll, setIsCreatingPayroll] = useState(false);

  // Status Change Dialogs
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [operationLoading, setOperationLoading] = useState(false);

  // Month/Year filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Load payrolls and summary
  useEffect(() => {
    loadPayrolls();
    loadSummary();
    loadEmployees();
  }, [selectedYear, selectedMonth]);

  const loadPayrolls = async () => {
    setIsLoading(true);
    try {
      // In production, this would be an API call
      // For now, using mock data
      setPayrolls([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load payrolls",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      // In production, this would be an API call
      setSummary({
        total_cost: 0,
        total_net: 0,
        total_deductions: 0,
        count: 0,
        pending_approval: 0,
        statuses: {},
      });
    } catch (error) {
      console.error("Failed to load summary");
    }
  };

  const loadEmployees = async () => {
    try {
      // In production, this would be an API call
      setEmployees([]);
    } catch (error) {
      console.error("Failed to load employees");
    }
  };

  const handleViewPayroll = (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    setDrawerOpen(true);
  };

  const handleCreatePayroll = async () => {
    if (!selectedEmployeeForPayroll || !payPeriodStart || !payPeriodEnd) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingPayroll(true);
    try {
      // In production, this would be an API call to calculate and create payroll
      toast({
        title: "Success",
        description: "Payroll calculated successfully",
      });
      setCreateDialogOpen(false);
      setSelectedEmployeeForPayroll("");
      setPayPeriodStart("");
      setPayPeriodEnd("");
      loadPayrolls();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create payroll",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayroll(false);
    }
  };

  const handleApprovePayroll = async () => {
    if (!selectedPayroll) return;

    setOperationLoading(true);
    try {
      // In production, this would be an API call
      toast({
        title: "Success",
        description: "Payroll approved successfully",
      });
      setApproveDialogOpen(false);
      setDrawerOpen(false);
      loadPayrolls();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve payroll",
        variant: "destructive",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const handleRejectPayroll = async () => {
    if (!selectedPayroll) return;

    setOperationLoading(true);
    try {
      // In production, this would be an API call with rejection reason
      toast({
        title: "Success",
        description: "Payroll rejected successfully",
      });
      setRejectDialogOpen(false);
      setRejectionReason("");
      setDrawerOpen(false);
      loadPayrolls();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject payroll",
        variant: "destructive",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!selectedPayroll) return;

    setOperationLoading(true);
    try {
      // In production, this would be an API call
      toast({
        title: "Success",
        description: "Payroll processed successfully",
      });
      setDrawerOpen(false);
      loadPayrolls();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payroll",
        variant: "destructive",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPayroll) return;

    setOperationLoading(true);
    try {
      // In production, this would be an API call
      toast({
        title: "Success",
        description: "Payroll marked as paid",
      });
      setDrawerOpen(false);
      loadPayrolls();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark payroll as paid",
        variant: "destructive",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  const handleGeneratePayslip = async () => {
    if (!selectedPayroll) return;

    toast({
      title: "Info",
      description: "Generating payslip PDF...",
    });

    // In production, this would generate a PDF
    setTimeout(() => {
      toast({
        title: "Success",
        description: "Payslip downloaded successfully",
      });
    }, 1500);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => 2024 + i);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Payroll Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            Process and manage employee payroll with complete visibility
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-2"
          size="lg"
        >
          <Plus className="h-4 w-4" />
          Calculate Payroll
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Payroll Cost
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.total_cost)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.count} employees this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Deductions
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.total_deductions)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                SSS, PhilHealth, Pag-IBIG, Tax
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Approvals
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.pending_approval}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting review and approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Payrolls</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.statuses?.paid ?? 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Successfully processed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-3">
        <Select
          value={selectedMonth.toString()}
          onValueChange={(v) => setSelectedMonth(parseInt(v))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value.toString()}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedYear.toString()}
          onValueChange={(v) => setSelectedYear(parseInt(v))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Payroll Table */}
      <div className="rounded-lg border border-border bg-card">
        <PayrollTable
          payrolls={payrolls}
          isLoading={isLoading}
          onView={handleViewPayroll}
          onApprove={(payroll) => {
            setSelectedPayroll(payroll);
            setApproveDialogOpen(true);
          }}
          onReject={(payroll) => {
            setSelectedPayroll(payroll);
            setRejectDialogOpen(true);
          }}
          onProcess={(payroll) => {
            setSelectedPayroll(payroll);
            handleProcessPayroll();
          }}
          onMarkPaid={(payroll) => {
            setSelectedPayroll(payroll);
            handleMarkAsPaid();
          }}
          onGeneratePayslip={handleGeneratePayslip}
        />
      </div>

      {/* Payroll Details Drawer */}
      <PayrollDrawer
        open={drawerOpen}
        payroll={selectedPayroll}
        onClose={() => setDrawerOpen(false)}
        onApprove={() => {
          if (selectedPayroll?.status === "draft") {
            handleApprovePayroll();
          } else if (selectedPayroll?.status === "pending_approval") {
            setApproveDialogOpen(true);
          }
        }}
        onReject={() => {
          setRejectDialogOpen(true);
        }}
        onProcess={() => handleProcessPayroll()}
        onMarkPaid={() => handleMarkAsPaid()}
        onGeneratePayslip={handleGeneratePayslip}
        isLoading={operationLoading}
      />

      {/* Create Payroll Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Calculate New Payroll</DialogTitle>
            <DialogDescription>
              Select an employee and pay period to calculate payroll
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Employee</label>
              <Select
                value={selectedEmployeeForPayroll}
                onValueChange={setSelectedEmployeeForPayroll}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Pay Period Start</label>
              <input
                type="date"
                value={payPeriodStart}
                onChange={(e) => setPayPeriodStart(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Pay Period End</label>
              <input
                type="date"
                value={payPeriodEnd}
                onChange={(e) => setPayPeriodEnd(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePayroll}
              disabled={isCreatingPayroll}
            >
              {isCreatingPayroll ? "Calculating..." : "Calculate Payroll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Payroll?</AlertDialogTitle>
            <AlertDialogDescription>
              Review the calculation and click confirm to approve the payroll
              for {selectedPayroll?.employee?.first_name}{" "}
              {selectedPayroll?.employee?.last_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedPayroll && (
            <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Gross Salary:</span>
                <span className="font-semibold">
                  {formatCurrency(selectedPayroll.gross_salary)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Deductions:</span>
                <span className="font-semibold">
                  -{formatCurrency(selectedPayroll.total_deductions)}
                </span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span>Net Salary:</span>
                <span className="font-bold text-success">
                  {formatCurrency(selectedPayroll.net_salary)}
                </span>
              </div>
            </div>
          )}
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleApprovePayroll}
            disabled={operationLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {operationLoading ? "Processing..." : "Approve"}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Payroll?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this payroll. It will be
              returned to draft status.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div>
            <label className="text-sm font-medium">Reason for Rejection</label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="mt-2"
            />
          </div>

          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRejectPayroll}
            disabled={operationLoading || !rejectionReason}
            className="bg-red-600 hover:bg-red-700"
          >
            {operationLoading ? "Processing..." : "Reject"}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
