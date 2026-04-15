// src/components/employees/NewHireDetailsModal.tsx

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/hooks/api";
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewHire } from "@/hooks/useNewHires";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  newHireId: number | null;
  onSuccess: () => void;
}

type FormState = {
  first_name: string;
  last_name: string;
  middle_name: string;
  name_extension: string;
  date_of_birth: string;
  email: string;
  phone_number: string;
  home_address: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
  relationship: string;
  tin: string;
  sss_number: string;
  pagibig_number: string;
  philhealth_number: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  start_date: string;
  department: string;
  job_category: string;
  employment_type: string;
  role: string;
  basic_salary: string;
  reporting_manager: string;
  shift_sched: string;
};

const EMPTY_FORM: FormState = {
  first_name: "", last_name: "", middle_name: "", name_extension: "",
  date_of_birth: "", email: "", phone_number: "", home_address: "",
  emergency_contact_name: "", emergency_contact_number: "", relationship: "",
  tin: "", sss_number: "", pagibig_number: "", philhealth_number: "",
  bank_name: "", account_name: "", account_number: "",
  start_date: "", department: "", job_category: "",
  employment_type: "probationary", role: "Employee", basic_salary: "",
  reporting_manager: "", shift_sched: "morning",
};

// Required fields the employee MUST have before transfer
const REQUIRED: (keyof FormState)[] = [
  "first_name", "last_name", "date_of_birth", "email",
  "phone_number", "home_address",
  "emergency_contact_name", "emergency_contact_number", "relationship",
  "start_date", "department", "job_category", "basic_salary", "shift_sched",
];

const FIELD_LABELS: Partial<Record<keyof FormState, string>> = {
  first_name: "First Name", last_name: "Last Name", date_of_birth: "Date of Birth",
  email: "Email", phone_number: "Phone Number", home_address: "Home Address",
  emergency_contact_name: "Emergency Contact Name",
  emergency_contact_number: "Emergency Contact Number",
  relationship: "Relationship", start_date: "Start Date",
  department: "Department", job_category: "Job Category",
  basic_salary: "Basic Salary", shift_sched: "Shift Schedule",
};

const DEPARTMENTS = [
  "Human Resources", "Finance", "Front Office", "Food & Beverage",
  "Housekeeping", "Rooms Division", "Security", "Engineering",
];

// ─── Completion helpers ───────────────────────────────────────────────────────

function getPct(form: FormState): number {
  const filled = REQUIRED.filter(f => form[f] !== "" && form[f] !== null).length;
  return Math.round((filled / REQUIRED.length) * 100);
}

function getMissing(form: FormState): (keyof FormState)[] {
  return REQUIRED.filter(f => !form[f]);
}

// ─── Small field components ───────────────────────────────────────────────────

