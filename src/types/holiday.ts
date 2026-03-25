// ── types/holiday.ts ──────────────────────────────────────────────────────────

export type HolidayType = "regular" | "special_non_working" | "special_working";

export interface Holiday {
  id: number;
  name: string;
  date: string;          // YYYY-MM-DD
  holiday_type: HolidayType;
  is_recurring: boolean; // true = same date every year
  pay_multiplier: number; // 1.0 = regular day, 1.3 = special NW, 2.0 = regular holiday
  description?: string;
  created_by?: number;
}

export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  regular:              "Regular holiday",
  special_non_working:  "Special non-working",
  special_working:      "Special working",
};

export const HOLIDAY_TYPE_MULTIPLIERS: Record<HolidayType, number> = {
  regular:             2.00,
  special_non_working: 1.30,
  special_working:     1.30,
};

// PH national holidays seeded by default
export const PH_NATIONAL_HOLIDAYS = [
  { name: "New Year's Day",              date: "01-01", holiday_type: "regular",             is_recurring: true },
  { name: "Araw ng Kagitingan",          date: "04-09", holiday_type: "regular",             is_recurring: true },
  { name: "Maundy Thursday",             date: "",      holiday_type: "regular",             is_recurring: false },
  { name: "Good Friday",                 date: "",      holiday_type: "regular",             is_recurring: false },
  { name: "Labor Day",                   date: "05-01", holiday_type: "regular",             is_recurring: true },
  { name: "Independence Day",            date: "06-12", holiday_type: "regular",             is_recurring: true },
  { name: "National Heroes Day",         date: "",      holiday_type: "regular",             is_recurring: false },
  { name: "Bonifacio Day",               date: "11-30", holiday_type: "regular",             is_recurring: true },
  { name: "Christmas Day",               date: "12-25", holiday_type: "regular",             is_recurring: true },
  { name: "Rizal Day",                   date: "12-30", holiday_type: "regular",             is_recurring: true },
  { name: "All Saints Day",              date: "11-01", holiday_type: "special_non_working", is_recurring: true },
  { name: "Christmas Eve",               date: "12-24", holiday_type: "special_non_working", is_recurring: true },
  { name: "Last Day of the Year",        date: "12-31", holiday_type: "special_non_working", is_recurring: true },
];