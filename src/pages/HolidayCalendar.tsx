import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHoliday } from "@/hooks/useHoliday";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  HOLIDAY_TYPE_LABELS, HOLIDAY_TYPE_MULTIPLIERS,
  type Holiday, type HolidayType,
} from "@/types/holiday";

// ── helpers ───────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<HolidayType, string> = {
  regular:             "bg-red-100 text-red-700 border-red-200",
  special_non_working: "bg-amber-50 text-amber-700 border-amber-200",
  special_working:     "bg-blue-50 text-blue-700 border-blue-200",
};

const DOT_COLOR: Record<HolidayType, string> = {
  regular:             "bg-red-500",
  special_non_working: "bg-amber-400",
  special_working:     "bg-blue-400",
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toMMDD(dateStr: string) {
  return dateStr.slice(5); // "2026-12-25" → "12-25"
}

// ── Add Holiday Dialog ────────────────────────────────────────────────────────

function AddHolidayDialog({
  open, onClose, onAdd, prefillDate,
}: {
  open: boolean;
  onClose: () => void;
  prefillDate?: string;
  onAdd: (data: Partial<Holiday>) => Promise<void>;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: prefillDate ?? "",
    holiday_type: "regular" as HolidayType,
    is_recurring: false,
    description: "",
  });

  useEffect(() => {
    if (prefillDate) setForm((p) => ({ ...p, date: prefillDate }));
  }, [prefillDate]);

  const handleSubmit = async () => {
    if (!form.name || !form.date) {
      toast({ title: "Name and date are required.", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await onAdd({
        ...form,
        pay_multiplier: HOLIDAY_TYPE_MULTIPLIERS[form.holiday_type],
      });
      toast({ title: "Holiday added." });
      setForm({ name: "", date: "", holiday_type: "regular", is_recurring: false, description: "" });
      onClose();
    } catch {
      toast({ title: "Failed to add holiday.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Add holiday</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Holiday name</label>
            <Input placeholder="e.g. Blue Lotus Foundation Day"
              value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <Select value={form.holiday_type}
              onValueChange={(v) => setForm((p) => ({ ...p, holiday_type: v as HolidayType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(HOLIDAY_TYPE_LABELS) as [HolidayType, string][]).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l} ({HOLIDAY_TYPE_MULTIPLIERS[v]}×)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.is_recurring}
              onChange={(e) => setForm((p) => ({ ...p, is_recurring: e.target.checked }))} />
            Repeat every year on this date
          </label>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Description (optional)</label>
            <Input placeholder="Notes…" value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Adding…" : "Add holiday"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Monthly calendar grid ─────────────────────────────────────────────────────

function MonthGrid({
  year, month, holidays, onDayClick,
}: {
  year: number;
  month: number;
  holidays: Holiday[];
  onDayClick: (dateStr: string) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const holidayMap: Record<string, Holiday> = {};
  holidays.forEach((h) => {
    const mmdd = toMMDD(h.date);
    holidayMap[mmdd] = h;
  });

  const today = new Date();
  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const mmdd = `${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const holiday = holidayMap[mmdd];
          const dateStr = `${year}-${mmdd}`;
          const isSun = (i % 7) === 0;

          return (
            <button
              key={i}
              onClick={() => onDayClick(dateStr)}
              className={`
                relative flex flex-col items-center justify-start pt-1 pb-0.5 rounded-md text-xs min-h-[40px]
                transition-colors hover:bg-muted/60
                ${isToday(day) ? "ring-1 ring-blue-400 bg-blue-50/40" : ""}
                ${holiday ? "bg-opacity-60" : ""}
                ${isSun ? "text-red-400" : "text-foreground"}
              `}
            >
              <span className={`font-medium ${isToday(day) ? "text-blue-600" : ""}`}>{day}</span>
              {holiday && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${DOT_COLOR[holiday.holiday_type]}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HolidayCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canManage = ["Admin", "HR Manager"].includes(user?.role ?? "");

  const { holidays, isLoading, fetchHolidays, createHoliday, deleteHoliday } = useHoliday();

  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [showAdd,   setShowAdd]   = useState(false);
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const [deletingId, setDeletingId]   = useState<number | null>(null);

  useEffect(() => { fetchHolidays(viewYear); }, [viewYear, fetchHolidays]);

  // Holidays for current viewed month
  const monthHolidays = holidays.filter((h) => {
    const d = new Date(h.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  // All holidays sorted for the list view
  const sortedAll = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteHoliday(id);
      toast({ title: "Holiday removed." });
      fetchHolidays(viewYear);
    } catch {
      toast({ title: "Failed to remove.", variant: "destructive" });
    } finally { setDeletingId(null); }
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">Holiday calendar</h1>
        <div className="flex items-center gap-2">
          <Select value={String(viewYear)}
            onValueChange={(v) => setViewYear(Number(v))}>
            <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManage && (
            <Button size="sm" className="gap-1.5" onClick={() => { setPrefillDate(undefined); setShowAdd(true); }}>
              <Plus className="w-3.5 h-3.5" />Add holiday
            </Button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        {(Object.entries(HOLIDAY_TYPE_LABELS) as [HolidayType, string][]).map(([k, l]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${DOT_COLOR[k]}`} />
            {l} ({HOLIDAY_TYPE_MULTIPLIERS[k]}×)
          </span>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar */}
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-medium">{MONTHS[viewMonth]} {viewYear}</h2>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <MonthGrid
            year={viewYear} month={viewMonth}
            holidays={monthHolidays}
            onDayClick={(dateStr) => {
              if (!canManage) return;
              setPrefillDate(dateStr);
              setShowAdd(true);
            }}
          />

          {/* Month holiday list */}
          {monthHolidays.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-border/60 pt-4">
              {monthHolidays.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${DOT_COLOR[h.holiday_type]}`} />
                    <span className="font-medium">{h.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(h.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    </span>
                    {h.is_recurring && (
                      <span className="text-[10px] text-muted-foreground bg-muted rounded px-1">recurring</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${TYPE_COLOR[h.holiday_type]} border text-[10px] rounded-full px-1.5`}>
                      {h.pay_multiplier}×
                    </Badge>
                    {canManage && (
                      <button onClick={() => handleDelete(h.id)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                        disabled={deletingId === h.id}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Full year list */}
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-1 h-fit">
          <p className="text-sm font-medium mb-3">All {viewYear} holidays</p>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : sortedAll.length === 0 ? (
            <p className="text-xs text-muted-foreground">No holidays added yet.</p>
          ) : (
            sortedAll.map((h) => (
              <div key={h.id}
                className="flex items-center gap-2 py-1.5 border-b border-border/40 last:border-0 text-xs">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLOR[h.holiday_type]}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{h.name}</p>
                  <p className="text-muted-foreground">
                    {new Date(h.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    {" · "}{h.pay_multiplier}× pay
                  </p>
                </div>
                {canManage && (
                  <button onClick={() => handleDelete(h.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                    disabled={deletingId === h.id}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <AddHolidayDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        prefillDate={prefillDate}
        onAdd={async (data) => {
          await createHoliday(data);
          fetchHolidays(viewYear);
        }}
      />
    </div>
  );
}