import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/hooks/useAuth";
import { Employee } from "@/types/employee";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Archive, RotateCcw, Trash2, AlertTriangle } from "lucide-react";

type ViewMode = "list" | "view";

export default function ArchivedEmployees() {
  const { employees, restoreEmployee, purgeEmployee } = useEmployees();
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [employeeToRestore, setEmployeeToRestore] = useState<Employee | null>(null);
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);
  const [employeeToPurge, setEmployeeToPurge] = useState<Employee | null>(null);

  // Filter archived employees - those with deleted_at timestamp (soft deleted)
  const archivedEmployees = employees.filter((emp) => emp.deleted_at !== null);

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewMode("view");
  };

  const handleRestore = (employee: Employee) => {
    setEmployeeToRestore(employee);
    setRestoreDialogOpen(true);
  };

  const handlePurge = (employee: Employee) => {
    setEmployeeToPurge(employee);
    setPurgeDialogOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (employeeToRestore) {
      await restoreEmployee(employeeToRestore.id);
      setRestoreDialogOpen(false);
      setEmployeeToRestore(null);
      setViewMode("list");
    }
  };

  const handleConfirmPurge = async () => {
    if (employeeToPurge) {
      await purgeEmployee(employeeToPurge.id);
      setPurgeDialogOpen(false);
      setEmployeeToPurge(null);
      setViewMode("list");
    }
  };

  const handleCloseSheet = () => {
    setViewMode("list");
    setSelectedEmployee(null);
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-3">
              <Archive className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold text-foreground">
                Archived Employees
              </h1>
              <p className="mt-1 text-muted-foreground">
                View and manage deleted employee records
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {archivedEmployees.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-4">
              <Archive className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No Archived Employees
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            There are no archived employees at this time. Deleted employee records
            will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <EmployeeTable
            employees={archivedEmployees}
            onView={handleView}
            onEdit={() => {}} // Archived employees can't be edited
            onArchive={() => {}} // No archive action for archived employees
            onSearch={() => {}}
            onFilter={() => {}}
            isLoading={false}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* View Details Sheet */}
      <Sheet open={viewMode === "view"} onOpenChange={handleCloseSheet}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Employee Details</SheetTitle>
          </SheetHeader>
          {selectedEmployee && (
            <div className="mt-6 space-y-6">
              {/* Display employee basic info */}
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <h3 className="font-semibold mb-2">Employee Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {selectedEmployee.email}</p>
                    <p><span className="text-muted-foreground">Department:</span> {selectedEmployee.department || 'N/A'}</p>
                    <p><span className="text-muted-foreground">Position:</span> {selectedEmployee.job_category || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Archived Info */}
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">
                      Archived Record
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This employee record has been archived. You can restore or permanently delete this record.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-border pt-6">
                <Button
                  variant="default"
                  onClick={() => {
                    handleRestore(selectedEmployee);
                    handleCloseSheet();
                  }}
                  className="flex-1"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore Employee
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handlePurge(selectedEmployee);
                    handleCloseSheet();
                  }}
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Permanently Delete
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore{" "}
              <span className="font-semibold text-foreground">
                {employeeToRestore?.first_name} {employeeToRestore?.last_name}
              </span>
              ? This will move the employee record back to the active employees
              list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestore}
              className="flex-1 bg-success hover:bg-success/90"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={purgeDialogOpen} onOpenChange={setPurgeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete Employee?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You are about to permanently delete
              the employee record for{" "}
              <span className="font-semibold text-foreground">
                {employeeToPurge?.first_name} {employeeToPurge?.last_name}
              </span>
              . All associated data will be removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This will permanently remove all records
              including documents, attendance history, and other associated data.
            </p>
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPurge}
              className="flex-1 bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Permanently Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}