// src/pages/Employees.tsx
import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { EmployeeDetails } from "@/components/employees/EmployeeDetails";
import { NewHireTab } from "@/components/employees/NewHireTab";
import { RotateCcw, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/employee";

export default function Employees() {
  const { toast }         = useToast();
  const { user }          = useAuth();
  const isAdmin           = user?.role === "Admin";

  const {
    employees, archivedEmployees, isLoading,
    fetchEmployees, fetchArchived,
    createEmployee, updateEmployee,
    archiveEmployee, restoreEmployee, purgeEmployee,
  } = useEmployees();

  const [tab, setTab]                           = useState("directory");
  const [viewEmp,  setViewEmp]                  = useState<Employee | null>(null);
  const [editEmp,  setEditEmp]                  = useState<Employee | null>(null);
  const [archiveTarget, setArchiveTarget]       = useState<Employee | null>(null);
  const [purgeTarget, setPurgeTarget]           = useState<Employee | null>(null);
  const [formOpen, setFormOpen]                 = useState(false);
  const [filters, setFilters]                   = useState({ search: "", status: "" });

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { if (tab === "archived") fetchArchived(); }, [tab]);

  const applyFilters = useCallback((overrides: Partial<typeof filters> = {}) => {
    const merged = { ...filters, ...overrides };
    setFilters(merged);
    fetchEmployees(merged);
  }, [filters, fetchEmployees]);

  const handleEdit = (emp: Employee) => {
    setEditEmp(emp);
    setViewEmp(null);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: Parameters<typeof createEmployee>[0]) => {
    if (editEmp) {
      await updateEmployee(editEmp.id, data);
      toast({ title: "Employee updated" });
    } else {
      await createEmployee(data);
      toast({ title: "Employee created" });
    }
    setFormOpen(false);
    setEditEmp(null);
    fetchEmployees(filters);
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    await archiveEmployee(archiveTarget.id);
    toast({ title: "Employee archived", description: `${archiveTarget.first_name} ${archiveTarget.last_name} has been archived.` });
    setArchiveTarget(null);
    fetchEmployees(filters);
  };

  const confirmPurge = async () => {
    if (!purgeTarget) return;
    await purgeEmployee(purgeTarget.id);
    toast({ title: "Employee permanently deleted" });
    setPurgeTarget(null);
    fetchArchived();
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-1">
            {employees.length} active employee{employees.length !== 1 ? "s" : ""}
          </p>
        </div>
        {/* NOTE: No "Add Employee" button — employees come from New Hire pipeline */}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="directory">
            Employee Directory
            <Badge className="ml-2 text-xs bg-blue-100 text-blue-700 border-0">{employees.length}</Badge>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="new-hires">New Hires</TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="archived">
              Archived
              {archivedEmployees.length > 0 && (
                <Badge className="ml-2 text-xs bg-red-100 text-red-700 border-0">{archivedEmployees.length}</Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Directory ──────────────────────────────────────────────────────── */}
        <TabsContent value="directory" className="mt-6">
          <EmployeeTable
            employees={employees}
            isLoading={isLoading}
            isAdmin={isAdmin}
            onView={setViewEmp}
            onEdit={handleEdit}
            onArchive={setArchiveTarget}
            onSearch={s => applyFilters({ search: s })}
            onFilter={status => applyFilters({ status })}
          />
        </TabsContent>

        {/* ── New Hires (Admin only) ─────────────────────────────────────────── */}
        {isAdmin && (
          <TabsContent value="new-hires" className="mt-6">
            <NewHireTab />
          </TabsContent>
        )}

        {/* ── Archived (Admin only) ─────────────────────────────────────────── */}
        {isAdmin && (
          <TabsContent value="archived" className="mt-6">
            {isLoading && archivedEmployees.length === 0 ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : archivedEmployees.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">No archived employees</div>
            ) : (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Employee</th>
                      <th className="px-4 py-3 text-left font-semibold">Department</th>
                      <th className="px-4 py-3 text-left font-semibold">Archived On</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {archivedEmployees.map(emp => (
                      <tr key={emp.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{emp.department}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {emp.deleted_at ? new Date(emp.deleted_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="gap-1 text-green-700 border-green-200 hover:bg-green-50"
                              onClick={() => restoreEmployee(emp.id).then(() => {
                                toast({ title: "Employee restored" });
                                fetchArchived(); fetchEmployees(filters);
                              })}>
                              <RotateCcw className="h-3.5 w-3.5" /> Restore
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setPurgeTarget(emp)}>
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* ── Employee Detail Sheet ─────────────────────────────────────────────── */}
      <EmployeeDetails
        employee={viewEmp}
        open={!!viewEmp}
        onClose={() => setViewEmp(null)}
        onEdit={handleEdit}
        onArchive={setArchiveTarget}
        isAdmin={isAdmin}
      />

      {/* ── Edit/Create Dialog ────────────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={v => { setFormOpen(v); if (!v) setEditEmp(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editEmp ? "Edit Employee" : "New Employee"}</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            employee={editEmp}
            onSubmit={handleFormSubmit}
            onCancel={() => { setFormOpen(false); setEditEmp(null); }}
            isAdmin={isAdmin}
          />
        </DialogContent>
      </Dialog>

      {/* ── Archive Confirm ───────────────────────────────────────────────────── */}
      <AlertDialog open={!!archiveTarget} onOpenChange={() => setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive employee?</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget?.first_name} {archiveTarget?.last_name} will be archived and removed from active lists.
              You can restore them later from the Archived tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive} className="bg-red-600 hover:bg-red-700">Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Purge Confirm ─────────────────────────────────────────────────────── */}
      <AlertDialog open={!!purgeTarget} onOpenChange={() => setPurgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {purgeTarget?.first_name} {purgeTarget?.last_name} and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPurge} className="bg-red-600 hover:bg-red-700">Delete Forever</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}