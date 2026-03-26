// src/components/accounting/AccountantPayslipFlow.tsx
// This is the Accountant-role view of the Accounting page.
// Replaces the existing PayslipTable for Accountant users with a guided flow:
// Period select → Compute → Review → Approve all → Bulk email

import { useState } from "react";
import { authFetch } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Calculator, CheckCircle, Mail,
  Loader2, AlertCircle, ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PayrollPeriod {
  id: number;
  label: string;
  status: "draft" | "computed" | "approved" | "paid";
  payslips_count?: number;
}

interface PayslipSummaryRow {
  id: number;
  employee_id: number;
  employee_name: string;
  department: string;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  status: string;
  has_warnings: boolean;
  warning_message?: string;
  email?: string;
}

// ── Step pill ─────────────────────────────────────────────────────────────────

function StepPill({ n, label, active, done }: {
  n: number; label: string; active: boolean; done: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      done   ? "bg-emerald-50 text-emerald-700" :
      active ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" :
               "bg-muted/50 text-muted-foreground"
    }`}>
      <span className={`w-4.5 h-4.5 flex items-center justify-center rounded-full text-[10px] font-bold ${
        done   ? "bg-emerald-500 text-white" :
        active ? "bg-blue-500 text-white" :
                 "bg-muted text-muted-foreground"
      }`} style={{ minWidth: 18, minHeight: 18 }}>
        {done ? "✓" : n}
      </span>
      {label}
    </div>
  );
}

function formatPHP(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

// ── Main component ─────────────────────────────────────────────────────────────

interface AccountantPayslipFlowProps {
  periods: PayrollPeriod[];
  onRefreshPeriods: () => void;
}

export default function AccountantPayslipFlow({
  periods, onRefreshPeriods,
}: AccountantPayslipFlowProps) {
  const { toast } = useToast();

  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [payslips,  setPayslips]  = useState<PayslipSummaryRow[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [computing, setComputing] = useState(false);
  const [emailing,  setEmailing]  = useState(false);
  const [approving, setApproving] = useState(false);

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  // Step tracking
  const step1Done = !!selectedPeriod;
  const step2Done = selectedPeriod?.status === "computed" || selectedPeriod?.status === "approved" || selectedPeriod?.status === "paid";
  const step3Done = selectedPeriod?.status === "approved" || selectedPeriod?.status === "paid";
  const step4Done = selectedPeriod?.status === "paid";

  const loadPayslips = async (periodId: number) => {
    setLoading(true);
    try {
      const res  = await authFetch(`/api/payslips?payroll_period_id=${periodId}`);
      const data = await res.json();
      setPayslips(data);
    } finally { setLoading(false); }
  };

  const handleSelectPeriod = (id: string) => {
    const pid = parseInt(id);
    setSelectedPeriodId(pid);
    loadPayslips(pid);
  };

  // Step 2: Compute all
  const handleCompute = async () => {
    if (!selectedPeriodId) return;
    setComputing(true);
    try {
      const res  = await authFetch(`/api/payroll-periods/${selectedPeriodId}/compute`, { method: "POST" });
      const data = await res.json();
      toast({ title: `Computed ${data.count ?? ""} payslips successfully.` });
      onRefreshPeriods();
      loadPayslips(selectedPeriodId);
    } catch {
      toast({ title: "Compute failed.", variant: "destructive" });
    } finally { setComputing(false); }
  };

  // Step 3: Approve all
  const handleApproveAll = async () => {
    if (!selectedPeriodId) return;
    setApproving(true);
    try {
      const res = await authFetch(`/api/payroll-periods/${selectedPeriodId}/approve-all`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast({ title: "All payslips approved." });
      onRefreshPeriods();
      loadPayslips(selectedPeriodId);
    } catch {
      toast({ title: "Approval failed.", variant: "destructive" });
    } finally { setApproving(false); }
  };

  // Step 4: Bulk email
  const handleBulkEmail = async () => {
    if (!selectedPeriodId) return;
    setEmailing(true);
    try {
      const res  = await authFetch(`/api/payroll-periods/${selectedPeriodId}/bulk-email`, { method: "POST" });
      const data = await res.json();
      toast({ title: `Payslips emailed to ${data.sent ?? ""} employees.` });
      onRefreshPeriods();
    } catch {
      toast({ title: "Email failed.", variant: "destructive" });
    } finally { setEmailing(false); }
  };

  // Individual email
  const handleSendOne = async (payslipId: number) => {
    try {
      await authFetch(`/api/payslips/${payslipId}/send-email`, { method: "POST" });
      toast({ title: "Payslip emailed." });
    } catch {
      toast({ title: "Failed to send.", variant: "destructive" });
    }
  };

  const warnings = payslips.filter((p) => p.has_warnings);
  const totals = {
    gross: payslips.reduce((s, p) => s + p.gross_pay, 0),
    net:   payslips.reduce((s, p) => s + p.net_pay, 0),
  };

  return (
    <div className="space-y-5">
      {/* Step progress */}
      <div className="flex items-center gap-2 flex-wrap">
        <StepPill n={1} label="Select period"  active={!step1Done} done={step1Done} />
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        <StepPill n={2} label="Compute"         active={step1Done && !step2Done} done={step2Done} />
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        <StepPill n={3} label="Approve all"     active={step2Done && !step3Done} done={step3Done} />
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        <StepPill n={4} label="Email payslips"  active={step3Done && !step4Done} done={step4Done} />
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-3">
        <Select onValueChange={handleSelectPeriod} value={selectedPeriodId ? String(selectedPeriodId) : ""}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select payroll period…" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.label}
                <span className="ml-2 text-xs text-muted-foreground capitalize">({p.status})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action buttons — context-aware */}
        {selectedPeriod && (
          <div className="flex items-center gap-2">
            {!step2Done && (
              <Button size="sm" className="gap-1.5" disabled={computing} onClick={handleCompute}>
                {computing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
                {computing ? "Computing…" : "Compute all"}
              </Button>
            )}
            {step2Done && !step3Done && (
              <Button size="sm" className="gap-1.5" disabled={approving} onClick={handleApproveAll}>
                {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                {approving ? "Approving…" : "Approve all"}
              </Button>
            )}
            {step3Done && !step4Done && (
              <Button size="sm" className="gap-1.5" disabled={emailing} onClick={handleBulkEmail}>
                {emailing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                {emailing ? "Sending…" : "Email all payslips"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Warnings banner */}
      {warnings.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{warnings.length} payslip{warnings.length > 1 ? "s" : ""} have warnings</p>
            <ul className="mt-1 space-y-0.5 text-xs">
              {warnings.map((p) => (
                <li key={p.id}>{p.employee_name}: {p.warning_message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Summary totals */}
      {payslips.length > 0 && (
        <div className="flex flex-wrap gap-4 px-4 py-2.5 bg-muted/40 rounded-lg border text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Employees</span>
            <p className="font-semibold">{payslips.length}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Total gross</span>
            <p className="font-semibold font-mono">{formatPHP(totals.gross)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Total net pay</span>
            <p className="font-semibold font-mono text-emerald-700">{formatPHP(totals.net)}</p>
          </div>
          <div className="ml-auto self-center">
            <Badge className={`rounded-full capitalize ${
              selectedPeriod?.status === "paid"     ? "bg-violet-50 text-violet-700 border-violet-200" :
              selectedPeriod?.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              selectedPeriod?.status === "computed" ? "bg-blue-50 text-blue-700 border-blue-200" :
              "bg-muted text-muted-foreground"
            } border`}>
              {selectedPeriod?.status}
            </Badge>
          </div>
        </div>
      )}

      {/* Payslip table */}
      {payslips.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs text-muted-foreground font-medium">Employee</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Department</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Gross</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Deductions</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Net pay</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                    Loading payslips…
                  </TableCell>
                </TableRow>
              ) : (
                payslips.map((p) => (
                  <TableRow key={p.id} className="text-sm hover:bg-muted/20">
                    <TableCell className="font-medium">
                      {p.employee_name}
                      {p.has_warnings && (
                        <AlertCircle className="inline w-3 h-3 text-amber-500 ml-1" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.department}</TableCell>
                    <TableCell className="text-right font-mono">{formatPHP(p.gross_pay)}</TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      −{formatPHP(p.total_deductions)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatPHP(p.net_pay)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`rounded-full capitalize border text-xs ${
                        p.status === "paid"     ? "bg-violet-50 text-violet-700 border-violet-200" :
                        p.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        p.status === "computed" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-muted text-muted-foreground border-0"
                      }`}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status === "approved" && (
                        <Button
                          size="sm" variant="ghost"
                          className="h-7 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => handleSendOne(p.id)}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}