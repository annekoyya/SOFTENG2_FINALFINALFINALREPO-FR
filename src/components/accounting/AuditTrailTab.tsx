// src/components/accounting/AuditTrailTab.tsx
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/hooks/useAccounting";

interface Props {
  logs: AuditLog[];
  isLoading: boolean;
}

const actionStyles: Record<string, string> = {
  created:            "bg-gray-100 text-gray-700",
  computed:           "bg-amber-100 text-amber-700",
  adjusted:           "bg-purple-100 text-purple-700",
  approved:           "bg-blue-100 text-blue-700",
  paid:               "bg-green-100 text-green-700",
  email_sent:         "bg-cyan-100 text-cyan-700",
  pdf_generated:      "bg-indigo-100 text-indigo-700",
  cancelled:          "bg-red-100 text-red-700",
  loan_deducted:      "bg-orange-100 text-orange-700",
  allowance_applied:  "bg-teal-100 text-teal-700",
  rejected:           "bg-red-100 text-red-700",
};

const entityLabels: Record<string, string> = {
  payslip:             "Payslip",
  payroll_period:      "Period",
  employee_loan:       "Loan",
  employee_allowance:  "Allowance",
};

export function AuditTrailTab({ logs, isLoading }: Props) {
  if (isLoading && logs.length === 0) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <ShieldCheck className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-muted-foreground">No audit logs yet</p>
        <p className="text-sm text-muted-foreground mt-1">Actions will appear here once payroll is processed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <span>Immutable audit trail — all records are permanent and cannot be edited</span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
              <th className="px-4 py-3 text-left font-semibold">Action</th>
              <th className="px-4 py-3 text-left font-semibold">Entity</th>
              <th className="px-4 py-3 text-left font-semibold">Performed By</th>
              <th className="px-4 py-3 text-left font-semibold">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("en-PH", {
                    month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">
                  <Badge className={cn("text-xs capitalize border-0",
                    actionStyles[log.action] ?? "bg-gray-100 text-gray-700")}>
                    {log.action.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  <span>{entityLabels[log.entity_type] ?? log.entity_type}</span>
                  <span className="ml-1 text-muted-foreground/60">#{log.entity_id}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-xs">
                    {log.performer?.name ?? `User #${log.performed_by}`}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                  {log.description ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}