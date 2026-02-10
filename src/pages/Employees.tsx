import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { EmployeeDetails } from "@/components/employees/EmployeeDetails";
import { DeleteEmployeeDialog } from "@/components/employees/DeleteEmployeeDialog";
import { useEmployees } from "@/hooks/useEmployees";
import { Employee, EmployeeFormData } from "@/types/employee";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UserPlus, Download } from "lucide-react";

type ViewMode = "list" | "add" | "edit" | "view";

export default function Employees() {
  const { employees, isLoading, addEmployee, updateEmployee, deleteEmployee, restoreEmployee, purgeEmployee } = useEmployees();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [purgeDialogOpen, setPurgeDialogOpen] = useState(false);
  const [employeeToPurge, setEmployeeToPurge] = useState<Employee | null>(null);
  const [showArchived, setShowArchived] = useState(false);

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
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setViewMode("add")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Employee Table */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${!showArchived ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground'}`}
            onClick={() => setShowArchived(false)}
          >
            Active
          </button>
          <button
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${showArchived ? 'bg-primary text-primary-foreground' : 'bg-transparent text-muted-foreground'}`}
            onClick={() => setShowArchived(true)}
          >
            Archived
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{showArchived ? 'Viewing archived employees' : 'Viewing active employees'}</p>
      </div>

      <EmployeeTable
        employees={employees.filter((e) => !!e.archived === showArchived)}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isArchivedView={showArchived}
        onRestore={async (emp) => await restoreEmployee(emp.id)}
        onPurge={(emp) => handlePurge(emp)}
      />

      {/* Add Employee Dialog */}
      <Dialog open={viewMode === "add"} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add New Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            onSubmit={handleAddEmployee}
            onCancel={handleCloseForm}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={viewMode === "edit"} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Employee</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeForm
              employee={selectedEmployee}
              onSubmit={handleUpdateEmployee}
              onCancel={handleCloseForm}
              isLoading={isLoading}
            />
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
            <EmployeeDetails
              employee={selectedEmployee}
              onEdit={() => {
                setViewMode("edit");
              }}
              onClose={handleCloseForm}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <DeleteEmployeeDialog
        employee={employeeToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
        mode="soft"
      />

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
