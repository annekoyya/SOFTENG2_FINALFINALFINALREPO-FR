// src/components/employees/NewHireDetailsModal.tsx
// FIX #1: full form that SAVES details first, then transfers
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
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

interface Props {
  open: boolean;
  onClose: () => void;
  newHireId: number | null;
  onSuccess: () => void;
}

type Form = {
  first_name: string; last_name: string; middle_name: string; name_extension: string;
  date_of_birth: string; email: string; phone_number: string; home_address: string;
  emergency_contact_name: string; emergency_contact_number: string; relationship: string;
  tin: string; sss_number: string; pagibig_number: string; philhealth_number: string;
  bank_name: string; account_name: string; account_number: string;
  start_date: string; department: string; job_category: string;
  employment_type: string; role: string; basic_salary: string;
  reporting_manager: string; shift_sched: string;
};

const EMPTY: Form = {
  first_name: "", last_name: "", middle_name: "", name_extension: "",
  date_of_birth: "", email: "", phone_number: "", home_address: "",
  emergency_contact_name: "", emergency_contact_number: "", relationship: "",
  tin: "", sss_number: "", pagibig_number: "", philhealth_number: "",
  bank_name: "", account_name: "", account_number: "",
  start_date: "", department: "", job_category: "",
  employment_type: "probationary", role: "Employee", basic_salary: "",
  reporting_manager: "", shift_sched: "morning",
};

const REQUIRED: (keyof Form)[] = [
  "first_name", "last_name", "date_of_birth", "email",
  "phone_number", "home_address",
  "emergency_contact_name", "emergency_contact_number", "relationship",
  "start_date", "department", "job_category", "basic_salary", "shift_sched",
];

const FIELD_LABELS: Partial<Record<keyof Form, string>> = {
  first_name: "First Name", last_name: "Last Name", date_of_birth: "Date of Birth",
  email: "Email", phone_number: "Phone Number", home_address: "Home Address",
  emergency_contact_name: "Emergency Contact Name",
  emergency_contact_number: "Emergency Contact Number",
  relationship: "Relationship", start_date: "Start Date",
  department: "Department", job_category: "Job Category",
  basic_salary: "Basic Salary", shift_sched: "Shift Schedule",
};

const DEPARTMENTS = [
  "Front Office", "Housekeeping", "Food & Beverage",
  "Maintenance", "Administration", "Security", "Sales & Marketing",
];

const JOB_CATEGORIES_BY_DEPT: Record<string, string[]> = {
  "Front Office":    ["Front Desk Agent","Concierge","Reservations Agent","Guest Relations Officer","Bell Staff"],
  "Housekeeping":    ["Room Attendant","Laundry Attendant","Housekeeping Supervisor","Public Area Cleaner"],
  "Food & Beverage": ["Waiter/Waitress","Bartender","Chef de Partie","Sous Chef","Executive Chef","Kitchen Steward"],
  "Maintenance":     ["Maintenance Technician","Electrician","Plumber","Maintenance Supervisor"],
  "Administration":  ["HR Officer","Accounting Staff","Payroll Officer","General Manager","Department Manager","Supervisor"],
  "Security":        ["Security Guard","Security Supervisor"],
  "Sales & Marketing": ["Sales Manager","Marketing Officer","Reservations Manager"],
};

function getPct(form: Form): number {
  const filled = REQUIRED.filter(f => form[f] && form[f] !== "").length;
  return Math.round((filled / REQUIRED.length) * 100);
}

function getMissing(form: Form): (keyof Form)[] {
  return REQUIRED.filter(f => !form[f]);
}

