import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Employee, EmployeeFormData } from "@/types/employee";
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
import { Upload } from "lucide-react";

const employeeSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters").max(50),
  last_name: z.string().min(2, "Last name must be at least 2 characters").max(50),
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
  job_category: z.string().min(2, "Job category is required"),
  employment_type: z.enum(["regular", "probationary", "contractual", "part_time", "intern"]),
  shift_sched: z.enum(["morning", "afternoon", "night"]),
  basic_salary: z.coerce.number().min(1, "Salary must be greater than 0"),
  role: z.enum(["Employee", "HR", "Manager", "Accountant", "Admin"]).optional(),
  manager_id: z.number().optional(),
});

interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Department options
const departmentOptions = [
  { id: "Human Resources", name: "Human Resources" },
  { id: "Finance", name: "Finance" },
  { id: "Front Office", name: "Front Office" },
  { id: "Food & Beverage", name: "Food & Beverage" },
  { id: "Housekeeping", name: "Housekeeping" },
];

// Job category options with corresponding salaries
const jobCategoryOptions = [
  { id: "Receptionist", name: "Receptionist", salary: 15000 },
  { id: "Housekeeper", name: "Housekeeper", salary: 12000 },
  { id: "Waiter", name: "Waiter", salary: 13000 },
  { id: "Cook", name: "Cook", salary: 18000 },
  { id: "Supervisor", name: "Supervisor", salary: 20000 },
  { id: "Manager", name: "Manager", salary: 30000 },
  { id: "Accountant", name: "Accountant", salary: 25000 },
  { id: "HR Specialist", name: "HR Specialist", salary: 22000 },
];

export function EmployeeForm({ employee, onSubmit, onCancel, isLoading }: EmployeeFormProps) {
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
      manager_id: employee?.manager_id || undefined,
    },
  });

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

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6 pt-6">
            {/* Profile Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {firstName?.[0] || "?"}{lastName?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h4 className="font-medium text-card-foreground">Profile Photo</h4>
                <p className="text-sm text-muted-foreground">
                  Photo upload feature coming soon.
                </p>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Personal Details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="home_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Employment Tab */}
          <TabsContent value="employment" className="space-y-6 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departmentOptions.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="job_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Category *</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      const selectedCategory = jobCategoryOptions.find(cat => cat.id === value);
                      if (selectedCategory) {
                        form.setValue('basic_salary', selectedCategory.salary);
                      }
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobCategoryOptions.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="employment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
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
                )}
              />
              <FormField
                control={form.control}
                name="shift_sched"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift Schedule *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="basic_salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Salary (₱) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6 pt-6">
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="+63 9XX XXX XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="mb-4 font-medium text-card-foreground">Emergency Contact</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="emergency_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_contact_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+63 9XX XXX XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6 pt-6">
            <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <h4 className="mt-4 font-medium text-card-foreground">
                Upload Documents
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Drag and drop files here, or click to browse
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Supported: PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
              </p>
              <Button type="button" variant="outline" className="mt-4">
                Choose Files
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Recommended documents:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Resume/CV</li>
                <li>Valid Government ID</li>
                <li>Employment Contract</li>
                <li>Certificates & Credentials</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 border-t border-border pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : employee ? "Update Employee" : "Add Employee"}
          </Button>
        </div>
      </form>
    </Form>
  );
}