import { useState, useCallback } from "react";
import { Employee, EmployeeFormData } from "@/types/employee";
import { mockEmployees } from "@/data/mockEmployees";
import { useToast } from "@/hooks/use-toast";

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateEmployeeId = useCallback(() => {
    const year = new Date().getFullYear();
    const count = employees.length + 1;
    return `BLH-${year}-${count.toString().padStart(3, "0")}`;
  }, [employees.length]);

  const addEmployee = useCallback(
    async (data: EmployeeFormData) => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        const newEmployee: Employee = {
          ...data,
          id: crypto.randomUUID(),
          employee_id: generateEmployeeId(),
          department_name:
            data.department_id === "1"
              ? "Front Office"
              : data.department_id === "2"
              ? "Housekeeping"
              : data.department_id === "3"
              ? "Food & Beverage"
              : data.department_id === "4"
              ? "Engineering"
              : data.department_id === "5"
              ? "Human Resources"
              : data.department_id === "6"
              ? "Finance"
              : data.department_id === "7"
              ? "Sales & Marketing"
              : "Security",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setEmployees((prev) => [...prev, newEmployee]);
        toast({
          title: "Employee Added",
          description: `${data.first_name} ${data.last_name} has been added successfully.`,
        });
        return newEmployee;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add employee. Please try again.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [generateEmployeeId, toast]
  );

  const updateEmployee = useCallback(
    async (id: string, data: Partial<EmployeeFormData>) => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === id
              ? { ...emp, ...data, updated_at: new Date().toISOString() }
              : emp
          )
        );
        toast({
          title: "Employee Updated",
          description: "Employee information has been updated successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update employee. Please try again.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const deleteEmployee = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        setEmployees((prev) => prev.filter((emp) => emp.id !== id));
        toast({
          title: "Employee Deleted",
          description: "Employee has been removed from the system.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete employee. Please try again.",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const getEmployeeById = useCallback(
    (id: string) => {
      return employees.find((emp) => emp.id === id);
    },
    [employees]
  );

  return {
    employees,
    isLoading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
  };
}