export function NewHireDetailsModal({ open, onClose, newHireId, onSuccess }: Props) {
  const { toast }                     = useToast();
  const [form,     setForm]           = useState<Form>(EMPTY);
  const [loading,  setLoading]        = useState(false);
  const [fetching, setFetching]       = useState(false);
  const [tab,      setTab]            = useState("personal");

  const set = (field: keyof Form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const pct     = getPct(form);
  const missing = getMissing(form);
  const canTransfer = pct === 100;

  // Load existing new hire data
  useEffect(() => {
    if (!open || !newHireId) return;
    setFetching(true);
    setTab("personal");

    authFetch(`/api/new-hires/${newHireId}`)
      .then(r => r.json())
      .then(body => {
        const nh = body.data;
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
          shift_sched:              nh.shift_sched ?? "morning",
        });
      })
      .catch(() => toast({ title: "Failed to load new hire data", variant: "destructive" }))
      .finally(() => setFetching(false));
  }, [open, newHireId]);

  const handleTransfer = async () => {
    if (!canTransfer || !newHireId) return;
    setLoading(true);
    try {
      // Step 1: save all details
      const saveRes = await authFetch(`/api/new-hires/${newHireId}/complete-details`, {
        method: "POST",
        body: JSON.stringify({ ...form, basic_salary: parseFloat(form.basic_salary) }),
      });
      const saveBody = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveBody.message ?? "Failed to save details");

      // Step 2: transfer to employee
      const txRes  = await authFetch(`/api/new-hires/${newHireId}/transfer`, { method: "POST" });
      const txBody = await txRes.json();
      if (!txRes.ok) throw new Error(txBody.message ?? "Transfer failed");

      toast({
        title: "🎉 Transferred!",
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
    } finally { setLoading(false); }
  };

  const F = ({ label, field, required, type = "text", placeholder }: {
    label: string; field: keyof Form; required?: boolean; type?: string; placeholder?: string;
  }) => (
    <div>
      <label className="text-xs font-medium text-foreground/80">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <Input
        className={cn("mt-1 h-9", required && !form[field] ? "border-amber-300" : "")}
        type={type}
        value={form[field]}
        onChange={e => set(field, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={v => !loading && !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            Complete Employee Details — Transfer to Employees
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fill in all required fields before transferring. A login account will be created automatically.
          </p>
        </DialogHeader>

        {fetching ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {/* Progress */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Completion</span>
                <span className={cn("font-semibold tabular-nums", pct === 100 ? "text-green-600" : "text-amber-600")}>
                  {pct}% ({REQUIRED.length - missing.length}/{REQUIRED.length} required)
                </span>
              </div>
              <Progress
                value={pct}
                className={cn("h-2.5", pct === 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-amber-500")}
              />
              {pct < 100 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {missing.map(f => (
                    <Badge key={f} variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                      <AlertCircle className="h-2.5 w-2.5 mr-1" />
                      {FIELD_LABELS[f] ?? f}
                    </Badge>
                  ))}
                </div>
              )}
              {pct === 100 && (
                <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> All required fields complete — ready to transfer!
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
                <TabsTrigger value="govids">Gov't IDs</TabsTrigger>
                <TabsTrigger value="banking">Banking</TabsTrigger>
              </TabsList>

              {/* Personal */}
              <TabsContent value="personal" className="rounded-xl border p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <F label="First Name"    field="first_name" required />
                  <F label="Last Name"     field="last_name"  required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Middle Name"    field="middle_name" />
                  <F label="Name Extension" field="name_extension" placeholder="Jr., Sr., III" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Date of Birth" field="date_of_birth" required type="date" />
                  <F label="Email"         field="email"         required type="email" />
                </div>
                <F label="Phone Number" field="phone_number" required placeholder="+63 9XX XXX XXXX" />
                <F label="Home Address" field="home_address" required />
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Emergency Contact</p>
                  <div className="grid grid-cols-3 gap-3">
                    <F label="Contact Name"   field="emergency_contact_name"   required />
                    <F label="Contact Number" field="emergency_contact_number" required />
                    <F label="Relationship"   field="relationship"             required placeholder="Spouse, Parent…" />
                  </div>
                </div>
              </TabsContent>

              {/* Employment */}
              <TabsContent value="employment" className="rounded-xl border p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Department<span className="text-red-500 ml-0.5">*</span></label>
                    <Select value={form.department} onValueChange={v => { set("department", v); set("job_category", ""); }}>
                      <SelectTrigger className={cn("mt-1 h-9", !form.department ? "border-amber-300" : "")}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Job Category<span className="text-red-500 ml-0.5">*</span></label>
                    <Select value={form.job_category} onValueChange={v => set("job_category", v)} disabled={!form.department}>
                      <SelectTrigger className={cn("mt-1 h-9", !form.job_category ? "border-amber-300" : "")}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(JOB_CATEGORIES_BY_DEPT[form.department] ?? []).map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Shift<span className="text-red-500 ml-0.5">*</span></label>
                    <Select value={form.shift_sched} onValueChange={v => set("shift_sched", v)}>
                      <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (07:00–15:00)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (15:00–23:00)</SelectItem>
                        <SelectItem value="night">Night (23:00–07:00)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Employment Type</label>
                    <Select value={form.employment_type} onValueChange={v => set("employment_type", v)}>
                      <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="probationary">Probationary</SelectItem>
                        <SelectItem value="contractual">Contractual</SelectItem>
                        <SelectItem value="part_time">Part-time</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <F label="Start Date" field="start_date" required type="date" />
                  <div>
                    <label className="text-xs font-medium">Basic Salary (₱)<span className="text-red-500 ml-0.5">*</span></label>
                    <Input
                      type="number"
                      className={cn("mt-1 h-9", !form.basic_salary ? "border-amber-300" : "")}
                      value={form.basic_salary}
                      onChange={e => set("basic_salary", e.target.value)}
                      placeholder="e.g. 25000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">System Role</label>
                    <Select value={form.role} onValueChange={v => set("role", v)}>
                      <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Accountant">Accountant</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <F label="Reporting Manager" field="reporting_manager" placeholder="Direct supervisor name" />
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
                  Login will be created: <strong>{form.email || "—"}</strong> / temp password: <strong>Employee@123</strong>
                </div>
              </TabsContent>

              {/* Gov IDs */}
              <TabsContent value="govids" className="rounded-xl border p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <F label="TIN"        field="tin"              placeholder="Tax Identification Number" />
                  <F label="SSS Number" field="sss_number"       />
                  <F label="PhilHealth" field="philhealth_number" />
                  <F label="Pag-IBIG"   field="pagibig_number"   />
                </div>
                <p className="text-xs text-muted-foreground">Optional now, required for payroll later.</p>
              </TabsContent>

              {/* Banking */}
              <TabsContent value="banking" className="rounded-xl border p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <F label="Bank Name"    field="bank_name"    placeholder="BDO, BPI, Metrobank…" />
                  <F label="Account Name" field="account_name" />
                </div>
                <F label="Account Number" field="account_number" />
                <p className="text-xs text-muted-foreground">Required for payroll disbursement.</p>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleTransfer}
            disabled={!canTransfer || loading || fetching}
            className={cn(
              "gap-2 min-w-[160px]",
              canTransfer ? "bg-green-600 hover:bg-green-700 text-white" : "opacity-60"
            )}
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Transferring…</>
              : <><UserPlus className="h-4 w-4" /> Transfer to Employees</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}