import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, LogIn, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClockInWidgetProps {
  employee: any;
  onSuccess?: () => void;
}

export function ClockInWidget({ employee, onSuccess }: ClockInWidgetProps) {
  const { toast } = useToast();
  const [clockStatus, setClockStatus] = useState<"in" | "out" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClockIn = async () => {
    setIsLoading(true);
    try {
      // In production, call API
      // const response = await fetch('/api/attendance/clock-in', {
      //   method: 'POST',
      //   body: JSON.stringify({ employee_id: employee.id }),
      // });
      
      toast({
        title: "Success",
        description: `${employee.first_name} clocked in at ${currentTime.toLocaleTimeString()}`,
      });
      
      onSuccess?.();
      setClockStatus("in");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clock in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    try {
      // In production, call API
      // const response = await fetch('/api/attendance/clock-out', {
      //   method: 'POST',
      //   body: JSON.stringify({ employee_id: employee.id }),
      // });
      
      toast({
        title: "Success",
        description: `${employee.first_name} clocked out at ${currentTime.toLocaleTimeString()}`,
      });
      
      onSuccess?.();
      setClockStatus(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clock out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Digital Clock */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-8">
          <div className="text-center space-y-4">
            <div className="text-6xl font-mono font-bold text-primary">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
            <div className="text-lg text-muted-foreground">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clock In/Out Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">CLOCK IN</p>
              <p className="font-mono text-xl font-semibold">--:--:--</p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">CLOCK OUT</p>
              <p className="font-mono text-xl font-semibold">--:--:--</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => {
                setClockStatus("in");
                setConfirmOpen(true);
              }}
              disabled={isLoading}
              className="h-16 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Clock In
            </Button>
            <Button
              size="lg"
              onClick={() => {
                setClockStatus("out");
                setConfirmOpen(true);
              }}
              disabled={isLoading}
              className="h-16 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Clock Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today's Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
              Not Clocked In
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Hours Worked</span>
            <span className="font-semibold">0.00 hours</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Minutes Late</span>
            <span className="font-semibold">0 minutes</span>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {clockStatus === "in"
                ? "Clock In to Work?"
                : "Clock Out from Work?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {clockStatus === "in"
                ? `Confirm that you are clocking in at ${currentTime.toLocaleTimeString()}`
                : `Confirm that you are clocking out at ${currentTime.toLocaleTimeString()}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Time</p>
            <p className="font-mono text-xl font-semibold">
              {currentTime.toLocaleTimeString()}
            </p>
          </div>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={clockStatus === "in" ? handleClockIn : handleClockOut}
            disabled={isLoading}
            className={
              clockStatus === "in"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }
          >
            {isLoading ? "Processing..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
