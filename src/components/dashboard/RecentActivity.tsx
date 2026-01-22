import { Clock, UserPlus, FileText, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "hire",
    title: "New employee onboarded",
    description: "Juan Dela Cruz joined as Front Desk Officer",
    time: "2 hours ago",
    icon: UserPlus,
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  {
    id: 2,
    type: "attendance",
    title: "Attendance report generated",
    description: "Weekly attendance report is ready for review",
    time: "4 hours ago",
    icon: Clock,
    iconBg: "bg-info/10",
    iconColor: "text-info",
  },
  {
    id: 3,
    type: "payroll",
    title: "Payroll approved",
    description: "January 2026 payroll has been approved",
    time: "Yesterday",
    icon: FileText,
    iconBg: "bg-secondary/20",
    iconColor: "text-secondary-foreground",
  },
  {
    id: 4,
    type: "leave",
    title: "Leave request approved",
    description: "Maria Santos leave request approved",
    time: "Yesterday",
    icon: CheckCircle,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
];

export function RecentActivity() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-display text-lg font-semibold text-card-foreground">
        Recent Activity
      </h3>
      <p className="text-sm text-muted-foreground">Latest updates across the system</p>

      <div className="mt-6 space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                activity.iconBg
              )}
            >
              <activity.icon className={cn("h-5 w-5", activity.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-card-foreground">{activity.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                {activity.description}
              </p>
            </div>
            <span className="flex-shrink-0 text-xs text-muted-foreground">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
