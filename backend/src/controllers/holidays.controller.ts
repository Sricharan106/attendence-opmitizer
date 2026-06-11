import type { Request, Response } from "express";
import { getInstitutionalHolidays } from "../services/holidays.service.js";

export async function getAllHoildays(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const holidayData = await getInstitutionalHolidays();

    const formattedHolidays = holidayData.map((h: any) => ({
      // FIXED: Explicitly fallback to h.holiday_date if h.date does not exist on row data
      date: h.holiday_date
        ? new Date(h.holiday_date).toISOString().split("T")[0]
        : h.date,
      occasion: h.description || h.occasion,
    }));

    res.status(200).json(formattedHolidays);
  } catch (err) {
    console.error(
      "Failed executing optimizer recommendations routing pipeline:",
      err,
    );
    res.status(500).json({
      error: "Internal processing error executing hoildays",
    });
  }
}
