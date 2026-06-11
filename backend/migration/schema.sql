-- 1. Global configurations & semester targets
CREATE TABLE semester_config (
    id SERIAL PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_attendance INT NOT NULL DEFAULT 80,
    periods_per_day INT NOT NULL DEFAULT 6
);

-- 2. Official institutional academic calendar exceptions
CREATE TABLE institutional_holidays (
    id SERIAL PRIMARY KEY,
    holiday_date DATE UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- 3. Daily history logs recorded up to the current date
CREATE TABLE attendance_history (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    log_date DATE NOT NULL,
    periods_total INT NOT NULL DEFAULT 6,
    periods_attended INT NOT NULL,
    status VARCHAR(50), -- e.g., 'Present', 'Absent', 'Partial'
    CONSTRAINT unique_user_date UNIQUE (user_id, log_date) -- Prevents duplicate entries for the same user on the same day
);

-- Seed initial parameters for August 2026 simulation
INSERT INTO semester_config (start_date, end_date, target_attendance, periods_per_day)
VALUES ('2026-08-01', '2026-08-31', 80, 6);

-- Seed native public holidays (e.g., Independence Day / Janmashtami windows)
INSERT INTO institutional_holidays (holiday_date, description) VALUES
('2026-08-15', 'Independence Day'),
('2026-08-17', 'Janmashtami');
