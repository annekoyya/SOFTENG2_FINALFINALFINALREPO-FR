import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLeave } from "@/hooks/useLeave";
import LeaveBalanceCard from "@/components/leave/LeaveBalanceCard";
import LeaveRequestsTable from "@/components/leave/LeaveRequestsTable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Settings2 } from "lucide-react";

export default function Leave() {
  const { user } = useAuth();
  const { toast } = useToast();

  const canManage = ["Admin", "HR Manager", "Manager"].includes(user?.role ?? "");
  const isHR      = ["Admin", "HR Manager"].includes(user?.role ?? "");

  const {
    balances, requests, isLoading,
    fetchBalances, adjustBalance, runAccrual, runCarryOver,
    fetchRequests, approveRequest, rejectRequest, cancelRequest,
  } = useLeave();
  const [viewMode, setViewMode] = useState<"my" | "all">(canManage ? "all" : "my");
  const [runningAccrual, setRunningAccrual] = useState(false);
  const currentYear = new Date().getFullYear();
  const employeeId = (user as any)?.id ?? (user as any)?.employee_id;

  // Load on mount
  useEffect(() => {
    if (viewMode === "my") {
      fetchBalances(employeeId);
      fetchRequests({ employee_id: employeeId });
    } else {
      fetchBalances();
      fetchRequests();
    }
  }, [viewMode, fetchBalances, fetchRequests, employeeId]);

  const refresh = () => {
    if (viewMode === "my") {
      fetchBalances(employeeId);
      fetchRequests({ employee_id: employeeId });
    } else {
      fetchBalances();
      fetchRequests();
    }
  };

  const handleRunAccrual = async () => {
    setRunningAccrual(true);
    try {
      const res = await runAccrual();
      toast({ title: `Accrual complete — ${res.updated} balances updated.` });
      refresh();
    } catch {
      toast({ title: "Failed to run accrual.", variant: "destructive" });
    } finally { setRunningAccrual(false); }
  };

  const handleCarryOver = async () => {
    try {
      const res = await runCarryOver();
      toast({ title: `Carry-over complete — ${res.updated} employees updated.` });
      refresh();
    } catch {
      toast({ title: "Failed to run carry-over.", variant: "destructive" });
    }
  };

  // Group balances by employee for the "all employees" view
  const balancesByEmployee = balances.reduce<Record<number, typeof balances>>((acc, b) => {
    if (!acc[b.employee_id]) acc[b.employee_id] = [];
    acc[b.employee_id].push(b);
    return acc;
  }, {});

  const myBalances = balances.filter((b) => b.employee_id === employeeId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Leave management</h1>
        <div className="flex items-center gap-2">
          {canManage && (
            <div className="flex items-center gap-0.5 bg-muted/50 p-1 rounded-lg">
              {(["my", "all"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    viewMode === m
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "my" ? "My leaves" : "All employees"}
                </button>
              ))}
            </div>
          )}
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={refresh}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          {isHR && (
            <div className="flex items-center gap-1">
              <Button
                size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
                disabled={runningAccrual}
                onClick={handleRunAccrual}
              >
                <Settings2 className="w-3.5 h-3.5" />
                {runningAccrual ? "Running…" : "Run accrual"}
              </Button>
              <Button
                size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
                onClick={handleCarryOver}
              >
                Carry-over
              </Button>
            </div>
          )}
          {/* <FilLeaveButton onClick={() => setShowRequestForm(true)} /> */}
        </div>
      </div>

      {/* My balance (always shown for own user) */}
      {myBalances.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Your leave balance — {currentYear}
          </h2>
          <LeaveBalanceCard
            employeeName={user?.name ?? "You"}
            balances={myBalances}
            canAdjust={isHR}
            onAdjust={async (empId, type, adj, reason) => {
              await adjustBalance(empId, type, adj, reason);
              refresh();
            }}
          />
        </div>
      )}

      {/* All employees balances (HR / admin) */}
      {canManage && viewMode === "all" && Object.keys(balancesByEmployee).length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            All employee balances — {currentYear}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Object.entries(balancesByEmployee)
              .filter(([empId]) => parseInt(empId) !== employeeId)
              .map(([empId, empBalances]) => (
                <LeaveBalanceCard
                  key={empId}
                  employeeName={empBalances[0]?.employee_name ?? `Employee #${empId}`}
                  balances={empBalances}
                  canAdjust={isHR}
                  onAdjust={async (eId, type, adj, reason) => {
                    await adjustBalance(eId, type, adj, reason);
                    refresh();
                  }}
                />
              ))}
          </div>
        </div>
      )}

      {/* Leave requests */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          {viewMode === "my" ? "My leave requests" : "Leave requests"}
        </h2>
        <LeaveRequestsTable
          requests={requests}
          isLoading={isLoading}
          canManage={canManage}
          currentEmployeeId={employeeId}
          onApprove={approveRequest}
          onReject={rejectRequest}
          onCancel={cancelRequest}
          onRefresh={refresh}
        />
      </div>

      {/* <LeaveRequestForm
        open={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        balances={myBalances}
        onSubmit={async (payload: any) => {
          await submitRequest(payload);
          refresh();
        }}
      /> */}
    </div>
  );
}