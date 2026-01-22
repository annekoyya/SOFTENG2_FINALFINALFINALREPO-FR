import { UserPlus, Clock, FileText, Calendar, Send, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "Add Employee",
    icon: UserPlus,
    variant: "primary" as const,
    description: "Register new staff member",
  },
  {
    label: "Record Attendance",
    icon: Clock,
    variant: "secondary" as const,
    description: "Log time in/out",
  },
  {
    label: "Run Payroll",
    icon: FileText,
    variant: "outline" as const,
    description: "Process monthly payroll",
  },
  {
    label: "Schedule Training",
    icon: Calendar,
    variant: "outline" as const,
    description: "Plan training sessions",
  },
  {
    label: "Send Announcement",
    icon: Send,
    variant: "outline" as const,
    description: "Notify all employees",
  },
  {
    label: "Export Reports",
    icon: Download,
    variant: "outline" as const,
    description: "Download HR reports",
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-display text-lg font-semibold text-card-foreground">
        Quick Actions
      </h3>
      <p className="text-sm text-muted-foreground">Common tasks at your fingertips</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Button
            key={action.label}
            variant={action.variant === "primary" ? "default" : action.variant === "secondary" ? "secondary" : "outline"}
            className={cn(
              "h-auto flex-col items-start gap-2 p-4 text-left animate-fade-in",
              action.variant === "primary" && "bg-gradient-primary hover:opacity-90",
              action.variant === "secondary" && "bg-gradient-gold hover:opacity-90 text-secondary-foreground"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <action.icon className="h-5 w-5" />
            <div>
              <p className="font-medium">{action.label}</p>
              <p className={cn(
                "text-xs",
                action.variant === "outline" ? "text-muted-foreground" : "opacity-80"
              )}>
                {action.description}
              </p>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
