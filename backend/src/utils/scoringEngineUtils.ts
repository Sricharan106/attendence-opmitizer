import { type CalendarDay, type Holiday } from "../types/optimizer.types";

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekdayName(date: Date): string {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;
  return days[date.getDay()]!;
}

// Counts continuous non-working blocks (both institutional holidays and user leaves)
export function getHolidayStretchLength(
  dateIndex: number,
  calendar: CalendarDay[],
): number {
  let count = 0;

  let left = dateIndex - 1;
  while (
    left >= 0 &&
    (calendar[left]?.type === "holiday" || calendar[left]?.type === "leave")
  ) {
    count++;
    left--;
  }

  let right = dateIndex + 1;
  while (
    right < calendar.length &&
    (calendar[right]?.type === "holiday" || calendar[right]?.type === "leave")
  ) {
    count++;
    right++;
  }

  return count;
}

// Converts a working day explicitly into a user "leave" type state
export function simulateLeave(
  date: string,
  calendar: CalendarDay[],
): CalendarDay[] {
  return calendar.map((day) =>
    day.date === date ? { ...day, type: "leave" } : day,
  );
}

export function getWeekNumber(dateString: string): number {
  const date = new Date(dateString);
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getWorkStreakLength(
  index: number,
  calendar: CalendarDay[],
): number {
  let streak = 1;

  let left = index - 1;
  while (left >= 0 && calendar[left]?.type === "working") {
    streak++;
    left--;
  }

  let right = index + 1;
  while (right < calendar.length && calendar[right]?.type === "working") {
    streak++;
    right++;
  }

  return streak;
}

export function calculateLongestWorkStreak(calendar: CalendarDay[]): number {
  let streak = 0;
  let longest = 0;

  for (const day of calendar) {
    if (day.type === "working") {
      streak++;
      longest = Math.max(longest, streak);
    } else {
      streak = 0;
    }
  }

  return longest;
}

export function getAllWorkStreaks(calendar: CalendarDay[]): number[] {
  const streaks: number[] = [];
  let currentStreak = 0;

  for (const day of calendar) {
    if (day.type === "working") {
      currentStreak++;
    } else {
      if (currentStreak > 0) {
        streaks.push(currentStreak);
        currentStreak = 0;
      }
    }
  }
  if (currentStreak > 0) streaks.push(currentStreak);
  return streaks;
}
