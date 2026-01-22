import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  variant?: "default" | "primary" | "gold";
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  variant = "default",
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:shadow-lg",
        variant === "default" && "bg-card border border-border",
        variant === "primary" && "bg-gradient-primary text-primary-foreground",
        variant === "gold" && "bg-gradient-gold text-secondary-foreground"
      )}
    >
      {/* Background decoration */}
      <div
        className={cn(
          "absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-150",
          variant === "default" && "bg-primary",
          variant === "primary" && "bg-white",
          variant === "gold" && "bg-white"
        )}
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg",
              variant === "default" && "bg-primary/10",
              variant === "primary" && "bg-white/20",
              variant === "gold" && "bg-white/30"
            )}
          >
            <Icon
              className={cn(
                "h-6 w-6",
                variant === "default" && "text-primary",
                variant === "primary" && "text-primary-foreground",
                variant === "gold" && "text-secondary-foreground"
              )}
            />
          </div>
          {change && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                changeType === "positive" && "bg-success/20 text-success",
                changeType === "negative" && "bg-destructive/20 text-destructive",
                changeType === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {change}
            </span>
          )}
        </div>

        <div className="mt-4">
          <p
            className={cn(
              "text-sm font-medium",
              variant === "default" && "text-muted-foreground",
              variant !== "default" && "opacity-80"
            )}
          >
            {title}
          </p>
          <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}
