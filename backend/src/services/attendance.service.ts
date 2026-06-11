import { pool } from "../db/postgres.js";

interface AttendanceRecord {
  id?: number;
  user_id: number;
  log_date: string; // YYYY-MM-DD
  periods_total: number;
  periods_attended: number;
  status: string;
}

// Getter: Fetch full history for a specific user
export async function getAttendanceHistory(
  userId: number,
): Promise<AttendanceRecord[]> {
  const result = await pool.query(
    `
    SELECT id, user_id, log_date::TEXT, periods_total, periods_attended, status
    FROM attendance_history
    WHERE user_id = $1
    ORDER BY log_date ASC;
    `,
    [userId],
  );

  return result.rows;
}

// Setter: Upsert attendance (Insert or Update if user_id + log_date exists)
export async function saveAttendanceRecord(
  record: Omit<AttendanceRecord, "id">,
): Promise<AttendanceRecord> {
  const { user_id, log_date, periods_total, periods_attended, status } = record;

  const result = await pool.query(
    `
    INSERT INTO attendance_history (user_id, log_date, periods_total, periods_attended, status)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, log_date)
    DO UPDATE SET
      periods_total = EXCLUDED.periods_total,
      periods_attended = EXCLUDED.periods_attended,
      status = EXCLUDED.status
    RETURNING id, user_id, log_date::TEXT, periods_total, periods_attended, status;
    `,
    [user_id, log_date, periods_total, periods_attended, status],
  );

  return result.rows[0];
}

export async function getCurrentAttendancePercentage(
  userId: number,
): Promise<number> {
  const result = await pool.query(
    `
    SELECT
      COALESCE(SUM(periods_attended), 0) AS attended,
      COALESCE(SUM(periods_total), 0) AS total
    FROM attendance_history
    WHERE user_id = $1
    `,
    [userId],
  );

  const attended = Number(result.rows[0].attended);
  const total = Number(result.rows[0].total);

  if (total === 0) return 0;

  return Number(((attended / total) * 100).toFixed(2));
}
