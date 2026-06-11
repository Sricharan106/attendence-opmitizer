import {
  type CalendarDay,
  type Recommendation,
  type Holiday,
  type AttendanceRecord,
} from "../types/optimizer.types.js";

import {
  getWeekNumber,
  getHolidayStretchLength,
  getWeekdayName,
  simulateLeave,
  formatDate,
  getWorkStreakLength,
} from "../utils/scoringEngineUtils.js";

export function generateRecommendations(
  startDate: string,
  endDate: string,
  TARGET_ATTENDANCE: number = 80,
  PERIODS_PER_DAY: number = 6,
  attendanceHistory: AttendanceRecord[],
  holidays: Holiday[],
): Recommendation[] {
  // ==========================================
  // 1. CONFIGURATION & SEMESTER GENERATION
  // ==========================================
  const semesterCalendar: CalendarDay[] = [];

  const currentLoopDate = new Date(startDate);
  const end = new Date(endDate);

  function isHoliday(dateStr: string) {
    return holidays.some((h) => h.date === dateStr);
  }

  // FIXED: Loop using safe accumulator value assignment without reference mutations
  while (currentLoopDate <= end) {
    const formatted = formatDate(currentLoopDate);
    const whichDay: string = getWeekdayName(currentLoopDate) as string;
    const working: "holiday" | "working" =
      whichDay === "sunday" || isHoliday(formatted) ? "holiday" : "working";

    semesterCalendar.push({ date: formatted, type: working });

    // Progress loop safely
    currentLoopDate.setDate(currentLoopDate.getDate() + 1);
  }

  // ==========================================
  // 2. CALCULATE HISTORY & FUTURE BOUNDARIES
  // ==========================================
  let pastPeriodsConducted = 0;
  let pastPeriodsAttended = 0;

  attendanceHistory.forEach((day) => {
    pastPeriodsConducted += day.periods_total;
    pastPeriodsAttended += day.periods_attended;
  });

  const lastHistoryDate: string =
    attendanceHistory[attendanceHistory.length - 1]?.date ?? "";

  const futureWorkingDays = semesterCalendar.filter((day) => {
    return day.type === "working" && day.date > lastHistoryDate;
  });

  // ==========================================
  // 3. END-OF-SEMESTER PREDICTIVE BUDGET MATH
  // ==========================================
  const totalFuturePeriods = futureWorkingDays.length * PERIODS_PER_DAY;
  const maxPossibleConducted = pastPeriodsConducted + totalFuturePeriods;
  const maxPossibleAttended = pastPeriodsAttended + totalFuturePeriods;

  const totalAllowedAbsences = Math.floor(
    maxPossibleAttended - maxPossibleConducted * (TARGET_ATTENDANCE / 100),
  );

  const safeBunkDaysBudget = Math.max(
    0,
    Math.floor(totalAllowedAbsences / PERIODS_PER_DAY),
  );

  // ==========================================
  // 4. GREEDY SELECTION ENGINE
  // ==========================================
  let optimizedCalendar = [...semesterCalendar];
  const finalBunkTargets: Recommendation[] = [];
  const chosenWeeks: Set<number> = new Set();

  // Find all distinct future weeks that contain working days to understand our coverage target
  const uniqueFutureWeeks = new Set<number>();
  optimizedCalendar.forEach((day) => {
    if (day.type === "working" && day.date > lastHistoryDate) {
      uniqueFutureWeeks.add(getWeekNumber(day.date));
    }
  });

  for (let i = 0; i < safeBunkDaysBudget; i++) {
    let bestDay: Recommendation | null = null;
    let highestScore = -Infinity;

    optimizedCalendar.forEach((day, index) => {
      if (day.type !== "working") return;
      if (day.date <= lastHistoryDate) return;

      const [year, month, dateDay]: [number, number, number] = day.date
        .split("-")
        .map(Number) as [number, number, number];

      const parsedDate = new Date(year, month - 1, dateDay);
      const weekdayStr = getWeekdayName(parsedDate) as string;
      const currentWeek = getWeekNumber(day.date);

      let score = 0;
      const reasons: string[] = [];

      // 1. HOLIDAY STRETCH TARGETING
      const existingAdjacentHolidays = getHolidayStretchLength(
        index,
        optimizedCalendar,
      );
      const newTotalHolidayBlockLength = existingAdjacentHolidays + 1;

      if (newTotalHolidayBlockLength === 3) {
        score += 800;
        reasons.push(`PERFECT 3-DAY HOLIDAY BLOCK`);
      } else if (newTotalHolidayBlockLength > 3) {
        score += 100;
        reasons.push(
          `Extends a large ${newTotalHolidayBlockLength}-day holiday block`,
        );
      }

      // 2. LOCAL STREAK ANALYSIS
      let leftWorkStreak = 0;
      let left = index - 1;
      while (left >= 0 && optimizedCalendar[left]?.type === "working") {
        leftWorkStreak++;
        left--;
      }

      let rightWorkStreak = 0;
      let right = index + 1;
      while (
        right < optimizedCalendar.length &&
        optimizedCalendar[right]?.type === "working"
      ) {
        rightWorkStreak++;
        right++;
      }

      // Heavy penalty for marathon 5+ work grinds
      if (leftWorkStreak >= 5 || rightWorkStreak >= 5) {
        score -= 1000;
      }

      const totalCurrentStreak = getWorkStreakLength(index, optimizedCalendar);
      score += totalCurrentStreak * 25;
      if (totalCurrentStreak > 3) {
        reasons.push("Breaks up a heavy work streak");
      }

      // 3. MID-WEEK PACING NUDGE
      if (weekdayStr === "wednesday" || weekdayStr === "thursday") {
        score += 150;
        reasons.push("Strategic mid-week split");
      }

      // 4. MANDATORY WEEKLY DISTRIBUTION RULE (CRITICAL FIX)
      // Check if there are still completely empty weeks left to fix
      const partsOfSemesterStillEmpty =
        chosenWeeks.size < uniqueFutureWeeks.size;

      if (!chosenWeeks.has(currentWeek)) {
        // Massive jackpot bonus to ensure empty weeks take priority over stacking double leaves
        score += partsOfSemesterStillEmpty ? 1500 : 200;
        reasons.push("Spreads leave into an empty week");
      } else {
        // Soft penalty for trying to pile multiple leaves into the same week while others starve
        if (partsOfSemesterStillEmpty) {
          score -= 500;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestDay = {
          date: day.date,
          weekday: weekdayStr.toUpperCase(),
          score: score,
          reason: reasons.length ? reasons.join(" | ") : "Optimized pacing day",
        };
      }
    });

    if (!bestDay) break;

    const bestDayThisRound = bestDay as Recommendation;

    finalBunkTargets.push(bestDayThisRound);
    chosenWeeks.add(getWeekNumber(bestDayThisRound.date));
    optimizedCalendar = simulateLeave(bestDayThisRound.date, optimizedCalendar);
  }

  // sort chronologically for clean output
  // finalBunkTargets.sort((a, b) => {
  //   a.date.localeCompare(b.date);
  // });

  // ==========================================
  // 5. ACCURATE ATTENDANCE VALIDATION
  // ==========================================
  let plannedLeavesCount = 0;
  optimizedCalendar.forEach((day) => {
    if (day.type === "leave" && day.date > lastHistoryDate)
      plannedLeavesCount++;
  });

  const finalPredictedAttended =
    maxPossibleAttended - plannedLeavesCount * PERIODS_PER_DAY;
  const finalCumulativeAttendancePct =
    (finalPredictedAttended / maxPossibleConducted) * 100;

  // Validation Check: fallback gracefully
  if (finalCumulativeAttendancePct < TARGET_ATTENDANCE) {
    return [];
  }

  return finalBunkTargets;
}
