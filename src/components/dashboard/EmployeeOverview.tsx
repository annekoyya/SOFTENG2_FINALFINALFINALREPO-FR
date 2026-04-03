import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const employees = [
  {
    id: 1,
    name: "Maria Santos",
    position: "Front Desk Manager",
    department: "Front Office",
    status: "Active",
    initials: "MS",
  },
  {
    id: 2,
    name: "Juan Dela Cruz",
    position: "Housekeeping Supervisor",
    department: "Housekeeping",
    status: "Active",
    initials: "JD",
  },
  {
    id: 3,
    name: "Ana Reyes",
    position: "Restaurant Manager",
    department: "F&B",
    status: "On Leave",
    initials: "AR",
  },
  {
    id: 4,
    name: "Carlos Mendoza",
    position: "Maintenance Engineer",
    department: "Engineering",
    status: "Active",
    initials: "CM",
  },
  {
    id: 5,
    name: "Isabel Garcia",
    position: "HR Coordinator",
    department: "Human Resources",
    status: "Active",
    initials: "IG",
  },
];

const statusStyles = {
  Active: "bg-success/10 text-success border-success/20",
  "On Leave": "bg-warning/10 text-warning border-warning/20",
  Inactive: "bg-muted text-muted-foreground border-muted",
};

export function EmployeeOverview() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <h3 className="font-display text-lg font-semibold text-card-foreground">
            Employee Directory
          </h3>
          <p className="text-sm text-muted-foreground">Quick view of your team</p>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <div className="divide-y divide-border">
        {employees.map((employee, index) => (
          <div
            key={employee.id}
            className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50 animate-fade-in"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                  {employee.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-card-foreground">{employee.name}</p>
                <p className="text-sm text-muted-foreground">
                  {employee.position} • {employee.department}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "font-normal",
                  statusStyles[employee.status as keyof typeof statusStyles]
                )}
              >
                {employee.status}
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
