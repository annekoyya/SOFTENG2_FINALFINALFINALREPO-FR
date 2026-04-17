// src/components/employees/NewHireTab.tsx
// FIX #1: "Transfer" button opens NewHireDetailsModal instead of transferring immediately
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/hooks/api";
import { Loader2, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { NewHireDetailsModal } from "./NewHireDetailsModal";
import { cn } from "@/lib/utils";

interface NewHire {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  department: string | null;
  job_category: string | null;
  onboarding_status: "pending" | "complete" | "transferred";
  completed_fields?: string[];
  created_at: string;
}

const STATUS_COLORS = {
  pending:     "bg-yellow-100 text-yellow-700",
  complete:    "bg-green-100 text-green-700",
  transferred: "bg-blue-100 text-blue-700",
};

// Required fields for completion check
const REQUIRED_FIELDS = [
  "first_name", "last_name", "date_of_birth", "email",
  "phone_number", "home_address",
  "emergency_contact_name", "emergency_contact_number", "relationship",
  "start_date", "department", "job_category", "basic_salary", "shift_sched",
];

function getCompletionPct(hire: NewHire): number {
  if (hire.onboarding_status === "transferred" || hire.onboarding_status === "complete") return 100;
  if (!hire.completed_fields || hire.completed_fields.length === 0) return 5; // minimal — just name+email
  const filled = hire.completed_fields.filter(f => REQUIRED_FIELDS.includes(f)).length;
  return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

export function NewHireTab() {
  const { toast } = useToast();
  const [hires,       setHires]       = useState<NewHire[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [selectedId,  setSelectedId]  = useState<number | null>(null);

  const fetchHires = async () => {
    setLoading(true);
    try {
      const res  = await authFetch("/api/new-hires");
      const body = await res.json();
      const data = body.data;
      setHires(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      setHires([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchHires(); }, []);

  // FIX #1: clicking Transfer opens modal, not immediate transfer
  const handleClickTransfer = (hire: NewHire) => {
    setSelectedId(hire.id);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    toast({ title: "Success!", description: "Employee transferred and account created." });
    fetchHires();
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (hires.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
        <UserPlus className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="font-medium text-muted-foreground">No new hires yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          New hires appear here after training is completed in the Recruitment module
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Click an employee's name or the Transfer button to fill in required details before transferring.
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Progress</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {hires.map(hire => {
                const pct = getCompletionPct(hire);
                return (
                  <tr key={hire.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        className="text-left hover:underline font-medium"
                        onClick={() => handleClickTransfer(hire)}
                      >
                        {hire.first_name} {hire.last_name}
                      </button>
                      <p className="text-xs text-muted-foreground">{hire.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{hire.department ?? "—"}</td>
                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={pct}
                          className={cn("h-2 flex-1", pct === 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-amber-500")}
                        />
                        <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-xs border-0 capitalize", STATUS_COLORS[hire.onboarding_status])}>
                        {hire.onboarding_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hire.onboarding_status !== "transferred" ? (
                        <Button
                          size="sm" variant="outline"
                          className={cn(
                            "gap-1 text-xs",
                            pct === 100
                              ? "text-green-700 border-green-200 hover:bg-green-50"
                              : "text-amber-700 border-amber-200 hover:bg-amber-50"
                          )}
                          onClick={() => handleClickTransfer(hire)}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          {pct === 100 ? "Transfer" : "Complete Details"}
                        </Button>
                      ) : (
                        <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Transferred
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FIX #1: modal opens BEFORE transfer happens */}
      <NewHireDetailsModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedId(null); }}
        newHireId={selectedId}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}