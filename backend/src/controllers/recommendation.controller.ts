import type { Request, Response } from "express";
import { pool } from "../db/postgres.js";
import { getAttendanceHistory } from "../services/attendance.service.js";
import { getInstitutionalHolidays } from "../services/holidays.service.js";
import { generateRecommendations } from "../services/optimizer.service.js";

export async function getRecommendations(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    // 1. Validate User Context
    const userId = parseInt(
      (req.query.userId as string) || (req.params.userId as string),
    );
    if (!userId || isNaN(userId)) {
      res
        .status(400)
        .json({ error: "A valid numeric userId parameter is required." });
      return;
    }

    // 2. Fetch System Configuration Parameters (Target limits & schedule properties)
    const configResult = await pool.query(
      `SELECT start_date::TEXT, end_date::TEXT, target_attendance, periods_per_day
       FROM semester_config
       ORDER BY id DESC LIMIT 1;`,
    );

    if (configResult.rowCount === 0) {
      res
        .status(404)
        .json({ error: "Active semester configuration metadata missing." });
      return;
    }

    const config = configResult.rows[0];

    // 3. Concurrently fetch history and holiday records from database pool instances
    const [historyData, holidayData] = await Promise.all([
      getAttendanceHistory(userId),
      getInstitutionalHolidays(),
    ]);

    // ==========================================
    // 4. Map DB fields cleanly into expected structural engine signatures
    // ==========================================
    const formattedHolidays = holidayData.map((h: any) => ({
      // FIXED: Explicitly fallback to h.holiday_date if h.date does not exist on row data
      date: h.holiday_date
        ? new Date(h.holiday_date).toISOString().split("T")[0]
        : h.date,
      occasion: h.description || h.occasion,
    }));

    const formattedHistory = historyData.map((h: any) => {
      // FIXED: Ensure the date string is sliced down to pure YYYY-MM-DD from PostgreSQL string timestamps
      const cleanDate = h.log_date
        ? new Date(h.log_date).toISOString().split("T")[0]
        : h.date;
      return {
        date: cleanDate,
        log_date: cleanDate,
        periods_total: parseInt(h.periods_total),
        periods_attended: parseInt(h.periods_attended),
        status: h.status,
      };
    });

    // 5. Execute the core Optimization Engine
    const recommendations = generateRecommendations(
      config.start_date,
      config.end_date,
      config.target_attendance,
      config.periods_per_day,
      formattedHistory,
      formattedHolidays,
    );

    // 6. Return response to client
    res.status(200).json({
      meta: {
        targetPercentageCriteria: config.target_attendance,
        maxDailyPeriods: config.periods_per_day,
        totalHistoricalLogsFetched: formattedHistory.length,
      },
      recommendedBunkTargets: recommendations,
    });
  } catch (error) {
    console.error(
      "Failed executing optimizer recommendations routing pipeline:",
      error,
    );
    res.status(500).json({
      error:
        "Internal processing error executing attendance analyzer optimization.",
    });
  }
}
