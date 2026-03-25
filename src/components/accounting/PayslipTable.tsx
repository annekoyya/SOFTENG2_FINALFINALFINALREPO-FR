// src/components/accounting/PayslipTable.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, DollarSign, Mail, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Payslip } from "@/hooks/useAccounting";
import { useState } from "react";

interface Props {
  payslips: Payslip[];
  isLoading: boolean;
  onView: (id: number) => void;
  onApprove: (id: number) => Promise<void>;
  onMarkPaid: (id: number) => Promise<void>;
  onSendEmail: (id: number) => Promise<void>;
}

const statusStyles: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  computed:  "bg-amber-100 text-amber-700",
  approved:  "bg-blue-100 text-blue-700",
  paid:      "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export function PayslipTable({ payslips, isLoading, onView, onApprove, onMarkPaid, onSendEmail }: Props) {
  const [actionId, setActionId] = useState<number | null>(null);

  const doAction = async (id: number, fn: (id: number) => Promise<void>) => {
    setActionId(id);
    try { await fn(id); }
    finally { setActionId(null); }
  };

  if (isLoading && payslips.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (payslips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">No payslips yet</p>
        <p className="text-sm text-muted-foreground mt-1">Click "Compute All" to generate payslips for this period</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/30">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Employee</th>
            <th className="px-4 py-3 text-left font-semibold">Department</th>
            <th className="px-4 py-3 text-right font-semibold">Gross Pay</th>
            <th className="px-4 py-3 text-right font-semibold">Deductions</th>
            <th className="px-4 py-3 text-right font-semibold">Net Pay</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Email</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {payslips.map(ps => (
            <tr key={ps.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium">{ps.employee?.full_name}</p>
                <p className="text-xs text-muted-foreground">{ps.employee?.job_category}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{ps.employee?.department}</td>
              <td className="px-4 py-3 text-right font-medium text-green-700">
                ₱{ps.gross_pay.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-right text-red-600">
                ₱{ps.total_deductions.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-right font-bold text-foreground">
                ₱{ps.net_pay.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3">
                <Badge className={cn("text-xs capitalize border-0", statusStyles[ps.status])}>
                  {ps.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {ps.email_sent ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Sent
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  {/* View */}
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                    onClick={() => onView(ps.id)} title="View Details">
                    <Eye className="h-4 w-4" />
                  </Button>

                  {/* Approve */}
                  {ps.status === "computed" && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600"
                      disabled={actionId === ps.id}
                      onClick={() => doAction(ps.id, onApprove)} title="Approve">
                      {actionId === ps.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <CheckCircle className="h-4 w-4" />}
                    </Button>
                  )}

                  {/* Mark Paid */}
                  {ps.status === "approved" && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600"
                      disabled={actionId === ps.id}
                      onClick={() => doAction(ps.id, onMarkPaid)} title="Mark as Paid">
                      {actionId === ps.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <DollarSign className="h-4 w-4" />}
                    </Button>
                  )}

                  {/* Send Email */}
                  {(ps.status === "approved" || ps.status === "paid") && !ps.email_sent && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-600"
                      disabled={actionId === ps.id}
                      onClick={() => doAction(ps.id, onSendEmail)} title="Send Email">
                      {actionId === ps.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Mail className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}