// src/components/employees/NewHireForm.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { authFetch } from "@/hooks/api";
import {
  type NewHire, type NewHireFormData,
  getCompletionPct, getMissingFields,
} from "@/hooks/useNewHires";

interface Props {
  initialData?: NewHire;
  onSave: (data: Partial<NewHireFormData>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const DEPARTMENTS = [
  "Human Resources", "Finance", "Front Office", "Food & Beverage",
  "Housekeeping", "Rooms Division", "Security", "Engineering",
];

const FIELD_LABELS: Record<string, string> = {
  first_name: "First Name", last_name: "Last Name", date_of_birth: "Date of Birth",
  email: "Email", phone_number: "Phone Number", home_address: "Home Address",
  emergency_contact_name: "Emergency Contact Name",
  emergency_contact_number: "Emergency Contact Number",
  relationship: "Relationship", start_date: "Start Date",
  department: "Department", job_category: "Job Category", basic_salary: "Basic Salary",
};

type FormState = Partial<NewHireFormData>;

export function NewHireForm({ initialData, onSave, onCancel, isLoading }: Props) {
  const isEdit = !!initialData;

  const [form, setForm] = useState<FormState>({
    first_name:               initialData?.first_name ?? "",
    last_name:                initialData?.last_name ?? "",
    middle_name:              initialData?.middle_name ?? "",
    name_extension:           initialData?.name_extension ?? "",
    date_of_birth:            initialData?.date_of_birth ?? "",
    email:                    initialData?.email ?? "",
    phone_number:             initialData?.phone_number ?? "",
    home_address:             initialData?.home_address ?? "",
    emergency_contact_name:   initialData?.emergency_contact_name ?? "",
    emergency_contact_number: initialData?.emergency_contact_number ?? "",
    relationship:             initialData?.relationship ?? "",
    tin:                      initialData?.tin ?? "",
    sss_number:               initialData?.sss_number ?? "",
    pagibig_number:           initialData?.pagibig_number ?? "",
    philhealth_number:        initialData?.philhealth_number ?? "",
    bank_name:                initialData?.bank_name ?? "",
    account_name:             initialData?.account_name ?? "",
    account_number:           initialData?.account_number ?? "",
    start_date:               initialData?.start_date ?? "",
    department:               initialData?.department ?? "",
    job_category:             initialData?.job_category ?? "",
    employment_type:          initialData?.employment_type ?? "probationary",
    role:                     initialData?.role ?? "Employee",
    basic_salary:             initialData?.basic_salary ?? undefined,
    reporting_manager:        initialData?.reporting_manager ?? "",
  });

  // Fetch departments and job categories from API
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [deptsRes, jobsRes] = await Promise.all([
          authFetch("/api/employees/departments"),
          authFetch("/api/employees/job-categories"),
        ]);
        const deptsData = await deptsRes.json();
        const jobsData = await jobsRes.json();
        // Update state if needed
      } catch (error) {
        console.error("Failed to fetch options:", error);
      }
    };
    fetchOptions();
  }, []);

  const set = (field: keyof FormState, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const pct     = getCompletionPct(form);
  const missing = getMissingFields(form);

  const handleSubmit = async () => {
    // Clean empty strings to null/undefined
    const cleaned = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === "" ? undefined : v])
    ) as Partial<NewHireFormData>;
    await onSave(cleaned);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel} className="gap-1 p-0 h-auto">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-semibold text-xl">
          {isEdit ? `Edit — ${initialData.first_name} ${initialData.last_name}` : "Add New Hire"}
        </h2>
      </div>

      {/* Completion bar */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Onboarding Progress</span>
          <span className={cn("font-semibold", pct === 100 ? "text-green-600" : "text-muted-foreground")}>
            {pct}% complete
          </span>
        </div>
        <Progress value={pct} className={cn("h-2", pct === 100 ? "[&>div]:bg-green-500" : "")} />
        {pct === 100 ? (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            All required fields filled — will auto-transfer to Employees on save!
          </p>
        ) : (
          <div className="flex flex-wrap gap-1 mt-1">
            {missing.map(f => (
              <Badge key={f} variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                <AlertCircle className="h-2.5 w-2.5 mr-1" />
                {FIELD_LABELS[f] ?? f}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Form Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="government">Gov't IDs</TabsTrigger>
          <TabsTrigger value="banking">Banking</TabsTrigger>
        </TabsList>

        {/* Personal Info */}
        <TabsContent value="personal" className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name *" required value={form.first_name ?? ""} onChange={v => set("first_name", v)} />
            <Field label="Last Name *"  required value={form.last_name ?? ""}  onChange={v => set("last_name", v)}  />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Middle Name"    value={form.middle_name ?? ""}    onChange={v => set("middle_name", v)}    />
            <Field label="Name Extension" value={form.name_extension ?? ""} onChange={v => set("name_extension", v)} placeholder="Jr., Sr., III" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DateField label="Date of Birth *" required value={form.date_of_birth ?? ""} onChange={v => set("date_of_birth", v)} />
            <Field label="Email *" required type="email" value={form.email ?? ""} onChange={v => set("email", v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone Number *" required value={form.phone_number ?? ""} onChange={v => set("phone_number", v)} />
            <Field label="Home Address *" required value={form.home_address ?? ""} onChange={v => set("home_address", v)} />
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-sm font-semibold mb-3">Emergency Contact</p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Contact Name *"   required value={form.emergency_contact_name ?? ""}   onChange={v => set("emergency_contact_name", v)}   />
              <Field label="Contact Number *" required value={form.emergency_contact_number ?? ""} onChange={v => set("emergency_contact_number", v)} />
              <Field label="Relationship *"   required value={form.relationship ?? ""}             onChange={v => set("relationship", v)}             />
            </div>
          </div>
        </TabsContent>

        {/* Employment */}
        <TabsContent value="employment" className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Department *</label>
              <Select value={form.department ?? ""} onValueChange={v => set("department", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Field label="Job Category *" required value={form.job_category ?? ""} onChange={v => set("job_category", v)} placeholder="e.g. Front Desk Agent" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Employment Type</label>
              <Select value={form.employment_type} onValueChange={v => set("employment_type", v as NewHire["employment_type"])}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["regular","probationary","contractual","part_time","intern"] as const).map(t => (
                    <SelectItem key={t} value={t}>{t.replace("_"," ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">System Role</label>
              <Select value={form.role ?? "Employee"} onValueChange={v => set("role", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Employee","HR","Manager","Accountant","Admin"].map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DateField label="Start Date *" required value={form.start_date ?? ""} onChange={v => set("start_date", v)} />
            <div>
              <label className="text-sm font-medium">Basic Salary (₱) *</label>
              <Input className="mt-1" type="number" value={form.basic_salary ?? ""}
                onChange={e => set("basic_salary", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g. 25000" />
            </div>
          </div>
          <Field label="Reporting Manager" value={form.reporting_manager ?? ""} onChange={v => set("reporting_manager", v)} placeholder="Name of direct supervisor" />
        </TabsContent>

        {/* Government IDs */}
        <TabsContent value="government" className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="TIN"         value={form.tin ?? ""}              onChange={v => set("tin", v)}              placeholder="Tax Identification Number" />
            <Field label="SSS Number"  value={form.sss_number ?? ""}       onChange={v => set("sss_number", v)}       placeholder="Social Security System" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="PhilHealth"  value={form.philhealth_number ?? ""} onChange={v => set("philhealth_number", v)} placeholder="PhilHealth Number" />
            <Field label="Pag-IBIG"    value={form.pagibig_number ?? ""}    onChange={v => set("pagibig_number", v)}    placeholder="Pag-IBIG Fund Number" />
          </div>
          <p className="text-xs text-muted-foreground">Government IDs are optional but required for payroll processing.</p>
        </TabsContent>

        {/* Banking */}
        <TabsContent value="banking" className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bank Name"      value={form.bank_name ?? ""}     onChange={v => set("bank_name", v)}     placeholder="e.g. BDO, BPI, Metrobank" />
            <Field label="Account Name"   value={form.account_name ?? ""}  onChange={v => set("account_name", v)}  placeholder="Name on account" />
          </div>
          <Field label="Account Number" value={form.account_number ?? ""} onChange={v => set("account_number", v)} placeholder="Bank account number" />
          <p className="text-xs text-muted-foreground">Required for payroll disbursement.</p>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isLoading || !form.first_name || !form.last_name || !form.email} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? "Saving..." : pct === 100 ? "Save & Transfer to Employees" : "Save Progress"}
        </Button>
      </div>
    </div>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function Field({ label, value, onChange, required, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}{required && " *"}</label>
      <Input className="mt-1" type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required} />
    </div>
  );
}

function DateField({ label, value, onChange, required }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}{required && " *"}</label>
      <input type="date" value={value} onChange={e => onChange(e.target.value)}
        required={required}
        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </div>
  );
}