import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOvertime } from "@/hooks/useOvertime";
import OvertimeTable from "@/components/overtime/OvertimeTable";
import OvertimeRequestForm, { FileOvertimeButton } from "@/components/overtime/OvertimeRequestForm";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, CheckCircle, AlertCircle, DollarSign } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border/60 p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon style={{ width: 18, height: 18 }} />
      </div>
      <div>
        <p className="text-lg font-semibold leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function Overtime() {
  const { user } = useAuth();
  const canManage = ["Admin", "HR Manager", "Manager"].includes(user?.role ?? "");

  const {
    requests, stats, isLoading,
    fetchRequests, fetchStats, submitRequest, approve, reject,
  } = useOvertime();

  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"my" | "all">(canManage ? "all" : "my");
  const employeeId = (user as any)?.id ?? (user as any)?.employee_id;

  const refresh = () => {
    fetchRequests(viewMode === "my" ? { employee_id: employeeId } : undefined);
    fetchStats();
  };

  useEffect(() => { refresh(); }, [viewMode]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Overtime</h1>
        <div className="flex items-center gap-2">
          {canManage && (
            <div className="flex items-center gap-0.5 bg-muted/50 p-1 rounded-lg">
              {(["my","all"] as const).map((m) => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === m ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {m === "my" ? "My requests" : "All employees"}
                </button>
              ))}
            </div>
          )}
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={refresh}>
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </Button>
          <FileOvertimeButton onClick={() => setShowForm(true)} />
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={AlertCircle}   label="Pending approval" value={stats.pending_count}
            color="bg-amber-50 text-amber-600" />
          <StatCard icon={CheckCircle}   label="Approved this month" value={stats.approved_this_month}
            color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={Clock}         label="Total hours this month"
            value={`${stats.total_hours_this_month.toFixed(1)} hrs`}
            color="bg-blue-50 text-blue-600" />
          <StatCard icon={DollarSign}    label="Estimated OT pay"
            value={`₱${stats.total_amount_this_month.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`}
            color="bg-violet-50 text-violet-600" />
        </div>
      )}

      <OvertimeTable
        requests={requests}
        isLoading={isLoading}
        canManage={canManage}
        onApprove={approve}
        onReject={reject}
        onRefresh={refresh}
      />

      <OvertimeRequestForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={async (data) => { await submitRequest(data); refresh(); }}
      />
    </div>
  );
}