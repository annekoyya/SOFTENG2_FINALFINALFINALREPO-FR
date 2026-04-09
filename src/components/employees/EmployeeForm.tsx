// src/components/employees/EmployeeForm.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authFetch } from "@/hooks/api";
import { Loader2 } from "lucide-react";
import type { Employee, EmployeeFormData } from "@/types/employee";

// Schema
const employeeSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  middle_name: z.string().optional(),
  name_extension: z.string().optional(),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(10, "Phone number must be at least 10 characters"),
  home_address: z.string().min(5, "Address must be at least 5 characters"),
  emergency_contact_name: z.string().optional(),
  emergency_contact_number: z.string().optional(),
  relationship: z.string().optional(),
  tin: z.string().optional(),
  sss_number: z.string().optional(),
  pagibig_number: z.string().optional(),
  philhealth_number: z.string().optional(),
  bank_name: z.string().optional(),
  account_name: z.string().optional(),
  account_number: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  department: z.string().min(1, "Department is required"),
  job_category: z.string().min(1, "Job category is required"),
  employment_type: z.enum(["regular", "probationary", "contractual", "part_time", "intern"]),
  shift_sched: z.enum(["morning", "afternoon", "night"]).optional(),
  basic_salary: z.coerce.number().min(0, "Salary must be 0 or greater"),
  role: z.enum(["Employee", "HR", "Manager", "Accountant", "Admin"]).optional(),
});

interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Department options
const DEPARTMENTS = [
  "Human Resources", "Finance", "Front Office", "Food & Beverage",
  "Housekeeping", "Engineering", "Security", "Sales & Marketing",
];

// Salary mapping
const SALARY_MAPPING: Record<string, number> = {
  "Manager": 50000,
  "Supervisor": 35000,
  "Staff": 25000,
  "Associate": 20000,
  "Intern": 10000,
  "Trainee": 8000,
  "Receptionist": 15000,
  "Housekeeper": 12000,
  "Waiter": 13000,
  "Cook": 18000,
  "Accountant": 25000,
  "HR Specialist": 22000,
};

// Determine role based on department and job category
const determineRole = (department: string, jobCategory: string): string => {
  if (jobCategory === "Admin") return "Admin";
  if (department === "Human Resources") return "HR";
  if (department === "Finance" && jobCategory === "Accountant") return "Accountant";
  if (jobCategory === "Manager") return "Manager";
  return "Employee";
};

