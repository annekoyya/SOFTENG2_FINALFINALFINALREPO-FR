import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", present: 145, absent: 5, late: 8 },
  { day: "Tue", present: 148, absent: 3, late: 7 },
  { day: "Wed", present: 142, absent: 8, late: 10 },
  { day: "Thu", present: 150, absent: 2, late: 6 },
  { day: "Fri", present: 146, absent: 4, late: 8 },
  { day: "Sat", present: 120, absent: 10, late: 5 },
  { day: "Sun", present: 85, absent: 15, late: 3 },
];

export function AttendanceChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="font-display text-lg font-semibold text-card-foreground">
          Weekly Attendance
        </h3>
        <p className="text-sm text-muted-foreground">
          Attendance trends for the current week
        </p>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-secondary" />
          <span className="text-sm text-muted-foreground">Late</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-destructive" />
          <span className="text-sm text-muted-foreground">Absent</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(222, 47%, 18%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(222, 47%, 18%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
            <XAxis
              dataKey="day"
              tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
              axisLine={{ stroke: "hsl(214, 32%, 91%)" }}
            />
            <YAxis
              tick={{ fill: "hsl(215, 16%, 47%)", fontSize: 12 }}
              axisLine={{ stroke: "hsl(214, 32%, 91%)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(214, 32%, 91%)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="present"
              stroke="hsl(222, 47%, 18%)"
              strokeWidth={2}
              fill="url(#colorPresent)"
            />
            <Area
              type="monotone"
              dataKey="late"
              stroke="hsl(45, 93%, 47%)"
              strokeWidth={2}
              fill="url(#colorLate)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
