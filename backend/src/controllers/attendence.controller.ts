import type { Request, Response } from "express";
import { getAttendanceHistory } from "../services/attendance.service.js";
import { saveAttendanceRecord } from "../services/attendance.service.js";
import { getCurrentAttendancePercentage } from "../services/attendance.service.js";

export async function getAttendance(
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
    const historyData = await getAttendanceHistory(userId);

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
    res.status(200).json(formattedHistory);
  } catch (err) {
    console.error(
      "Failed executing optimizer recommendations routing pipeline:",
      err,
    );
    res.status(500).json({
      error: "Internal processing error executing attendence",
    });
  }
}

export async function saveAttendance(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { user_id, log_date, periods_total, periods_attended, status } =
      req.body;

    if (
      !user_id ||
      !log_date ||
      periods_total === undefined ||
      periods_attended === undefined ||
      !status
    ) {
      res.status(400).json({
        error:
          "user_id, log_date, periods_total, periods_attended and status are required",
      });
      return;
    }

    const attendance = await saveAttendanceRecord({
      user_id: Number(user_id),
      log_date,
      periods_total: Number(periods_total),
      periods_attended: Number(periods_attended),
      status,
    });

    res.status(200).json({
      message: "Attendance saved successfully",
      attendance,
    });
  } catch (err) {
    console.error("Failed saving attendance:", err);

    res.status(500).json({
      error: "Internal processing error saving attendance",
    });
  }
}

export async function getCurrentAttendance(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = parseInt(
      (req.query.userId as string) || (req.params.userId as string),
    );

    if (!userId || isNaN(userId)) {
      res.status(400).json({
        error: "A valid numeric userId parameter is required.",
      });
      return;
    }

    const attendancePercentage = await getCurrentAttendancePercentage(userId);

    res.status(200).json({
      attendancePercentage,
    });
  } catch (err) {
    console.error("Failed calculating attendance:", err);

    res.status(500).json({
      error: "Internal processing error calculating attendance",
    });
  }
}
