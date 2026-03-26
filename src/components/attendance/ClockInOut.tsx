// src/components/attendance/ClockInOut.tsx
// Self-service clock-in / clock-out tied to the employee's assigned shift.
// Shows current time, shift window, and prevents clocking outside shift hours.

import { useState, useEffect } from "react";
import { authFetch } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Clock, LogIn, LogOut, AlertCircle } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface TodayStatus {
  has_clocked_in:  boolean;
  has_clocked_out: boolean;
  check_in?:       string;  // "08:03"
  check_out?:      string;
  status?:         string;  // present | late | on_leave
  shift_start?:    string;  // "08:00"
  shift_end?:      string;  // "17:00"
  shift_name?:     string;  // "Morning shift"
  is_on_leave:     boolean;
  is_holiday:      boolean;
  holiday_name?:   string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function now() {
  return new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function todayDate() {
  return new Date().toLocaleDateString("en-PH", { dateStyle: "full" });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClockInOut() {
  const { toast } = useToast();
  const [time,    setTime]    = useState(now());
  const [status,  setStatus]  = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch today's status
  const fetchStatus = async () => {
    try {
      const res  = await authFetch("/api/attendance/today");
      setStatus(await res.json());
    } catch {}
  };
  useEffect(() => { fetchStatus(); }, []);

  const handleClock = async (type: "in" | "out") => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/attendance/clock-${type}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      toast({ title: type === "in" ? "Clocked in successfully." : "Clocked out. Have a good rest!" });
      fetchStatus();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const canClockIn  = status && !status.has_clocked_in  && !status.is_on_leave && !status.is_holiday;
  const canClockOut = status && status.has_clocked_in   && !status.has_clocked_out;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4 max-w-sm">
      {/* Clock */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{todayDate()}</span>
        </div>
        <p className="text-3xl font-mono font-semibold tracking-tight">{time}</p>
      </div>

      {/* Shift info */}
      {status?.shift_name && (
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-center">
          <span className="font-medium">{status.shift_name}</span>
          {status.shift_start && status.shift_end && (
            <span className="text-muted-foreground ml-2">
              {status.shift_start} – {status.shift_end}
            </span>
          )}
        </div>
      )}

      {/* On leave / holiday */}
      {status?.is_on_leave && (
        <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5" />
          You are on approved leave today.
        </div>
      )}
      {status?.is_holiday && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5" />
          {status.holiday_name ?? "Holiday"} — no attendance required.
        </div>
      )}

      {/* Today's record */}
      {status && (status.check_in || status.check_out) && (
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-muted-foreground">Clock in</p>
            <p className="font-semibold mt-0.5">{status.check_in ?? "—"}</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-muted-foreground">Clock out</p>
            <p className="font-semibold mt-0.5">{status.check_out ?? "—"}</p>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <Button
          className="flex-1 gap-2"
          disabled={!canClockIn || loading}
          onClick={() => handleClock("in")}
        >
          <LogIn className="w-4 h-4" />
          Clock in
        </Button>
        <Button
          className="flex-1 gap-2"
          variant="outline"
          disabled={!canClockOut || loading}
          onClick={() => handleClock("out")}
        >
          <LogOut className="w-4 h-4" />
          Clock out
        </Button>
      </div>

      {status?.has_clocked_out && (
        <p className="text-xs text-center text-muted-foreground">
          You have completed your attendance for today.
        </p>
      )}
    </div>
  );
}