import { Employee } from "@/types/employee";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  DollarSign,
  User,
  FileText,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeDetailsProps {
  employee: Employee;
  onEdit: () => void;
  onClose: () => void;
}

const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  on_leave: "bg-warning/10 text-warning border-warning/20",
  terminated: "bg-destructive/10 text-destructive border-destructive/20",
  suspended: "bg-muted text-muted-foreground border-muted",
};

const statusLabels = {
  active: "Active",
  on_leave: "On Leave",
  terminated: "Terminated",
  suspended: "Suspended",
};

export function EmployeeDetails({ employee, onEdit, onClose }: EmployeeDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-primary/20">
            {employee.photo_url ? (
              <img src={employee.photo_url} alt={`${employee.first_name} ${employee.last_name}`} className="object-cover" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {employee.first_name[0]}{employee.last_name[0]}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h2 className="font-display text-2xl font-semibold text-card-foreground">
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-muted-foreground">{employee.employee_id}</p>
            <Badge
              variant="outline"
              className={cn("mt-2 capitalize", statusStyles[employee.status])}
            >
              {statusLabels[employee.status]}
            </Badge>
          </div>
        </div>
        <Button onClick={onEdit} variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Contact Information */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-4 font-semibold text-card-foreground">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <a href={`mailto:${employee.email}`} className="text-primary hover:underline">
                    {employee.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">Address:</span>
                  <span className="flex-1">
                    {employee.address}, {employee.city}, {employee.province} {employee.zip_code}
                  </span>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-4 font-semibold text-card-foreground">Personal Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span>
                    {new Date(employee.date_of_birth).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="capitalize">{employee.gender}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {employee.emergency_contact_name && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-warning" />
                <h3 className="font-semibold text-card-foreground">Emergency Contact</h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  <span>{employee.emergency_contact_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <span>{employee.emergency_contact_phone}</span>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment" className="space-y-6 pt-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-4 font-semibold text-card-foreground">Position Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Department:</span>
                  <span>{employee.department_name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Position:</span>
                  <span>{employee.position}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Employment Type:</span>
                  <span className="capitalize">{employee.employment_type}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-4 font-semibold text-card-foreground">Compensation</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Monthly Salary:</span>
                  <span className="font-semibold text-primary">
                    ₱{employee.salary.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Hire Date:</span>
                  <span>
                    {new Date(employee.hire_date).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6 pt-6">
          {employee.documents && employee.documents.length > 0 ? (
            <div className="space-y-3">
              {employee.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-card-foreground">{doc.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{doc.type}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-medium text-card-foreground">No documents uploaded</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Documents like resume, contracts, and IDs will appear here.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="flex justify-end border-t border-border pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
