// src/components/employees/EmployeeDetails.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Pencil, Archive, Download, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/employee";

interface Props {
  employee: Employee | null;
  open: boolean;
  onClose:   () => void;
  onEdit:    (emp: Employee) => void;
  onArchive: (emp: Employee) => void;
  isAdmin:   boolean;
}

const statusColors: Record<string, string> = {
  active:      "bg-green-100 text-green-700",
  on_leave:    "bg-yellow-100 text-yellow-700",
  suspended:   "bg-orange-100 text-orange-700",
  terminated:  "bg-red-100 text-red-700",
  onboarding:  "bg-blue-100 text-blue-700",
};

const roleColors: Record<string, string> = {
  Admin:      "bg-purple-100 text-purple-700",
  HR:         "bg-blue-100 text-blue-700",
  Manager:    "bg-indigo-100 text-indigo-700",
  Accountant: "bg-teal-100 text-teal-700",
  Employee:   "bg-gray-100 text-gray-600",
};

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[55%]">
        {value ?? <span className="text-muted-foreground/50">—</span>}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

export function EmployeeDetails({ employee, open, onClose, onEdit, onArchive, isAdmin }: Props) {
  if (!employee) return null;

  const fullName = [employee.first_name, employee.middle_name, employee.last_name, employee.name_extension]
    .filter(Boolean).join(" ") || "—";

  const initials = `${employee.first_name?.[0] ?? ""}${employee.last_name?.[0] ?? ""}` || "?";

  const shiftLabel = employee.shift_sched
    ? `${employee.shift_sched.charAt(0).toUpperCase() + employee.shift_sched.slice(1)} shift`
    : "—";

  const employmentTypeLabel = employee.employment_type
    ? employee.employment_type.replace("_", " ")
    : "—";

  const statusLabel = employee.status
    ? employee.status.replace("_", " ")
    : "—";

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(employee, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `employee_${employee.id}_${employee.last_name ?? "export"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Employee Profile</SheetTitle>
        </SheetHeader>

        {/* Hero */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">{fullName}</h2>
            <p className="text-sm text-muted-foreground">
              {employee.job_category ?? "—"} · {employee.department ?? "—"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn("text-xs border-0 capitalize", statusColors[employee.status] ?? "bg-gray-100 text-gray-600")}>
                {statusLabel}
              </Badge>
              {employee.role && (
                <Badge className={cn("text-xs border-0", roleColors[employee.role] ?? "bg-gray-100 text-gray-600")}>
                  <Shield className="h-3 w-3 mr-1" />{employee.role}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <Button variant="outline" size="sm" className="gap-1" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => onEdit(employee)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button variant="outline" size="sm"
                className="gap-1 text-red-600 hover:text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => { onArchive(employee); onClose(); }}>
                <Archive className="h-4 w-4" /> Archive
              </Button>
            </>
          )}
        </div>

        <div className="space-y-6">
          <Section title="Personal Information">
            <Row label="Full Name"     value={fullName} />
            <Row label="Date of Birth" value={employee.date_of_birth} />
            <Row label="Email"         value={employee.email} />
            <Row label="Phone Number"  value={employee.phone_number} />
            <Row label="Home Address"  value={employee.home_address} />
          </Section>

          <Separator />

          <Section title="Employment">
            <Row label="Employee ID"     value={`#${String(employee.id).padStart(5, "0")}`} />
            <Row label="Department"      value={employee.department} />
            <Row label="Job Category"    value={employee.job_category} />
            <Row label="Employment Type" value={employmentTypeLabel} />
            <Row label="Shift Schedule"  value={shiftLabel} />
            <Row label="Start Date"      value={employee.start_date} />
            <Row label="Basic Salary"    value={employee.basic_salary != null
              ? `₱${Number(employee.basic_salary).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
              : "—"} />
          </Section>

          <Separator />

          <Section title="Emergency Contact">
            <Row label="Name"         value={employee.emergency_contact_name} />
            <Row label="Number"       value={employee.emergency_contact_number} />
            <Row label="Relationship" value={employee.relationship} />
          </Section>

          <Separator />

          <Section title="Government IDs">
            <Row label="TIN"       value={employee.tin} />
            <Row label="SSS"       value={employee.sss_number} />
            <Row label="Pag-IBIG"  value={employee.pagibig_number} />
            <Row label="PhilHealth" value={employee.philhealth_number} />
          </Section>

          <Separator />

          <Section title="Banking">
            <Row label="Bank Name"      value={employee.bank_name} />
            <Row label="Account Name"   value={employee.account_name} />
            <Row label="Account Number" value={employee.account_number} />
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}