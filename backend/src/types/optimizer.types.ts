export interface CalendarDay {
  date: string;
  type: "holiday" | "leave" | "working";
}

export interface Recommendation {
  date: string;
  weekday: string;
  score: number;
  reason: string;
}

export interface Holiday {
  date: string;
  occasion: string;
}

export interface AttendanceRecord {
  date: string;
  periods_attended: number;
  periods_total: number;
  status: "present" | "absent" | "partial" | "holiday" | (string & {});
}
