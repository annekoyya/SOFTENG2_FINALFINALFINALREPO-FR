// src/pages/Reports.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { authFetch } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign, Clock, Calendar, FileText,
  Timer, Shield, Download, Loader2, AlertCircle,
} from "lucide-react";
import { REPORT_META, type ReportMeta, type ReportFilter, type ReportType } from "@/types/reports";

// ── Icon map ─────────────────────────────────────────────────────────────────

const ICONS: Record<string, React.ElementType> = {
  dollar: DollarSign,
  clock:  Clock,
  calendar: Calendar,
  file:   FileText,
  timer:  Timer,
  shield: Shield,
};

// ── Types for filter data ─────────────────────────────────────────────────────

interface PayrollPeriod { id: number; label: string; }
interface Employee      { id: number; full_name: string; }

const MONTHS = [
  { v: 1,  l: "January"   }, { v: 2,  l: "February"  },
  { v: 3,  l: "March"     }, { v: 4,  l: "April"      },
  { v: 5,  l: "May"       }, { v: 6,  l: "June"       },
  { v: 7,  l: "July"      }, { v: 8,  l: "August"     },
  { v: 9,  l: "September" }, { v: 10, l: "October"    },
  { v: 11, l: "November"  }, { v: 12, l: "December"   },
];

const DEPARTMENTS = [
  "All", "Front Desk", "Housekeeping", "Food & Beverage",
  "Maintenance", "Security", "Sales & Marketing", "Finance", "HR", "IT", "Management",
];

const YEARS = [2024, 2025, 2026, 2027];

// ── Report card ───────────────────────────────────────────────────────────────

function ReportCard({
  meta, selected, onClick,
}: {
  meta: ReportMeta;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = ICONS[meta.icon] ?? FileText;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-4 transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border/60 bg-card hover:border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}>
          <Icon style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <p className={`text-sm font-medium ${selected ? "text-foreground" : "text-foreground"}`}>
            {meta.label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {meta.description}
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Filter panel ──────────────────────────────────────────────────────────────

function FilterPanel({
  meta,
  periods,
  employees,
  filters,
  onChange,
}: {
  meta: ReportMeta;
  periods: PayrollPeriod[];
  employees: Employee[];
  filters: Partial<ReportFilter>;
  onChange: (f: Partial<ReportFilter>) => void;
}) {
  const set = (key: string, val: any) => onChange({ ...filters, [key]: val });
  const cur = new Date();

  return (
    <div className="space-y-3">
      {meta.filters.includes("period") && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Payroll period</label>
          <Select
            value={String(filters.payroll_period_id ?? "")}
            onValueChange={(v) => set("payroll_period_id", parseInt(v))}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select period…" /></SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {meta.filters.includes("year") && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Year</label>
          <Select
            value={String(filters.year ?? cur.getFullYear())}
            onValueChange={(v) => set("year", parseInt(v))}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {meta.filters.includes("month") && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Month</label>
          <Select
            value={String(filters.month ?? cur.getMonth() + 1)}
            onValueChange={(v) => set("month", parseInt(v))}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => <SelectItem key={m.v} value={String(m.v)}>{m.l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {meta.filters.includes("employee") && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Employee</label>
          <Select
            value={String(filters.employee_id ?? "all")}
            onValueChange={(v) => set("employee_id", v === "all" ? undefined : parseInt(v))}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All employees" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>{e.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {meta.filters.includes("department") && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Department</label>
          <Select
            value={filters.department ?? "All"}
            onValueChange={(v) => set("department", v === "All" ? undefined : v)}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { generating, error, generatePDF } = useReports();

  const [periods,   setPeriods]   = useState<PayrollPeriod[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected,  setSelected]  = useState<ReportType>("payroll_register");
  const [filters,   setFilters]   = useState<Partial<ReportFilter>>({
    year:  new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const role        = user?.role ?? "";
  const visibleMeta = REPORT_META.filter((m) => m.roles.includes(role));
  const activeMeta  = visibleMeta.find((m) => m.type === selected) ?? visibleMeta[0];

  useEffect(() => {
    authFetch("/api/payroll-periods").then((r) => r.json()).then((data) => {
      setPeriods(data.map((p: any) => ({ id: p.id, label: p.label ?? `Period #${p.id}` })));
    }).catch(() => {});

    authFetch("/api/employees").then((r) => r.json()).then((data) => {
      setEmployees(data.map((e: any) => ({
        id: e.id,
        full_name: `${e.first_name} ${e.last_name}`,
      })));
    }).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!activeMeta) return;

    // Basic validation
    if (activeMeta.filters.includes("period") && !filters.payroll_period_id) {
      toast({ title: "Please select a payroll period.", variant: "destructive" }); return;
    }

    await generatePDF({ report_type: activeMeta.type, ...filters });

    if (!error) {
      toast({ title: `${activeMeta.label} downloaded.` });
    } else {
      toast({ title: error, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Reports</h1>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Report cards */}
        <div className="grid sm:grid-cols-2 gap-3 content-start">
          {visibleMeta.map((meta) => (
            <ReportCard
              key={meta.type}
              meta={meta}
              selected={selected === meta.type}
              onClick={() => setSelected(meta.type)}
            />
          ))}
        </div>

        {/* Filter + generate panel */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-5 h-fit">
          {activeMeta && (
            <>
              <div>
                <p className="text-sm font-medium">{activeMeta.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activeMeta.description}</p>
              </div>

              <FilterPanel
                meta={activeMeta}
                periods={periods}
                employees={employees}
                filters={filters}
                onChange={setFilters}
              />

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                className="w-full gap-2"
                disabled={generating}
                onClick={handleGenerate}
              >
                {generating
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
                  : <><Download className="w-4 h-4" />Download PDF</>
                }
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                PDF will download automatically to your browser.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}