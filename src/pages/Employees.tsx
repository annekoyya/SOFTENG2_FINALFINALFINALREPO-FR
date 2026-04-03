// src/pages/Employees.tsx
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { EmployeeDetails } from "@/components/employees/EmployeeDetails";
import { DeleteEmployeeDialog } from "@/components/employees/DeleteEmployeeDialog";
import NewHireTab from "@/components/employees/NewHireTab";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/hooks/useAuth";
import type { Employee } from "@/types/employee";
import { EmployeeFormData } from "@/types/employee";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { UserPlus } from "lucide-react";

type ViewMode = "list" | "add" | "edit" | "view";

export default function Employees() {
  const {
    employees,
    archivedEmployees,
    isLoading,
    fetchEmployees,
    fetchArchivedEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    restoreEmployee,
    purgeEmployee,
  } = useEmployees();

  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [viewMode, setViewMode]                   = useState<ViewMode>("list");
  const [activeTab, setActiveTab]                 = useState("employees");
  const [selectedEmployee, setSelectedEmployee]   = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen]   = useState(false);
  const [employeeToDelete, setEmployeeToDelete]   = useState<Employee | null>(null);
  const [purgeDialogOpen, setPurgeDialogOpen]     = useState(false);
  const [employeeToPurge, setEmployeeToPurge]     = useState<Employee | null>(null);
  const [showArchived, setShowArchived]           = useState(false);

  // Load data on mount and when toggling archived view
  useEffect(() => {
    if (showArchived) {
      fetchArchivedEmployees();
    } else {
      fetchEmployees();
    }
  }, [showArchived, fetchEmployees, fetchArchivedEmployees]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewMode("view");
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewMode("edit");
  };

  const handleDelete = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const handlePurge = (employee: Employee) => {
    setEmployeeToPurge(employee);
    setPurgeDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (employeeToDelete) {
      await deleteEmployee(employeeToDelete.id);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleConfirmPurge = async () => {
    if (employeeToPurge) {
      await purgeEmployee(employeeToPurge.id);
      setPurgeDialogOpen(false);
      setEmployeeToPurge(null);
    }
  };

  const handleAddEmployee = async (data: EmployeeFormData) => {
    await addEmployee(data);
    setViewMode("list");
  };

  const handleUpdateEmployee = async (data: EmployeeFormData) => {
    if (selectedEmployee) {
      await updateEmployee(selectedEmployee.id, data);
      setViewMode("list");
      setSelectedEmployee(null);
    }
  };

  const handleCloseForm = () => {
    setViewMode("list");
    setSelectedEmployee(null);
  };

  // Fix: use deleted_at instead of archived boolean
  const displayedEmployees = showArchived ? archivedEmployees : employees;

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Employee Directory
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage all employee records and information
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${isAdmin ? "grid-cols-2" : "grid-cols-1"}`}>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          {isAdmin && <TabsTrigger value="new-hires">New Hires</TabsTrigger>}
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          {/* Active / Archived Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  !showArchived ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"
                }`}
                onClick={() => setShowArchived(false)}
              >
                Active
              </button>
              <button
                className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  showArchived ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"
                }`}
                onClick={() => setShowArchived(true)}
              >
                Archived
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {showArchived ? "Viewing archived employees" : `${employees.length} active employees`}
            </p>
          </div>

          <EmployeeTable
            employees={displayedEmployees}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isArchivedView={showArchived}
            onRestore={async (emp) => await restoreEmployee(emp.id)}
            onPurge={(emp) => handlePurge(emp)}
            isAdmin={isAdmin}
          />
        </TabsContent>

        {/* New Hires Tab - Admin only */}
        {isAdmin && (
          <TabsContent value="new-hires">
            <NewHireTab />
          </TabsContent>
        )}
      </Tabs>

      {/* Add Employee Dialog */}
      <Dialog open={viewMode === "add"} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add New Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm onSubmit={handleAddEmployee} onCancel={handleCloseForm} isLoading={isLoading} />
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={viewMode === "edit"} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Employee</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeForm employee={selectedEmployee} onSubmit={handleUpdateEmployee} onCancel={handleCloseForm} isLoading={isLoading} />
          )}
        </DialogContent>
      </Dialog>

      {/* View Employee Sheet */}
      <Sheet open={viewMode === "view"} onOpenChange={(open) => !open && handleCloseForm()}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>Employee Details</SheetTitle>
          </SheetHeader>
          {selectedEmployee && (
            <EmployeeDetails employee={selectedEmployee} onEdit={() => setViewMode("edit")} onClose={handleCloseForm} />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete (soft) Dialog */}
      <DeleteEmployeeDialog
        employee={employeeToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
        mode="soft"
      />

      {/* Purge (hard delete) Dialog */}
      <DeleteEmployeeDialog
        employee={employeeToPurge}
        open={purgeDialogOpen}
        onOpenChange={setPurgeDialogOpen}
        onConfirm={handleConfirmPurge}
        isLoading={isLoading}
        mode="hard"
      />
    </DashboardLayout>
  );
}