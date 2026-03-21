// src/components/attendance/ClockInWidget.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAttendance } from "@/hooks/useAttendance";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ClockInWidgetProps {
  employee: { id: number | string; name?: string };
  onSuccess?: () => void;
}

export function ClockInWidget({ employee, onSuccess }: ClockInWidgetProps) {
  const { toast }                           = useToast();
  const { clockIn, clockOut, attendances, isLoading } = useAttendance();

  const [currentTime, setCurrentTime]       = useState(new Date());
  const [actionLoading, setActionLoading]   = useState(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Find today's attendance record for this employee
  const todayStr   = new Date().toISOString().split("T")[0];
  const todayRecord = attendances.find((a) => a.date === todayStr);

  const isClockedIn  = !!todayRecord?.time_in && !todayRecord?.time_out;
  const isClockedOut = !!todayRecord?.time_in && !!todayRecord?.time_out;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const formatTimeDisplay = (timeStr: string) => {
    const [h, m] = timeStr.split(":");
    const date   = new Date();
    date.setHours(Number(h), Number(m));
    return date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  };

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      await clockIn(String(employee.id));
      toast({ title: "Clocked In ✓", description: `You clocked in at ${formatTime(new Date())}` });
      onSuccess?.();
    } catch {
      toast({ title: "Clock In Failed", description: "Please try again", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      await clockOut(String(employee.id));
      toast({ title: "Clocked Out ✓", description: `You clocked out at ${formatTime(new Date())}` });
      onSuccess?.();
    } catch {
      toast({ title: "Clock Out Failed", description: "Please try again", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Live Clock Card */}
      <Card className="text-center">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-center gap-2 text-base text-muted-foreground font-normal">
            <Clock className="h-4 w-4" />
            Current Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-5xl font-bold tracking-tight text-foreground">
            {formatTime(currentTime)}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{formatDate(currentTime)}</p>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Current status badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Today's Status</span>
            {isClockedOut ? (
              <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
            ) : isClockedIn ? (
              <Badge className="bg-green-100 text-green-800">
                <span className="mr-1 h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse" />
                Clocked In
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Not Started</Badge>
            )}
          </div>

          {/* Time in / time out display */}
          <div className="grid grid-cols-2 gap-3">
            <div className={cn(
              "rounded-lg border p-3 text-center",
              todayRecord?.time_in ? "border-green-200 bg-green-50" : "border-border bg-muted/30"
            )}>
              <p className="text-xs text-muted-foreground mb-1">Clock In</p>
              <p className={cn("font-mono font-semibold text-lg", todayRecord?.time_in ? "text-green-700" : "text-muted-foreground")}>
                {todayRecord?.time_in ? formatTimeDisplay(todayRecord.time_in) : "--:--"}
              </p>
            </div>
            <div className={cn(
              "rounded-lg border p-3 text-center",
              todayRecord?.time_out ? "border-blue-200 bg-blue-50" : "border-border bg-muted/30"
            )}>
              <p className="text-xs text-muted-foreground mb-1">Clock Out</p>
              <p className={cn("font-mono font-semibold text-lg", todayRecord?.time_out ? "text-blue-700" : "text-muted-foreground")}>
                {todayRecord?.time_out ? formatTimeDisplay(todayRecord.time_out) : "--:--"}
              </p>
            </div>
          </div>

          {/* Hours worked */}
          {todayRecord?.hours_worked && Number(todayRecord.hours_worked) > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Hours Worked</p>
              <p className="font-mono font-semibold text-lg">
                {Number(todayRecord.hours_worked).toFixed(2)} hrs
              </p>
            </div>
          )}

          {/* Late warning */}
          {todayRecord?.minutes_late && Number(todayRecord.minutes_late) > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-700">
                {todayRecord.within_grace_period
                  ? `${todayRecord.minutes_late} min late — within grace period`
                  : `${todayRecord.minutes_late} min late`}
              </p>
            </div>
          )}

          {/* Already done for the day */}
          {isClockedOut && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-sm text-green-700">You've completed your shift for today.</p>
            </div>
          )}

          {/* Action Button */}
          {!isClockedOut && (
            <Button
              onClick={isClockedIn ? handleClockOut : handleClockIn}
              disabled={actionLoading || isLoading}
              size="lg"
              className={cn(
                "w-full text-white font-semibold",
                isClockedIn
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              )}
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : isClockedIn ? (
                <LogOut className="mr-2 h-5 w-5" />
              ) : (
                <LogIn className="mr-2 h-5 w-5" />
              )}
              {actionLoading
                ? "Processing..."
                : isClockedIn
                ? "Clock Out"
                : "Clock In"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}