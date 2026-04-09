// src/pages/Accounting.tsx
// REPLACE ENTIRE FILE

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAccounting, type Payslip, type PayrollSummary, type AuditLog } from "@/hooks/useAccounting";
import {
  Plus, Play, Mail, Download, CalendarDays, Eye, CheckCircle,
  DollarSign, Loader2, ShieldCheck, TrendingUp, ChevronRight,
  FileText, RefreshCw, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_STATUS_STYLES: Record<string, string> = {
  open:       "bg-gray-100 text-gray-700",
  processing: "bg-blue-100 text-blue-700",
  computed:   "bg-amber-100 text-amber-700",
  approved:   "bg-green-100 text-green-700",
  paid:       "bg-emerald-100 text-emerald-700",
};

const SLIP_STATUS_STYLES: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-700",
  computed:  "bg-amber-100 text-amber-700",
  approved:  "bg-blue-100 text-blue-700",
  paid:      "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const fmt = (n: number) => `₱${(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

// ═══════════════════════════════════════════════════════════════════════════
// PAYSLIP DETAIL SHEET
// ═══════════════════════════════════════════════════════════════════════════

function PayslipDetailSheet({
  payslip, open, onClose, onApprove, onMarkPaid, onSendEmail, onDownloadPdf, onAddAdjustment,
}: {
  payslip: Payslip | null; open: boolean; onClose: () => void;
  onApprove: (id: number) => Promise<void>;
  onMarkPaid: (id: number) => Promise<void>;
  onSendEmail: (id: number) => Promise<void>;
  onDownloadPdf: (id: number) => void;
  onAddAdjustment: (id: number, cat: "earning"|"deduction", label: string, amount: number, note: string) => Promise<void>;
}) {
  const { toast }                   = useToast();
  const [acting,    setActing]      = useState(false);
  const [adjOpen,   setAdjOpen]     = useState(false);
  const [adjForm,   setAdjForm]     = useState({ category: "earning" as "earning"|"deduction", label: "", amount: "", note: "" });

  if (!payslip) return null;

  const doApprove = async () => { setActing(true); try { await onApprove(payslip.id); toast({ title: "Approved" }); } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); } finally { setActing(false); } };
  const doPay     = async () => { setActing(true); try { await onMarkPaid(payslip.id); toast({ title: "Marked as paid" }); } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); } finally { setActing(false); } };
  const doEmail   = async () => { setActing(true); try { await onSendEmail(payslip.id); toast({ title: "Email sent" }); } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); } finally { setActing(false); } };
  const doAdj     = async () => {
    if (!adjForm.label || !adjForm.amount || !adjForm.note) { toast({ title: "Fill all fields", variant: "destructive" }); return; }
    setActing(true);
    try {
      await onAddAdjustment(payslip.id, adjForm.category, adjForm.label, parseFloat(adjForm.amount), adjForm.note);
      toast({ title: "Adjustment added" }); setAdjOpen(false); setAdjForm({ category: "earning", label: "", amount: "", note: "" });
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setActing(false); }
  };

  const earnings = [
    { label: "Basic Pay",           amount: payslip.basic_pay },
    { label: "Overtime Pay",        amount: payslip.overtime_pay },
    { label: "Transport Allowance", amount: payslip.transport_allowance },
    { label: "Meal Allowance",      amount: payslip.meal_allowance },
    { label: "Other Allowances",    amount: payslip.other_allowances },
    { label: "Bonuses",             amount: payslip.bonuses },
    { label: "13th Month Pay",      amount: payslip.thirteenth_month_pay },
  ].filter(e => e.amount > 0);

  const deductions = [
    { label: "Late Deduction",        amount: payslip.late_deduction },
    { label: "Absent Deduction",      amount: payslip.absent_deduction },
    { label: "Unpaid Leave",          amount: payslip.unpaid_leave_deduction },
    { label: "SSS Employee",          amount: payslip.sss_employee },
    { label: "PhilHealth Employee",   amount: payslip.philhealth_employee },
    { label: "Pag-IBIG Employee",     amount: payslip.pagibig_employee },
    { label: "Withholding Tax (BIR)", amount: payslip.bir_withholding_tax },
    { label: "SSS Loan",              amount: payslip.sss_loan_deduction },
    { label: "Pag-IBIG Loan",         amount: payslip.pagibig_loan_deduction },
    { label: "Company Loan",          amount: payslip.company_loan_deduction },
    { label: "Other Deductions",      amount: payslip.other_deductions },
  ].filter(d => d.amount > 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Payslip — {payslip.employee?.first_name} {payslip.employee?.last_name}</SheetTitle>
          <p className="text-sm text-muted-foreground">{payslip.period?.label} · {payslip.employee?.department}</p>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Status + Attendance */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Status", value: <Badge className={cn("text-xs border-0 capitalize", SLIP_STATUS_STYLES[payslip.status])}>{payslip.status}</Badge> },
              { label: "Days Worked", value: `${payslip.days_worked}/${payslip.working_days_in_period}` },
              { label: "Days Absent", value: payslip.days_absent },
              { label: "Minutes Late", value: payslip.minutes_late > 0 ? `${payslip.minutes_late}m` : "0" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium text-sm mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Earnings */}
          <div>
            <p className="font-semibold text-sm mb-2">Earnings</p>
            <div className="space-y-1.5">
              {earnings.map(e => (
                <div key={e.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{e.label}</span>
                  <span className="text-green-700 font-medium">{fmt(e.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-border">
                <span>Gross Pay</span><span className="text-green-700">{fmt(payslip.gross_pay)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <p className="font-semibold text-sm mb-2">Deductions</p>
            <div className="space-y-1.5">
              {deductions.map(d => (
                <div key={d.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="text-red-600 font-medium">{fmt(d.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-border">
                <span>Total Deductions</span><span className="text-red-600">{fmt(payslip.total_deductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="rounded-xl bg-muted/30 p-4 flex justify-between items-center">
            <span className="font-bold">Net Pay</span>
            <span className="text-2xl font-bold text-foreground">{fmt(payslip.net_pay)}</span>
          </div>

          {/* Employer contributions */}
          {(payslip.sss_employer + payslip.philhealth_employer + payslip.pagibig_employer) > 0 && (
            <div>
              <p className="font-semibold text-sm mb-2">Employer Contributions</p>
              {[
                { label: "SSS Employer",      amount: payslip.sss_employer },
                { label: "PhilHealth Employer",amount: payslip.philhealth_employer },
                { label: "Pag-IBIG Employer", amount: payslip.pagibig_employer },
              ].filter(e => e.amount > 0).map(e => (
                <div key={e.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{e.label}</span>
                  <span className="font-medium">{fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Adjustment form */}
          {adjOpen && (
            <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
              <p className="font-semibold text-sm">Add Adjustment</p>
              <Select value={adjForm.category} onValueChange={v => setAdjForm(p => ({ ...p, category: v as "earning"|"deduction" }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="earning">Earning (adds to gross)</SelectItem>
                  <SelectItem value="deduction">Deduction (reduces net)</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Label (e.g. Performance bonus)" value={adjForm.label} onChange={e => setAdjForm(p => ({ ...p, label: e.target.value }))} />
              <Input type="number" placeholder="Amount ₱" value={adjForm.amount} onChange={e => setAdjForm(p => ({ ...p, amount: e.target.value }))} />
              <Input placeholder="Reason (required for audit trail)" value={adjForm.note} onChange={e => setAdjForm(p => ({ ...p, note: e.target.value }))} />
              <div className="flex gap-2">
                <Button size="sm" onClick={doAdj} disabled={acting} className="flex-1">
                  {acting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Add
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAdjOpen(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => onDownloadPdf(payslip.id)}>
                <Download className="h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={doEmail} disabled={acting}>
                {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Email
              </Button>
            </div>
            {payslip.status !== "paid" && payslip.status !== "cancelled" && (
              <div className="flex gap-2">
                {!adjOpen && (
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setAdjOpen(true)}>
                    Adjust
                  </Button>
                )}
                {payslip.status === "computed" && (
                  <Button size="sm" className="flex-1 gap-1" onClick={doApprove} disabled={acting}>
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Approve
                  </Button>
                )}
                {payslip.status === "approved" && (
                  <Button size="sm" className="flex-1 gap-1 bg-green-600 hover:bg-green-700" onClick={doPay} disabled={acting}>
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                    Mark Paid
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAYROLL SUMMARY TAB
// ═══════════════════════════════════════════════════════════════════════════

function SummaryTab({ summary, isLoading }: { summary: PayrollSummary | null; isLoading: boolean }) {
  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!summary)  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
      <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-3" />
      <p className="text-muted-foreground">No data. Compute payroll first.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Employees",       value: String(summary.total_employees), color: "text-foreground" },
          { label: "Total Gross Pay", value: fmt(summary.total_gross),        color: "text-green-600" },
          { label: "Total Deductions",value: fmt(summary.total_deductions),   color: "text-red-600"   },
          { label: "Total Net Pay",   value: fmt(summary.total_net),          color: "text-blue-700"  },
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
          <h3 className="font-semibold text-blue-900 text-sm">Government Remittance Summary</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              {["Contribution","Employee Share","Employer Share","Total"].map(h => (
                <th key={h} className={cn("px-5 py-3 font-semibold", h !== "Contribution" ? "text-right" : "text-left")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              ["SSS",        summary.total_sss_employee,        summary.total_sss_employer],
              ["PhilHealth", summary.total_philhealth_employee, summary.total_philhealth_employer],
              ["Pag-IBIG",   summary.total_pagibig_employee,    summary.total_pagibig_employer],
              ["BIR / Tax",  summary.total_bir,                 0],
            ].map(([label, emp, er]) => (
              <tr key={label as string} className="hover:bg-muted/20">
                <td className="px-5 py-3 font-medium">{label}</td>
                <td className="px-5 py-3 text-right">{fmt(emp as number)}</td>
                <td className="px-5 py-3 text-right">{er ? fmt(er as number) : "—"}</td>
                <td className="px-5 py-3 text-right font-semibold">{fmt((emp as number) + (er as number))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* By department */}
      {Object.keys(summary.by_department).length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">By Department</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>{["Department","Employees","Gross Pay","Net Pay"].map(h => <th key={h} className={cn("px-5 py-3 font-semibold", h !== "Department" ? "text-right" : "text-left")}>{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(summary.by_department).map(([dept, d]) => (
                <tr key={dept} className="hover:bg-muted/20">
                  <td className="px-5 py-3 font-medium">{dept}</td>
                  <td className="px-5 py-3 text-right">{d.count}</td>
                  <td className="px-5 py-3 text-right text-green-700">{fmt(d.gross)}</td>
                  <td className="px-5 py-3 text-right font-semibold">{fmt(d.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT TRAIL TAB
// ═══════════════════════════════════════════════════════════════════════════

const ACTION_STYLES: Record<string, string> = {
  computed:   "bg-amber-100 text-amber-700",
  adjusted:   "bg-purple-100 text-purple-700",
  approved:   "bg-blue-100 text-blue-700",
  paid:       "bg-green-100 text-green-700",
  email_sent: "bg-cyan-100 text-cyan-700",
  pdf_generated: "bg-indigo-100 text-indigo-700",
};

function AuditTab({ logs, isLoading }: { logs: AuditLog[]; isLoading: boolean }) {
  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (logs.length === 0) return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
      <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
      <p className="text-muted-foreground">No audit logs yet</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
        Immutable audit trail — records cannot be edited or deleted
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr>{["Timestamp","Action","Entity","By","Description"].map(h => <th key={h} className="px-4 py-3 text-left font-semibold text-xs">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-muted/20">
                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-2.5">
                  <Badge className={cn("text-xs border-0 capitalize", ACTION_STYLES[log.action] ?? "bg-gray-100 text-gray-700")}>
                    {log.action.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{log.entity_type} #{log.entity_id}</td>
                <td className="px-4 py-2.5 text-xs font-medium">{log.performer?.name ?? `#${log.performed_by}`}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-xs truncate">{log.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function Accounting() {
  const { toast } = useToast();
  const { user }  = useAuth();
  const role      = user?.role ?? "";
  const canManage = role === "Admin" || role === "Accountant" || role === "HR";

  const {
    periods, payslips, selectedPayslip, summary, auditLogs, isLoading, error,
    fetchPeriods, generateNextPeriod, fetchPayslips, fetchPayslip,
    computeAll, approvePayslip, markAsPaid, approveAll,
    fetchSummary, fetchAuditLogs,
    sendEmail, bulkSendEmail, downloadPdf, addAdjustment,
    clearSelected, clearError,
  } = useAccounting();

  const [activePeriodId, setActivePeriodId] = useState<number | null>(null);
  const [activeTab,      setActiveTab]      = useState("payslips");
  const [slipOpen,       setSlipOpen]       = useState(false);
  const [computing,      setComputing]      = useState(false);
  const [emailing,       setEmailing]       = useState(false);
  const [generating,     setGenerating]     = useState(false);
  const [approveAllLoading, setApproveAllLoading] = useState(false);
  const [createOpen,     setCreateOpen]     = useState(false);
  const [createForm,     setCreateForm]     = useState({ type: "semi_monthly", period_start: "", period_end: "", label: "" });

  const activePeriod = periods.find(p => p.id === activePeriodId);

  useEffect(() => { fetchPeriods(); }, []);

  useEffect(() => {
    if (periods.length > 0 && !activePeriodId) setActivePeriodId(periods[0].id);
  }, [periods]);

  useEffect(() => {
    if (!activePeriodId) return;
    fetchPayslips(activePeriodId);
    fetchSummary(activePeriodId);
    if (activeTab === "audit") fetchAuditLogs(activePeriodId);
  }, [activePeriodId]);

  useEffect(() => {
    if (activeTab === "audit" && activePeriodId) fetchAuditLogs(activePeriodId);
  }, [activeTab]);

  useEffect(() => {
    if (error) { toast({ title: error, variant: "destructive" }); clearError(); }
  }, [error]);

  const handleComputeAll = async () => {
    if (!activePeriodId) return;
    setComputing(true);
    try {
      const r = await computeAll(activePeriodId);
      toast({ title: `Payroll computed`, description: `${r.success.length} payslips generated. ${r.failed.length} failed.` });
      fetchSummary(activePeriodId);
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setComputing(false); }
  };

  const handleApproveAll = async () => {
    if (!activePeriodId) return;
    setApproveAllLoading(true);
    try {
      const r = await approveAll(activePeriodId);
      toast({ title: `${r.count} payslips approved` });
      fetchPeriods();
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setApproveAllLoading(false); }
  };

  const handleBulkEmail = async () => {
    if (!activePeriodId) return;
    setEmailing(true);
    try {
      const r = await bulkSendEmail(activePeriodId);
      toast({ title: `Emails sent`, description: `${r.sent_count} sent, ${r.failed_count} failed` });
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setEmailing(false); }
  };

  const handleGenerateNext = async () => {
    setGenerating(true);
    try {
      const p = await generateNextPeriod("semi_monthly");
      setActivePeriodId(p.id);
      toast({ title: `${p.label} created` });
    } catch (e) { toast({ title: e instanceof Error ? e.message : "Failed", variant: "destructive" }); }
    finally { setGenerating(false); }
  };

  const filteredPayslips = payslips.filter(p => !activePeriodId || p.payroll_period_id === activePeriodId);

  // Workflow steps
  const step2Done = activePeriod && ["computed","approved","paid"].includes(activePeriod.status);
  const step3Done = activePeriod && ["approved","paid"].includes(activePeriod.status);
  const step4Done = activePeriod?.status === "paid";

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounting & Payroll</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Payslip generation, approval workflow, statutory contributions</p>
        </div>

        {/* Workflow steps */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {[
            { n: 1, label: "Select Period",  done: !!activePeriod },
            { n: 2, label: "Compute",        done: !!step2Done },
            { n: 3, label: "Approve All",    done: !!step3Done },
            { n: 4, label: "Email Payslips", done: !!step4Done },
          ].map(({ n, label, done }, i, arr) => (
            <span key={n} className="flex items-center gap-1.5">
              <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all",
                done ? "bg-green-100 text-green-700" : n === (arr.find(x => !x.done)?.n) ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300" : "bg-muted text-muted-foreground")}>
                <span className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                  done ? "bg-green-500 text-white" : "bg-current text-background opacity-70")}>{done ? "✓" : n}</span>
                {label}
              </span>
              {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </span>
          ))}
        </div>

        {/* Period selector + actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Select value={activePeriodId ? String(activePeriodId) : ""} onValueChange={v => setActivePeriodId(Number(v))}>
              <SelectTrigger className="w-60"><SelectValue placeholder="Select pay period" /></SelectTrigger>
              <SelectContent>
                {periods.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    <span>{p.label}</span>
                    <Badge className={cn("ml-2 text-[10px] border-0", PERIOD_STATUS_STYLES[p.status])}>{p.status}</Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <Button variant="outline" size="sm" onClick={handleGenerateNext} disabled={generating} className="gap-1">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} New Period
            </Button>

            {canManage && !step2Done && (
              <Button size="sm" onClick={handleComputeAll} disabled={computing || !activePeriodId} className="gap-1">
                {computing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {computing ? "Computing…" : "Compute All"}
              </Button>
            )}
            {canManage && step2Done && !step3Done && (
              <Button size="sm" onClick={handleApproveAll} disabled={approveAllLoading} className="gap-1">
                {approveAllLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Approve All
              </Button>
            )}
            {canManage && step3Done && (
              <Button size="sm" variant="outline" onClick={handleBulkEmail} disabled={emailing} className="gap-1">
                {emailing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Email All
              </Button>
            )}

            {activePeriodId && (
              <Button variant="outline" size="sm" className="gap-1"
                onClick={() => window.open(`/api/payroll-periods/${activePeriodId}/summary-pdf`, "_blank")}>
                <Download className="h-4 w-4" /> PDF Report
              </Button>
            )}
          </div>
        </div>

        {/* Summary totals strip */}
        {filteredPayslips.length > 0 && (
          <div className="flex flex-wrap gap-5 px-4 py-3 bg-muted/40 rounded-xl border text-sm">
            <div><span className="text-muted-foreground text-xs">Employees</span><p className="font-semibold">{filteredPayslips.length}</p></div>
            <div><span className="text-muted-foreground text-xs">Total Gross</span><p className="font-semibold font-mono">{fmt(filteredPayslips.reduce((s, p) => s + p.gross_pay, 0))}</p></div>
            <div><span className="text-muted-foreground text-xs">Total Net Pay</span><p className="font-semibold font-mono text-green-700">{fmt(filteredPayslips.reduce((s, p) => s + p.net_pay, 0))}</p></div>
            <div className="ml-auto self-center">
              {activePeriod && <Badge className={cn("text-xs border-0 capitalize", PERIOD_STATUS_STYLES[activePeriod.status])}>{activePeriod.status}</Badge>}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          {/* Payslips tab */}
          <TabsContent value="payslips" className="mt-4">
            {isLoading && filteredPayslips.length === 0 ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filteredPayslips.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
                <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No payslips yet. Click "Compute All" to generate.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      {["Employee","Department","Days Worked","Gross Pay","Deductions","Net Pay","Status",""].map(h => (
                        <th key={h} className={cn("px-4 py-3 font-semibold text-xs", ["Gross Pay","Deductions","Net Pay"].includes(h) ? "text-right" : "text-left")}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPayslips.map(p => (
                      <tr key={p.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => { fetchPayslip(p.id).then(() => setSlipOpen(true)); }}>
                        <td className="px-4 py-2.5 font-medium">{p.employee?.first_name} {p.employee?.last_name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{p.employee?.department}</td>
                        <td className="px-4 py-2.5 text-center">{p.days_worked}/{p.working_days_in_period}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-green-700">{fmt(p.gross_pay)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-red-600">{fmt(p.total_deductions)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{fmt(p.net_pay)}</td>
                        <td className="px-4 py-2.5">
                          <Badge className={cn("text-xs border-0 capitalize", SLIP_STATUS_STYLES[p.status])}>{p.status}</Badge>
                          {p.email_sent && <span className="ml-1 text-[10px] text-cyan-600">✉</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); fetchPayslip(p.id).then(() => setSlipOpen(true)); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary"  className="mt-4"><SummaryTab summary={summary} isLoading={isLoading} /></TabsContent>
          <TabsContent value="audit"    className="mt-4"><AuditTab   logs={auditLogs}  isLoading={isLoading} /></TabsContent>
        </Tabs>

        {/* Payslip detail sheet */}
        <PayslipDetailSheet
          payslip={selectedPayslip}
          open={slipOpen}
          onClose={() => { setSlipOpen(false); clearSelected(); }}
          onApprove={async (id) => { await approvePayslip(id); }}
          onMarkPaid={async (id) => { await markAsPaid(id); }}
          onSendEmail={sendEmail}
          onDownloadPdf={downloadPdf}
          onAddAdjustment={addAdjustment}
        />
      </div>
    </DashboardLayout>
  );
}