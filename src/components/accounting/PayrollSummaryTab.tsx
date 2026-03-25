// src/components/accounting/PayrollSummaryTab.tsx
import { Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PayrollSummary } from "@/hooks/useAccounting";

interface Props {
  summary: PayrollSummary | null;
  isLoading: boolean;
}

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export function PayrollSummaryTab({ summary, isLoading }: Props) {
  if (isLoading && !summary) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <TrendingUp className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-muted-foreground">No summary available. Compute payroll first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Employees", value: summary.total_employees, color: "text-foreground" },
          { label: "Total Gross Pay", value: fmt(summary.total_gross), color: "text-green-600" },
          { label: "Total Deductions", value: fmt(summary.total_deductions), color: "text-red-600" },
          { label: "Total Net Pay", value: fmt(summary.total_net), color: "text-blue-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className={cn("text-xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Statutory remittance */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-blue-50">
          <h3 className="font-semibold text-blue-900 text-sm uppercase tracking-wide">
            Government Remittance Summary
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-5 py-3 text-left font-semibold">Contribution</th>
              <th className="px-5 py-3 text-right font-semibold">Employee Share</th>
              <th className="px-5 py-3 text-right font-semibold">Employer Share</th>
              <th className="px-5 py-3 text-right font-semibold">Total Remittance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              ["SSS", summary.total_sss_employee, summary.total_sss_employer],
              ["PhilHealth", summary.total_philhealth_employee, summary.total_philhealth_employer],
              ["Pag-IBIG", summary.total_pagibig_employee, summary.total_pagibig_employer],
              ["BIR Withholding Tax", summary.total_bir, 0],
            ].map(([label, emp, er]) => (
              <tr key={label as string} className="hover:bg-muted/20">
                <td className="px-5 py-3 font-medium">{label}</td>
                <td className="px-5 py-3 text-right">{fmt(emp as number)}</td>
                <td className="px-5 py-3 text-right">{er ? fmt(er as number) : "—"}</td>
                <td className="px-5 py-3 text-right font-semibold">
                  {fmt((emp as number) + (er as number))}
                </td>
              </tr>
            ))}
            <tr className="bg-muted/40 font-bold">
              <td className="px-5 py-3">TOTAL</td>
              <td className="px-5 py-3 text-right">
                {fmt(summary.total_sss_employee + summary.total_philhealth_employee + summary.total_pagibig_employee + summary.total_bir)}
              </td>
              <td className="px-5 py-3 text-right">
                {fmt(summary.total_sss_employer + summary.total_philhealth_employer + summary.total_pagibig_employer)}
              </td>
              <td className="px-5 py-3 text-right text-blue-700">
                {fmt(summary.total_sss_employee + summary.total_philhealth_employee + summary.total_pagibig_employee + summary.total_bir + summary.total_sss_employer + summary.total_philhealth_employer + summary.total_pagibig_employer)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* By department */}
      {Object.keys(summary.by_department).length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              By Department
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Department</th>
                <th className="px-5 py-3 text-right font-semibold">Employees</th>
                <th className="px-5 py-3 text-right font-semibold">Gross Pay</th>
                <th className="px-5 py-3 text-right font-semibold">Net Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(summary.by_department).map(([dept, data]) => (
                <tr key={dept} className="hover:bg-muted/20">
                  <td className="px-5 py-3 font-medium">{dept}</td>
                  <td className="px-5 py-3 text-right">{data.count}</td>
                  <td className="px-5 py-3 text-right text-green-600">{fmt(data.gross)}</td>
                  <td className="px-5 py-3 text-right font-semibold">{fmt(data.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}