export function EmployeeForm({ employee, onSubmit, onCancel, isLoading }: EmployeeFormProps) {
  const [jobCategories, setJobCategories] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch job categories from API
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await authFetch("/api/employees/job-categories");
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setJobCategories(data.data);
        } else {
          setJobCategories(Object.keys(SALARY_MAPPING));
        }
      } catch (error) {
        setJobCategories(Object.keys(SALARY_MAPPING));
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: employee?.first_name || "",
      last_name: employee?.last_name || "",
      middle_name: employee?.middle_name || "",
      name_extension: employee?.name_extension || "",
      date_of_birth: employee?.date_of_birth || "",
      email: employee?.email || "",
      phone_number: employee?.phone_number || "",
      home_address: employee?.home_address || "",
      emergency_contact_name: employee?.emergency_contact_name || "",
      emergency_contact_number: employee?.emergency_contact_number || "",
      relationship: employee?.relationship || "",
      tin: employee?.tin || "",
      sss_number: employee?.sss_number || "",
      pagibig_number: employee?.pagibig_number || "",
      philhealth_number: employee?.philhealth_number || "",
      bank_name: employee?.bank_name || "",
      account_name: employee?.account_name || "",
      account_number: employee?.account_number || "",
      start_date: employee?.start_date || "",
      department: employee?.department || "",
      job_category: employee?.job_category || "",
      employment_type: employee?.employment_type || "regular",
      shift_sched: employee?.shift_sched || "morning",
      basic_salary: employee?.basic_salary ? parseFloat(employee.basic_salary as unknown as string) : 0,
      role: employee?.role || "Employee",
    },
  });

  const selectedDepartment = form.watch("department");
  const selectedJobCategory = form.watch("job_category");

  // Auto-update salary when job category changes
  useEffect(() => {
    if (selectedJobCategory && SALARY_MAPPING[selectedJobCategory]) {
      form.setValue("basic_salary", SALARY_MAPPING[selectedJobCategory]);
    }
  }, [selectedJobCategory, form]);

  // Auto-update role when department or job category changes
  useEffect(() => {
    if (selectedDepartment && selectedJobCategory) {
      const role = determineRole(selectedDepartment, selectedJobCategory);
      form.setValue("role", role as any);
    }
  }, [selectedDepartment, selectedJobCategory, form]);

  const handleSubmit = async (data: z.infer<typeof employeeSchema>) => {
    await onSubmit(data as EmployeeFormData);
  };

  const firstName = form.watch("first_name");
  const lastName = form.watch("last_name");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6 pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {firstName?.[0] || "?"}{lastName?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">Profile Photo</h4>
                <p className="text-sm text-muted-foreground">Photo upload coming soon.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="first_name" render={({ field }) => (
                <FormItem><FormLabel>First Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="last_name" render={({ field }) => (
                <FormItem><FormLabel>Last Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="middle_name" render={({ field }) => (
                <FormItem><FormLabel>Middle Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="name_extension" render={({ field }) => (
                <FormItem><FormLabel>Name Extension</FormLabel><FormControl><Input placeholder="Jr., Sr., III" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                <FormItem><FormLabel>Date of Birth *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="home_address" render={({ field }) => (
              <FormItem><FormLabel>Address *</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </TabsContent>

          <TabsContent value="employment" className="space-y-6 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem><FormLabel>Department *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                    <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="job_category" render={({ field }) => (
                <FormItem><FormLabel>Job Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingOptions}>
                    <FormControl><SelectTrigger><SelectValue placeholder={loadingOptions ? "Loading..." : "Select job category"} /></SelectTrigger></FormControl>
                    <SelectContent>{jobCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="employment_type" render={({ field }) => (
                <FormItem><FormLabel>Employment Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="probationary">Probationary</SelectItem>
                      <SelectItem value="contractual">Contractual</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="shift_sched" render={({ field }) => (
                <FormItem><FormLabel>Shift Schedule</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="morning">Morning (6AM - 2PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (2PM - 10PM)</SelectItem>
                      <SelectItem value="night">Night (10PM - 6AM)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem><FormLabel>Start Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="basic_salary" render={({ field }) => (
                <FormItem><FormLabel>Monthly Salary (₱)</FormLabel>
                  <FormControl><Input type="number" {...field} readOnly className="bg-gray-100 cursor-not-allowed" /></FormControl>
                  <p className="text-xs text-muted-foreground">Auto-filled based on job category</p>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Role display - read-only */}
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem><FormLabel>System Role (Auto-calculated)</FormLabel>
                <FormControl><Input {...field} readOnly className="bg-gray-100" /></FormControl>
                <p className="text-xs text-muted-foreground">Role is determined by department and job category</p>
                <FormMessage />
              </FormItem>
            )} />
          </TabsContent>

          <TabsContent value="contact" className="space-y-6 pt-6">
            <FormField control={form.control} name="phone_number" render={({ field }) => (
              <FormItem><FormLabel>Phone Number *</FormLabel><FormControl><Input placeholder="+63 9XX XXX XXXX" {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="rounded-lg border p-4">
              <h4 className="mb-4 font-medium">Emergency Contact</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="emergency_contact_name" render={({ field }) => (
                  <FormItem><FormLabel>Contact Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="emergency_contact_number" render={({ field }) => (
                  <FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="relationship" render={({ field }) => (
                  <FormItem><FormLabel>Relationship</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="mb-4 font-medium">Government IDs</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="tin" render={({ field }) => (<FormItem><FormLabel>TIN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="sss_number" render={({ field }) => (<FormItem><FormLabel>SSS Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="pagibig_number" render={({ field }) => (<FormItem><FormLabel>Pag-IBIG</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="philhealth_number" render={({ field }) => (<FormItem><FormLabel>PhilHealth</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="mb-4 font-medium">Bank Details</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="bank_name" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="account_name" render={({ field }) => (<FormItem><FormLabel>Account Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="account_number" render={({ field }) => (<FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6 pt-6">
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">Document upload coming soon</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 border-t pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {employee ? "Update Employee" : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}