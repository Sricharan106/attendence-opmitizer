# Attendance Optimization Engine

The Attendance Optimization Engine is a predictive leave-planning system designed to maximize the number of leave days a student can take while maintaining the required **80% attendance threshold**.

The engine uses a greedy scoring algorithm that continuously evaluates all remaining working days and selects the most beneficial leave opportunities based on calendar structure, holiday proximity, workload distribution, and attendance constraints.

---

## Objective

Given:

- Historical attendance records
- Academic timetable
- Institutional holidays
- Minimum attendance requirement (80%)

The engine determines the optimal set of future leave days that maximize time off without violating attendance requirements.

---

## Data Sources

### Timetable

Defines the number of academic periods scheduled for each weekday.

```ts
export const timetable = timetableData;
```

### Holidays

Contains all known institutional holidays.

```ts
export interface Holiday {
  date: string;
  occasion: string;
}
```

### Attendance History

Stores attendance records used to calculate the current attendance percentage and future leave budget.

```ts
export interface AttendanceRecord {
  date: string;
  periods_attended: number;
  periods_total: number;
  status: "present" | "absent" | "partial" | "holiday";
}
```

---

## Scoring System

Each candidate working day is assigned a score. Higher scores indicate more valuable leave opportunities.

### 1. Holiday Block Optimization

The engine prioritizes leaves that create longer uninterrupted breaks.

#### Three-Day Break Creation

A leave receives a large bonus when it creates a continuous three-day non-working block.

```
+800 points
```

Example:

```
Saturday (Holiday)
Sunday   (Holiday)
Monday   (Leave)
```

#### Extended Break Growth

A smaller bonus is applied when a leave extends an existing break beyond three days.

```
+100 points
```

Example:

```
Saturday (Holiday)
Sunday (Holiday)
Monday (Holiday)
Tuesday (Leave)
```

---

### 2. Workload and Fatigue Analysis

The engine evaluates nearby working-day streaks to identify useful recovery opportunities.

#### Fatigue Reduction

Leaves that split long continuous study periods are rewarded.

```
+25 points × total streak length
```

Example:

```
Mon Tue Wed Thu Fri
        ^
        Leave
```

Longer uninterrupted working stretches produce higher scores.

#### Attendance Safety Rule

Leaves are heavily penalized when they create excessively long uninterrupted attendance stretches.

```
-1000 points
```

Applied when either adjacent working streak reaches five or more consecutive working days.

This prevents inefficient leave placement and preserves attendance flexibility later in the semester.

---

### 3. Mid-Week Optimization

Mid-week leaves often provide greater perceived recovery than leaves attached to weekends.

#### Wednesday

```
+150 points
```

#### Thursday

```
+150 points
```

These days are preferred because they break long academic weeks into smaller segments.

---

### 4. Weekly Distribution

To avoid concentrating all leaves into a small timeframe, the engine encourages leave diversity.

#### New Week Bonus

```
+100 points
```

Applied when no leave has already been scheduled during that calendar week.

---

## Optimization Process

### Step 1: Generate Future Calendar

The engine creates a calendar of all remaining academic days and holidays.

### Step 2: Calculate Leave Budget

Using historical attendance data and future scheduled periods, the engine computes the maximum number of leave days that can be taken while maintaining at least 80% attendance.

### Step 3: Evaluate Every Candidate Day

Every remaining working day is scored using the rules described above.

### Step 4: Select Highest-Value Leave

The day with the highest score is converted into a leave day.

### Step 5: Recalculate Scores

Because each selected leave changes future holiday blocks and streak patterns, all candidate scores are recalculated.

### Step 6: Repeat

The process continues until the available leave budget is exhausted.

### Step 7: Generate Final Schedule

Selected leave days are sorted chronologically and returned as the recommended attendance strategy.

---

## Algorithm Characteristics

### Greedy Selection

The engine always chooses the highest-scoring leave available at each iteration.

### Dynamic Re-Evaluation

Scores are recalculated after every selection to account for newly created holiday blocks and workload patterns.

### Attendance-Constrained Planning

All recommendations are generated within the mathematically safe attendance budget calculated from actual attendance records.

### Deterministic Output

Given identical attendance data, timetable configuration, holidays, and attendance threshold, the engine will always produce the same recommendation set.

---

## Utility Functions

### Holiday Detection

```ts
export function isHoliday(dateStr: string) {
  return holidays.some((h) => h.date === dateStr);
}
```

Checks whether a given date is an institutional holiday.

### Weekday Resolution

```ts
export function getWeekdayName(date: Date): string {
  const dayIndex = date.getDay();

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;

  return days[dayIndex]!;
}
```

Returns the weekday name associated with a JavaScript `Date` object.

---

## Future Improvements

Potential enhancements include:

- Subject-specific attendance optimization
- Weighted attendance importance by course
- Semester-wide predictive simulations
- Attendance trend forecasting
- Multiple optimization strategies (Greedy, Dynamic Programming, Genetic Algorithms)
- Personalized fatigue and workload models
