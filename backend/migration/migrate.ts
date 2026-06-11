import { pool } from "../src/db/postgres.ts";

async function runMigrations() {
  try {
    console.log("Starting migrations...");

    await pool.query(`
      DROP TABLE IF EXISTS attendance_history CASCADE;
      DROP TABLE IF EXISTS institutional_holidays CASCADE;
      DROP TABLE IF EXISTS semester_config CASCADE;
    `);

    console.log("Old tables removed.");

    await pool.query(`
      CREATE TABLE semester_config (
        id SERIAL PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        target_attendance INTEGER NOT NULL DEFAULT 80,
        periods_per_day INTEGER NOT NULL DEFAULT 6
      );

      CREATE TABLE institutional_holidays (
        id SERIAL PRIMARY KEY,
        holiday_date DATE UNIQUE NOT NULL,
        description VARCHAR(255)
      );

      CREATE TABLE attendance_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        log_date DATE NOT NULL,
        periods_total INTEGER NOT NULL DEFAULT 6,
        periods_attended INTEGER NOT NULL,
        status VARCHAR(50),
        CONSTRAINT unique_user_date UNIQUE(user_id, log_date)
      );
    `);

    console.log("Tables created successfully.");

    await pool.query(`
      INSERT INTO semester_config (
        start_date,
        end_date,
        target_attendance,
        periods_per_day
      )
      VALUES (
        '2026-08-01',
        '2026-08-31',
        80,
        6
      );
    `);

    await pool.query(`
      INSERT INTO institutional_holidays (
        holiday_date,
        description
      )
      VALUES
        ('2026-08-15', 'Independence Day'),
        ('2026-08-17', 'Janmashtami');
    `);

    console.log("Seed data inserted.");
    console.log("Migration completed successfully.");

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
