import { useState } from "react";
import { Payroll } from "@/types/payroll";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Eye, FileText, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PayrollTableProps {
  payrolls: Payroll[];
  isLoading?: boolean;
  onView: (payroll: Payroll) => void;
  onApprove?: (payroll: Payroll) => void;
  onReject?: (payroll: Payroll) => void;
  onProcess?: (payroll: Payroll) => void;
  onMarkPaid?: (payroll: Payroll) => void;
  onGeneratePayslip?: (payroll: Payroll) => void;
}

const statusStyles = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  pending_approval: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  processed: "bg-purple-100 text-purple-800 border-purple-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  processed: "Processed",
  paid: "Paid",
  failed: "Failed",
};

export function PayrollTable({
  payrolls,
  isLoading = false,
  onView,
  onApprove,
  onReject,
  onProcess,
  onMarkPaid,
  onGeneratePayslip,
}: PayrollTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredPayrolls = payrolls.filter((payroll) => {
    const matchesSearch =
      payroll.employee?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      payroll.employee?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      payroll.employee?.email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || payroll.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Gross Pay</TableHead>
              <TableHead className="text-right">Total Deductions</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead>Pay Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading payroll data...
                </TableCell>
              </TableRow>
            ) : filteredPayrolls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No payroll records found
                </TableCell>
              </TableRow>
            ) : (
              filteredPayrolls.map((payroll) => (
                <TableRow key={payroll.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>
                        {payroll.employee?.first_name} {payroll.employee?.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {payroll.employee?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(payroll.gross_salary)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(payroll.total_deductions)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-success">
                    {formatCurrency(payroll.net_salary)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(payroll.pay_period_start)} -{" "}
                    {formatDate(payroll.pay_period_end)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "border",
                        statusStyles[payroll.status as keyof typeof statusStyles]
                      )}
                    >
                      {statusLabels[payroll.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onView(payroll)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>

                        {payroll.status === "draft" && onApprove && (
                          <DropdownMenuItem onClick={() => onApprove(payroll)}>
                            <Check className="mr-2 h-4 w-4" />
                            Submit for Approval
                          </DropdownMenuItem>
                        )}

                        {payroll.status === "pending_approval" && (
                          <>
                            {onApprove && (
                              <DropdownMenuItem
                                onClick={() => onApprove(payroll)}
                                className="text-green-600"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {onReject && (
                              <DropdownMenuItem
                                onClick={() => onReject(payroll)}
                                className="text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            )}
                          </>
                        )}

                        {payroll.status === "approved" && onProcess && (
                          <DropdownMenuItem onClick={() => onProcess(payroll)}>
                            <Check className="mr-2 h-4 w-4" />
                            Process
                          </DropdownMenuItem>
                        )}

                        {payroll.status === "processed" && onMarkPaid && (
                          <DropdownMenuItem onClick={() => onMarkPaid(payroll)}>
                            <Check className="mr-2 h-4 w-4" />
                            Mark as Paid
                          </DropdownMenuItem>
                        )}

                        {onGeneratePayslip && (
                          <DropdownMenuItem onClick={() => onGeneratePayslip(payroll)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Payslip
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
