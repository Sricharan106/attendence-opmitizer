import timetableData from "./timetable.json" with { type: "json" };
import holidayData from "./holidays.json" with { type: "json" };
import attendanceData from "./attendance.json" with { type: "json" };

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

export const timetable = timetableData;
export const holidays: Holiday[] = holidayData.holidays;
export const attendanceHistory: AttendanceRecord[] = attendanceData.history;
