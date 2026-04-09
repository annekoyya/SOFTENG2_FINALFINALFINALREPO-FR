// src/components/employees/NewHireTab.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/hooks/api";
import { Loader2, UserPlus, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewHire {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  department: string | null;
  job_category: string | null;
  onboarding_status: "pending" | "complete" | "transferred";
  training_program: string | null;
  created_at: string;
}

const statusColors = {
  pending:     "bg-yellow-100 text-yellow-700",
  complete:    "bg-green-100 text-green-700",
  transferred: "bg-blue-100 text-blue-700",
};

export function NewHireTab() {
  const { toast }           = useToast();
  const [hires, setHires]   = useState<NewHire[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState<number | null>(null);

  const fetchHires = async () => {
    setLoading(true);
    try {
      const res  = await authFetch("/api/new-hires");
      const body = await res.json();
      // Guard: API might return paginated object
      const data = body.data;
      setHires(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      setHires([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchHires(); }, []);

  const handleTransfer = async (hire: NewHire) => {
    setTransferring(hire.id);
    try {
      const res  = await authFetch(`/api/new-hires/${hire.id}/transfer`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Transfer failed");
      toast({ title: "Transferred to Employee", description: `${hire.first_name} ${hire.last_name} is now an employee.` });
      fetchHires();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Transfer failed", variant: "destructive" });
    } finally { setTransferring(null); }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (hires.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
        <UserPlus className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="font-medium text-muted-foreground">No new hires yet</p>
        <p className="text-sm text-muted-foreground mt-1">New hires come from the Recruitment pipeline when an offer is accepted</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Name</th>
            <th className="px-4 py-3 text-left font-semibold">Department</th>
            <th className="px-4 py-3 text-left font-semibold">Job Category</th>
            <th className="px-4 py-3 text-left font-semibold">Training Program</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {hires.map(hire => (
            <tr key={hire.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium">{hire.first_name} {hire.last_name}</p>
                <p className="text-xs text-muted-foreground">{hire.email}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{hire.department ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{hire.job_category ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{hire.training_program ?? "—"}</td>
              <td className="px-4 py-3">
                <Badge className={cn("text-xs border-0 capitalize", statusColors[hire.onboarding_status])}>
                  {hire.onboarding_status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                {hire.onboarding_status !== "transferred" ? (
                  <Button
                    size="sm" variant="outline"
                    className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    disabled={transferring === hire.id}
                    onClick={() => handleTransfer(hire)}
                  >
                    {transferring === hire.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <UserPlus className="h-3.5 w-3.5" />}
                    Transfer to Employee
                  </Button>
                ) : (
                  <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Transferred
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}