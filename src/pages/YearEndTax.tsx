// src/pages/YearEndTax.tsx
import { useState, useEffect } from "react";
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
  FileText, Calculator, Download, AlertCircle, Loader2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TaxSummary {
  employee_id: number;
  employee_name: string;
  department: string;
  tin?: string;
  total_gross: number;
  total_basic: number;
  total_ot: number;
  total_allowances: number;
  thirteenth_month: number;     // computed: total_basic / 12
  total_deductions: number;
  total_tax_withheld: number;
  total_sss: number;
  total_philhealth: number;
  total_pagibig: number;
  taxable_compensation: number; // gross - non-taxable deductions
  annual_tax_due: number;       // from BIR table
  tax_balance: number;          // annual_tax_due - total_tax_withheld (+ = underpaid, - = overpaid)
  certificate_generated: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPHP(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function TaxBalanceBadge({ balance }: { balance: number }) {
  if (Math.abs(balance) < 1) return (
    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border rounded-full text-xs">Balanced</Badge>
  );
  if (balance > 0) return (
    <Badge className="bg-red-50 text-red-600 border-red-200 border rounded-full text-xs">
      Underpaid {formatPHP(balance)}
    </Badge>
  );
  return (
    <Badge className="bg-blue-50 text-blue-700 border-blue-200 border rounded-full text-xs">
      Overpaid {formatPHP(Math.abs(balance))}
    </Badge>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const YEARS = [2024, 2025, 2026, 2027];

export default function YearEndTax() {
  const { toast } = useToast();

  const [year,        setYear]        = useState(new Date().getFullYear());
  const [summaries,   setSummaries]   = useState<TaxSummary[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [processing,  setProcessing]  = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);

  const fetchSummaries = async () => {
    setLoading(true);
    try {
      const res  = await authFetch(`/api/year-end-tax?year=${year}`);
      setSummaries(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchSummaries(); }, [year]);

  // Run 13th month computation for the year
  const handleProcess13thMonth = async () => {
    setProcessing(true);
    try {
      const res  = await authFetch(`/api/year-end-tax/process-13th-month`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const data = await res.json();
      toast({ title: `13th month processed for ${data.count} employees.` });
      fetchSummaries();
    } catch {
      toast({ title: "Failed to process 13th month.", variant: "destructive" });
    } finally { setProcessing(false); }
  };

  // Download individual BIR 2316 certificate
  const handleDownloadCert = async (employeeId: number) => {
    setDownloading(employeeId);
    try {
      const res = await authFetch(
        `/api/reports/generate?report_type=tax_certificate&year=${year}&employee_id=${employeeId}`
      );
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `bir_2316_${year}_emp${employeeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Failed to download certificate.", variant: "destructive" });
    } finally { setDownloading(null); }
  };

  // Download all certificates
  const handleDownloadAll = async () => {
    try {
      const res = await authFetch(
        `/api/reports/generate?report_type=tax_certificate&year=${year}`
      );
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `bir_2316_${year}_all.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Failed to download.", variant: "destructive" });
    }
  };

  const totalTax        = summaries.reduce((s, r) => s + r.total_tax_withheld, 0);
  const total13th       = summaries.reduce((s, r) => s + r.thirteenth_month, 0);
  const underpaid       = summaries.filter((r) => r.tax_balance > 1).length;
  const overpaid        = summaries.filter((r) => r.tax_balance < -1).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">Year-end tax processing</h1>
        <div className="flex items-center gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="gap-1.5" disabled={processing}
            onClick={handleProcess13thMonth}>
            {processing
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Calculator className="w-3.5 h-3.5" />}
            {processing ? "Processing…" : "Compute 13th month"}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleDownloadAll}>
            <Download className="w-3.5 h-3.5" />Download all BIR 2316
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total employees",       value: summaries.length,           sub: "" },
          { label: "Total tax withheld",    value: formatPHP(totalTax),        sub: "this year" },
          { label: "Total 13th month pay",  value: formatPHP(total13th),       sub: "computed" },
          { label: "Adjustments needed",    value: `${underpaid}U / ${overpaid}O`, sub: "underpaid / overpaid" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-xl font-semibold mt-1">{c.value}</p>
            {c.sub && <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* Underpaid warning */}
      {underpaid > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {underpaid} employee{underpaid > 1 ? "s have" : " has"} underpaid tax — collect the difference in the December payslip.
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs text-muted-foreground font-medium">Employee</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">TIN</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-right">Total gross</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-right">13th month</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-right">Tax withheld</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-right">Annual tax due</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Balance</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-right">BIR 2316</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : summaries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-sm text-muted-foreground">
                  No payroll data for {year}.
                </TableCell>
              </TableRow>
            ) : summaries.map((r) => (
              <TableRow key={r.employee_id} className="text-sm hover:bg-muted/20">
                <TableCell className="font-medium">
                  {r.employee_name}
                  <span className="block text-xs text-muted-foreground">{r.department}</span>
                </TableCell>
                <TableCell className="font-mono text-xs">{r.tin ?? "—"}</TableCell>
                <TableCell className="text-right font-mono">{formatPHP(r.total_gross)}</TableCell>
                <TableCell className="text-right font-mono">{formatPHP(r.thirteenth_month)}</TableCell>
                <TableCell className="text-right font-mono">{formatPHP(r.total_tax_withheld)}</TableCell>
                <TableCell className="text-right font-mono">{formatPHP(r.annual_tax_due)}</TableCell>
                <TableCell><TaxBalanceBadge balance={r.tax_balance} /></TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 px-2 gap-1 text-muted-foreground hover:text-foreground"
                    disabled={downloading === r.employee_id}
                    onClick={() => handleDownloadCert(r.employee_id)}
                  >
                    {downloading === r.employee_id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <FileText className="w-3.5 h-3.5" />}
                    PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}