function Field({
  label, value, onChange, required, type = "text", placeholder, disabled,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  required?: boolean; type?: string;
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-foreground/80">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <Input
        className="mt-1 h-9"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

function DateField({
  label, value, onChange, required,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-foreground/80">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, required, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-medium text-foreground/80">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1 h-9">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MODAL
// ═══════════════════════════════════════════════════════════════════════════

export function NewHireDetailsModal({ open, onClose, newHireId, onSuccess }: Props) {
  const { toast } = useToast();
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(false);
  const [activeTab,  setActiveTab]  = useState("personal");

  const set = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const pct     = getPct(form);
  const missing = getMissing(form);
  const canTransfer = pct === 100;

  // ── Load existing new hire data when modal opens ──────────────────────────
  useEffect(() => {
    if (!open || !newHireId) return;

    setFetching(true);
    setActiveTab("personal");

    authFetch(`/api/new-hires/${newHireId}`)
      .then(res => res.json())
      .then(body => {
        const nh: NewHire = body.data;
        if (!nh) return;
        setForm({
          first_name:               nh.first_name ?? "",
          last_name:                nh.last_name ?? "",
          middle_name:              nh.middle_name ?? "",
          name_extension:           nh.name_extension ?? "",
          date_of_birth:            nh.date_of_birth ?? "",
          email:                    nh.email ?? "",
          phone_number:             nh.phone_number ?? "",
          home_address:             nh.home_address ?? "",
          emergency_contact_name:   nh.emergency_contact_name ?? "",
          emergency_contact_number: nh.emergency_contact_number ?? "",
          relationship:             nh.relationship ?? "",
          tin:                      nh.tin ?? "",
          sss_number:               nh.sss_number ?? "",
          pagibig_number:           nh.pagibig_number ?? "",
          philhealth_number:        nh.philhealth_number ?? "",
          bank_name:                nh.bank_name ?? "",
          account_name:             nh.account_name ?? "",
          account_number:           nh.account_number ?? "",
          start_date:               nh.start_date ?? "",
          department:               nh.department ?? "",
          job_category:             nh.job_category ?? "",
          employment_type:          nh.employment_type ?? "probationary",
          role:                     nh.role ?? "Employee",
          basic_salary:             nh.basic_salary ? String(nh.basic_salary) : "",
          reporting_manager:        nh.reporting_manager ?? "",
          shift_sched:              "morning",
        });
      })
      .catch(() => toast({ title: "Failed to load new hire data", variant: "destructive" }))
      .finally(() => setFetching(false));
  }, [open, newHireId]);

  // ── Save details then transfer ────────────────────────────────────────────
  const handleTransfer = async () => {
    if (!canTransfer || !newHireId) return;

    setLoading(true);
    try {
      // Step 1: Save/complete all details via the complete-details endpoint
      const saveRes = await authFetch(
        `/api/recruitment/new-hires/${newHireId}/complete-details`,
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
            basic_salary: parseFloat(form.basic_salary),
          }),
        }
      );
      const saveBody = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveBody.message ?? "Failed to save details");

      // Step 2: Transfer to employee
      const transferRes = await authFetch(
        `/api/recruitment/new-hires/${newHireId}/transfer`,
        { method: "POST" }
      );
      const transferBody = await transferRes.json();
      if (!transferRes.ok) throw new Error(transferBody.message ?? "Transfer failed");

      toast({
        title: "🎉 Transferred to Employees!",
        description: `${form.first_name} ${form.last_name} is now an active employee.`,
      });

      onSuccess();
      onClose();
    } catch (e) {
      toast({
        title: "Transfer failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Auto-navigate to first tab with missing fields ────────────────────────
  const goToFirstMissing = () => {
    const personalMissing  = ["first_name","last_name","date_of_birth","email","phone_number","home_address","emergency_contact_name","emergency_contact_number","relationship"];
    const employmentMissing = ["start_date","department","job_category","basic_salary","shift_sched"];

    if (missing.some(f => personalMissing.includes(f)))   { setActiveTab("personal");   return; }
    if (missing.some(f => employmentMissing.includes(f))) { setActiveTab("employment"); return; }
  };

  return (
    <Dialog open={open} onOpenChange={v => !loading && !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            Complete Employee Details — Transfer to Employees
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in all required fields before transferring. Once transferred, a full employee
            profile and login account will be created automatically.
          </p>
        </DialogHeader>

        {fetching ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">

            {/* Progress bar */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Completion</span>
                <span className={cn("font-semibold tabular-nums",
                  pct === 100 ? "text-green-600" : "text-amber-600")}>
                  {pct}% ({REQUIRED.length - missing.length}/{REQUIRED.length} required fields)
                </span>
              </div>
              <Progress
                value={pct}
                className={cn("h-2.5", pct === 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-amber-500")}
              />
              {pct === 100 ? (
                <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  All required fields complete — ready to transfer!
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Missing required fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {missing.map(f => (
                      <Badge key={f}
                        variant="outline"
                        className="text-[10px] border-amber-300 text-amber-700 bg-amber-50 cursor-pointer"
                        onClick={goToFirstMissing}>
                        <AlertCircle className="h-2.5 w-2.5 mr-1" />
                        {FIELD_LABELS[f] ?? f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal" className="relative">
                  Personal
                  {missing.some(f => ["first_name","last_name","date_of_birth","email","phone_number","home_address","emergency_contact_name","emergency_contact_number","relationship"].includes(f)) && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="employment" className="relative">
                  Employment
                  {missing.some(f => ["start_date","department","job_category","basic_salary","shift_sched"].includes(f)) && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="government">Gov't IDs</TabsTrigger>
                <TabsTrigger value="banking">Banking</TabsTrigger>
              </TabsList>

              {/* ── Personal Tab ────────────────────────────────────────── */}
              <TabsContent value="personal" className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name" required value={form.first_name} onChange={v => set("first_name", v)} />
                  <Field label="Last Name"  required value={form.last_name}  onChange={v => set("last_name", v)}  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Middle Name"    value={form.middle_name}    onChange={v => set("middle_name", v)} />
                  <Field label="Name Extension" value={form.name_extension} onChange={v => set("name_extension", v)} placeholder="Jr., Sr., III" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DateField label="Date of Birth" required value={form.date_of_birth} onChange={v => set("date_of_birth", v)} />
                  <Field label="Email" required type="email" value={form.email} onChange={v => set("email", v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone Number" required value={form.phone_number} onChange={v => set("phone_number", v)} placeholder="+63 9XX XXX XXXX" />
                  <Field label="Home Address" required value={form.home_address}  onChange={v => set("home_address", v)}  />
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Emergency Contact</p>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Contact Name"   required value={form.emergency_contact_name}   onChange={v => set("emergency_contact_name", v)}   />
                    <Field label="Contact Number" required value={form.emergency_contact_number} onChange={v => set("emergency_contact_number", v)} />
                    <Field label="Relationship"   required value={form.relationship}             onChange={v => set("relationship", v)} placeholder="Spouse, Parent, Sibling" />
                  </div>
                </div>
              </TabsContent>

              {/* ── Employment Tab ──────────────────────────────────────── */}
              <TabsContent value="employment" className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Department" required
                    value={form.department}
                    onChange={v => set("department", v)}
                    options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
                  />
                  <Field label="Job Category" required value={form.job_category} onChange={v => set("job_category", v)} placeholder="e.g. Front Desk Agent" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Shift Schedule" required
                    value={form.shift_sched}
                    onChange={v => set("shift_sched", v)}
                    options={[
                      { value: "morning",   label: "Morning   (07:00 – 15:00)" },
                      { value: "afternoon", label: "Afternoon (15:00 – 23:00)" },
                      { value: "night",     label: "Night     (23:00 – 07:00)" },
                    ]}
                  />
                  <SelectField
                    label="Employment Type"
                    value={form.employment_type}
                    onChange={v => set("employment_type", v)}
                    options={[
                      { value: "regular",      label: "Regular"      },
                      { value: "probationary", label: "Probationary" },
                      { value: "contractual",  label: "Contractual"  },
                      { value: "part_time",    label: "Part-time"    },
                      { value: "intern",       label: "Intern"       },
                    ]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DateField label="Start Date" required value={form.start_date} onChange={v => set("start_date", v)} />
                  <div>
                    <label className="text-xs font-medium text-foreground/80">
                      Basic Salary (₱)<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <Input
                      className="mt-1 h-9"
                      type="number"
                      value={form.basic_salary}
                      onChange={e => set("basic_salary", e.target.value)}
                      placeholder="e.g. 25000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="System Role"
                    value={form.role}
                    onChange={v => set("role", v)}
                    options={[
                      { value: "Employee",   label: "Employee"   },
                      { value: "HR",         label: "HR"         },
                      { value: "Accountant", label: "Accountant" },
                      { value: "Manager",    label: "Manager"    },
                      { value: "Admin",      label: "Admin"      },
                    ]}
                  />
                  <Field label="Reporting Manager" value={form.reporting_manager} onChange={v => set("reporting_manager", v)} placeholder="Name of direct supervisor" />
                </div>

                {/* Login credentials preview */}
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 space-y-1">
                  <p className="font-semibold">Login credentials that will be created:</p>
                  <p>Email: <span className="font-mono">{form.email || "—"}</span></p>
                  <p>Temporary password: <span className="font-mono">Employee@123</span> (employee must change on first login)</p>
                </div>
              </TabsContent>

              {/* ── Government IDs Tab ──────────────────────────────────── */}
              <TabsContent value="government" className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="TIN"        value={form.tin}              onChange={v => set("tin", v)}              placeholder="Tax Identification Number" />
                  <Field label="SSS Number" value={form.sss_number}       onChange={v => set("sss_number", v)}       placeholder="Social Security System" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="PhilHealth" value={form.philhealth_number} onChange={v => set("philhealth_number", v)} placeholder="PhilHealth Number" />
                  <Field label="Pag-IBIG"   value={form.pagibig_number}    onChange={v => set("pagibig_number", v)}    placeholder="Pag-IBIG Fund Number" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Government IDs are optional here but required for payroll statutory deductions.
                  They can be filled in from the Employee Profile page after transfer.
                </p>
              </TabsContent>

              {/* ── Banking Tab ─────────────────────────────────────────── */}
              <TabsContent value="banking" className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Bank Name"    value={form.bank_name}    onChange={v => set("bank_name", v)}    placeholder="e.g. BDO, BPI, Metrobank" />
                  <Field label="Account Name" value={form.account_name} onChange={v => set("account_name", v)} placeholder="Name on account" />
                </div>
                <Field label="Account Number" value={form.account_number} onChange={v => set("account_number", v)} placeholder="Bank account number" />
                <p className="text-xs text-muted-foreground">Required for payroll disbursement. Can be added after transfer.</p>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter className="flex items-center gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!canTransfer || loading || fetching}
            className={cn(
              "gap-2 min-w-[160px]",
              canTransfer
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "opacity-60 cursor-not-allowed"
            )}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Transferring…</>
            ) : (
              <><UserPlus className="h-4 w-4" /> Transfer to Employees</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}