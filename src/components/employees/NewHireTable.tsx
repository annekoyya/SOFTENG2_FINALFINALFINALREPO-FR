// src/components/employees/NewHireTable.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, Edit, Trash2, UserCheck, Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNewHires, getCompletionPct, type NewHire } from "@/hooks/useNewHires";
import { useAuth } from "@/hooks/useAuth";
import { NewHireForm } from "@/components/employees/NewHireForm";
import { NewHireDetailsModal } from "@/components/employees/NewHireDetailsModal";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onBack: () => void;
  onTransferred: () => void; // Refresh employee list after transfer
}

type View = "list" | "create" | "edit";

export function NewHireTable({ onBack, onTransferred }: Props) {
  const { toast }                   = useToast();
  const { isAdmin, isHR }           = useAuth();
  const {
    newHires, isLoading, transferMessage,
    fetchNewHires, createNewHire, updateNewHire, deleteNewHire,
    clearTransferMessage,
  } = useNewHires();

  const [view, setView]               = useState<View>("list");
  const [selected, setSelected]       = useState<NewHire | null>(null);
  const [deletingId, setDeletingId]   = useState<number | null>(null);
  const [modalOpen, setModalOpen]     = useState(false);
  const [selectedNewHireId, setSelectedNewHireId] = useState<number | null>(null);

  const canManage = isAdmin() || isHR();

  useEffect(() => { fetchNewHires(); }, []);

  // Show transfer toast whenever message changes
  useEffect(() => {
    if (!transferMessage) return;
    const isTransfer = transferMessage.includes("transferred");
    toast({
      title: isTransfer ? "🎉 Transferred to Employees!" : "Saved",
      description: transferMessage,
      variant: isTransfer ? "default" : "default",
    });
    if (isTransfer) onTransferred();
    clearTransferMessage();
  }, [transferMessage]);

  const handleCreate = async (data: Parameters<typeof createNewHire>[0]) => {
    await createNewHire(data);
    setView("list");
  };

  const handleUpdate = async (data: Parameters<typeof updateNewHire>[1]) => {
    if (!selected) return;
    await updateNewHire(selected.id, data);
    setView("list");
    setSelected(null);
  };

  const handleDelete = async (hire: NewHire) => {
    setDeletingId(hire.id);
    try {
      await deleteNewHire(hire.id);
      toast({ title: "Deleted", description: `${hire.first_name} ${hire.last_name} removed.` });
    } finally { setDeletingId(null); }
  };

  const handleTransferClick = (hire: NewHire) => {
    setSelectedNewHireId(hire.id);
    setModalOpen(true);
  };

  const handleTransferSuccess = () => {
    fetchNewHires();
    onTransferred();
  };

  if (view === "create" || view === "edit") {
    return (
      <NewHireForm
        initialData={view === "edit" ? selected ?? undefined : undefined}
        onSave={view === "create" ? handleCreate : handleUpdate}
        onCancel={() => { setView("list"); setSelected(null); }}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Employees
          </Button>
          <div className="h-4 w-px bg-border" />
          <h2 className="font-semibold text-lg">New Hires</h2>
          <Badge variant="secondary">{newHires.length}</Badge>
        </div>
        {canManage && (
          <Button onClick={() => setView("create")} className="gap-2">
            <Plus className="h-4 w-4" /> Add New Hire
          </Button>
        )}
      </div>

      {/* Info banner */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
        <span className="font-medium">Complete Details:</span> Click "Transfer" to fill in employee details and complete the onboarding process.
      </div>

      {/* Table */}
      {isLoading && newHires.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : newHires.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <UserCheck className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No pending new hires</p>
          {canManage && (
            <Button className="mt-4" onClick={() => setView("create")}>
              <Plus className="mr-2 h-4 w-4" /> Add New Hire
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Start Date</th>
                <th className="px-4 py-3 text-left font-semibold">Completion</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {newHires.map(hire => {
                const pct = getCompletionPct(hire);
                const isReady = hire.onboarding_status === "complete" || pct === 100;
                
                return (
                  <tr key={hire.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {hire.first_name} {hire.last_name}
                        {hire.name_extension ? ` ${hire.name_extension}` : ""}
                      </p>
                      {hire.job_category && (
                        <p className="text-xs text-muted-foreground">{hire.job_category}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{hire.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{hire.department ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {hire.start_date
                        ? new Date(hire.start_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <Progress value={pct} className={cn("h-2 w-32", pct === 100 ? "[&>div]:bg-green-500" : "")} />
                        <p className="text-xs text-muted-foreground">{pct}% complete</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-xs border", {
                        "bg-amber-100 text-amber-800 border-amber-200": hire.onboarding_status === "pending",
                        "bg-green-100 text-green-800 border-green-200": hire.onboarding_status === "complete",
                      })}>
                        {hire.onboarding_status === "pending" ? "Incomplete" : "Ready"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canManage && (
                          <>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                              onClick={() => { setSelected(hire); setView("edit"); }}
                              title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* Transfer Button - only show when ready */}
                            {isReady && (
                              <Button 
                                size="sm" 
                                className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleTransferClick(hire)}
                                title="Transfer to Employee"
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Transfer
                              </Button>
                            )}
                            <Button variant="ghost" size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(hire)}
                              disabled={deletingId === hire.id}
                              title="Delete">
                              {deletingId === hire.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Transfer Modal */}
      <NewHireDetailsModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedNewHireId(null);
        }}
        newHireId={selectedNewHireId!}
        onSuccess={handleTransferSuccess}
      />
    </div>
  );
}