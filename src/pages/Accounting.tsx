// src/pages/Accounting.tsx
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounting } from "@/hooks/useAccounting";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PayslipTable } from "@/components/accounting/PayslipTable";
import { PayslipDrawer } from "@/components/accounting/PayslipDrawer";
import { PayrollSummaryTab } from "@/components/accounting/PayrollSummaryTab";
import { AuditTrailTab } from "@/components/accounting/AuditTrailTab";
import AccountantPayslipFlow from "@/components/accounting/AccountantPayslipFlow";
import {
  Plus, Play, Mail, Download, Loader2,
  CalendarDays, Users, TrendingUp, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  open:       "bg-gray-100 text-gray-700",
  processing: "bg-blue-100 text-blue-700",
  computed:   "bg-amber-100 text-amber-700",
  approved:   "bg-green-100 text-green-700",
  paid:       "bg-emerald-100 text-emerald-700",
};

export default function Accounting() {
  const { toast }              = useToast();
  const { user }               = useAuth();  // Ensure user is authenticated
  const {
    periods, payslips, selectedPayslip, summary, auditLogs, isLoading,
    fetchPeriods, generateNextPeriod,
    fetchPayslips, fetchPayslip, computeAll,
    approvePayslip, markPaid, addAdjustment,
    sendEmail, bulkSendEmail,
    fetchSummary, fetchAuditLogs,
    setSelectedPayslip,
  } = useAccounting();

  const [activePeriodId, setActivePeriodId] = useState<number | null>(null);
  const [activeTab, setActiveTab]           = useState("payslips");
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [computing, setComputing]           = useState(false);
  const [bulkEmailing, setBulkEmailing]     = useState(false);
  const [generatingPeriod, setGeneratingPeriod] = useState(false);

  const activePeriod = periods.find(p => p.id === activePeriodId) ?? null;

  useEffect(() => {
    fetchPeriods();
  }, []);

  // Auto-select first period
  useEffect(() => {
    if (periods.length > 0 && !activePeriodId) {
      setActivePeriodId(periods[0].id);
    }
  }, [periods]);

  // Load data when period changes
  useEffect(() => {
    if (!activePeriodId) return;
    fetchPayslips(activePeriodId);
    fetchSummary(activePeriodId);
    if (activeTab === "audit") fetchAuditLogs(activePeriodId);
  }, [activePeriodId]);

  useEffect(() => {
    if (activeTab === "audit" && activePeriodId) fetchAuditLogs(activePeriodId);
  }, [activeTab]);

  const handleGeneratePeriod = async () => {
    setGeneratingPeriod(true);
    try {
      const period = await generateNextPeriod("semi_monthly");
      setActivePeriodId(period.id);
      toast({ title: "Period Created", description: `${period.label} is ready.` });
    } catch {
      toast({ title: "Error", description: "Failed to generate period.", variant: "destructive" });
    } finally { setGeneratingPeriod(false); }
  };

  const handleComputeAll = async () => {
    if (!activePeriodId) return;
    setComputing(true);
    try {
      const result = await computeAll(activePeriodId);
      toast({
        title: "Payroll Computed",
        description: `${result.success_count} payslips generated. ${result.failed_count > 0 ? `${result.failed_count} failed.` : ""}`,
      });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally { setComputing(false); }
  };

  const handleBulkEmail = async () => {
    if (!activePeriodId) return;
    setBulkEmailing(true);
    try {
      const result = await bulkSendEmail(activePeriodId);
      toast({
        title: "Emails Sent",
        description: `${result.sent_count} payslips emailed. ${result.failed_count > 0 ? `${result.failed_count} failed.` : ""}`,
      });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed.", variant: "destructive" });
    } finally { setBulkEmailing(false); }
  };

  const handleViewPayslip = async (id: number) => {
    await fetchPayslip(id);
    setDrawerOpen(true);
  };

  const handleDownloadSummaryPdf = () => {
    if (!activePeriodId) return;
    window.open(`/api/payroll-periods/${activePeriodId}/summary-pdf`, "_blank");
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalEmployees = payslips.length;
  const totalGross     = payslips.reduce((s, p) => s + p.gross_pay, 0);
  const totalNet       = payslips.reduce((s, p) => s + p.net_pay, 0);
  const paidCount      = payslips.filter(p => p.status === "paid").length;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Accounting</h1>
          <p className="text-muted-foreground mt-1">Payroll management & payslip generation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGeneratePeriod} disabled={generatingPeriod}>
            {generatingPeriod ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            New Period
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadSummaryPdf} disabled={!activePeriodId}>
            <Download className="mr-2 h-4 w-4" /> Summary PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkEmail} disabled={bulkEmailing || !activePeriodId}>
            {bulkEmailing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Bulk Email
          </Button>
          <Button onClick={handleComputeAll} disabled={computing || !activePeriodId} className="gap-2">
            {computing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {computing ? "Computing..." : "Compute All"}
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Pay Period:</span>
        </div>
        <Select
          value={activePeriodId ? String(activePeriodId) : ""}
          onValueChange={v => setActivePeriodId(Number(v))}
        >
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
          <Badge className={cn("text-xs border", statusStyles[activePeriod.status])}>
            {activePeriod.status.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Stats Row */}
      {activePeriod && (
        <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
          {[
            { label: "Employees", value: totalEmployees, icon: Users, color: "text-blue-600" },
            { label: "Total Gross", value: `₱${(totalGross / 1000).toFixed(1)}k`, icon: TrendingUp, color: "text-green-600" },
            { label: "Total Net Pay", value: `₱${(totalNet / 1000).toFixed(1)}k`, icon: TrendingUp, color: "text-emerald-600" },
            { label: "Paid", value: `${paidCount}/${totalEmployees}`, icon: FileText, color: "text-amber-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                <Icon className={cn("h-4 w-4", color)} />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Section - Accountant Flow or Regular Tabs */}
      {user?.role === "Accountant" ? (
        <div className="mt-6">
          <AccountantPayslipFlow periods={periods as any} onRefreshPeriods={fetchPeriods} />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="payslips" className="mt-6">
            <PayslipTable
              payslips={payslips}
              isLoading={isLoading}
              onView={handleViewPayslip}
              onApprove={async (id) => {
                await approvePayslip(id);
                toast({ title: "Approved", description: "Payslip approved." });
              }}
              onMarkPaid={async (id) => {
                await markPaid(id);
                toast({ title: "Paid", description: "Payslip marked as paid." });
              }}
              onSendEmail={async (id) => {
                const msg = await sendEmail(id);
                toast({ title: "Email Sent", description: msg });
              }}
            />
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <PayrollSummaryTab summary={summary} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <AuditTrailTab logs={auditLogs} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      )}

      {/* Payslip Detail Drawer */}
      <PayslipDrawer
        payslip={selectedPayslip}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedPayslip(null); }}
        onAddAdjustment={async (id, adjustment) => { await addAdjustment(id, adjustment as any); }}
        onApprove={approvePayslip}
        onMarkPaid={markPaid}
        onSendEmail={async (id) => { await sendEmail(id); }}
        onDownloadPdf={(id: number) => window.open(`/api/payslips/${id}/pdf`, "_blank")}
      />
    </DashboardLayout>
  );
}