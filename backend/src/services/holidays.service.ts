import { pool } from "../db/postgres.js";
import * as cheerio from "cheerio";
import type { Holiday } from "../types/optimizer.types";

// Getter: Fetch local database holidays
export async function getInstitutionalHolidays(): Promise<Holiday[]> {
  const result = await pool.query(
    `SELECT holiday_date::TEXT as date, description FROM institutional_holidays ORDER BY holiday_date ASC;`,
  );
  return result.rows;
}

export async function syncTelanganaGovHolidays(): Promise<void> {
  const GOV_URL = "https://www.telangana.gov.in/downloads/calendar-2026/";

  try {
    console.log("📥 Connecting to Telangana Gov Portal...");
    const response = await fetch(GOV_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok)
      throw new Error(`Could not reach portal: ${response.statusText}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    const rawText =
      $(".entry-content").text() ||
      $("#main-content").text() ||
      $("body").text();

    // Regex pattern optimized for unstructured page data
    const pattern =
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-\s](\d{1,2})[\s\.\:-]+([^.\n\r]+)/gi;
    let resultMatch;
    let insertCount = 0;

    // Clear previous runs to eliminate existing duplicated optional anomalies
    await pool.query("TRUNCATE TABLE institutional_holidays;");

    while ((resultMatch = pattern.exec(rawText)) !== null) {
      const month = resultMatch[1];
      const day = resultMatch[2];
      const description = resultMatch[3]?.trim();

      if (!month || !day || !description) continue;

      const lowerDesc = description.toLowerCase();

      // 1. HARD CIRCUIT BREAKER: Stop executing completely if we bleed into the Optional Tables section
      if (
        lowerDesc.includes("optional holidays") ||
        lowerDesc.includes("part-ii") ||
        lowerDesc.includes("part ii")
      ) {
        console.log(
          "🛑 Reached Optional Holidays section table boundary. Stopping sync cleanly.",
        );
        break;
      }

      // 2. Skip structural navigational text artifacts captured by broad regex
      if (
        lowerDesc.includes("download") ||
        description.length > 50 ||
        description.length < 3
      ) {
        continue;
      }

      // 3. Skip implicit optional keywords found inside individual lines
      if (
        lowerDesc.includes("optional") ||
        lowerDesc.includes("restricted") ||
        lowerDesc.includes("notified holiday") ||
        lowerDesc.includes("suffix") ||
        lowerDesc.includes("prefix")
      ) {
        continue;
      }

      // 4. FIXED: All list items are strictly LOWERCASE to correctly align with lowerDesc strings
      const optionalHolidaysList = [
        "birthday of hazrath ali",
        "shab-e-meraj",
        "sri panchami",
        "shab-e-barat",
        "shahadat hzt ali",
        "shab-e-qader",
        "mahaveer jayanthi",
        "basava jayanthi",
        "buddha purnima",
        "eid-e-ghadeer",
        "9th moharram",
        "ratha yathra",
        "arbayeen",
        "sravana purnima",
        "rakhi purnimi",
        "yazdahum shareef",
        "birthday of hazrath syed",
        "christmas eve",
        "kanumu",
        "varalakshmi",
      ];

      if (optionalHolidaysList.some((oh) => lowerDesc.includes(oh))) {
        continue;
      }

      const parseableString = `${month} ${day} 2026`;
      const parsedDate = new Date(parseableString);

      if (isNaN(parsedDate.getTime())) continue;

      const formattedYear = parsedDate.getFullYear();
      const formattedMonth = String(parsedDate.getMonth() + 1).padStart(2, "0");
      const formattedDay = String(parsedDate.getDate()).padStart(2, "0");
      const dateStr = `${formattedYear}-${formattedMonth}-${formattedDay}`;

      await pool.query(
        `
        INSERT INTO institutional_holidays (holiday_date, description)
        VALUES ($1, $2)
        ON CONFLICT (holiday_date) DO UPDATE
        SET description = EXCLUDED.description;
        `,
        [dateStr, description],
      );

      insertCount++;
    }

    console.log(
      `📊 Successfully synchronized ${insertCount} General Holidays.`,
    );
  } catch (error) {
    console.error("❌ Failed syncing government holidays:", error);
    throw error;
  }
}
