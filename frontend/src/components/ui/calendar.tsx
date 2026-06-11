import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "@/components/ui/button";
import { BouncingCubes } from "@/components/ui/loader";

// Define strict interfaces for API data mapping
interface Holiday {
  date: string;
  occasion: string;
}

interface Recommendation {
  date: string;
  reason: string;
}

interface AttendanceRecord {
  log_date: string;
  status: "present" | "absent" | string;
}

export default function Calendar() {
  const [holidayEvents, setHolidayEvents] = useState<any[]>([]);
  const [recommendationEvents, setRecommendationEvents] = useState<any[]>([]);
  const [attendanceEvents, setAttendanceEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const baseUrl = import.meta.env.VITE_BASE_URL ?? "";
  const userId = 1; // Kept static based on original code

  // Centralized data fetcher
  const loadCalendarData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [currentRes, holidaysRes, recommendationsRes, attendanceRes] =
        await Promise.all([
          axios.get(`${baseUrl}/current/${userId}`),
          axios.get(`${baseUrl}/holidays`),
          axios.get(`${baseUrl}/optimizer/recommendations/${userId}`),
          axios.get(`${baseUrl}/attendence/${userId}`),
        ]);

      // 1. Process Current Attendance
      setCurrentAttendance(currentRes.data.attendancePercentage ?? 0);

      // 2. Process Holidays
      const holidays = holidaysRes.data.map((holiday: Holiday) => ({
        title: holiday.occasion,
        start: holiday.date,
        allDay: true,
        display: "background",
        backgroundColor: "#ef4444",
        className: "holiday",
      }));
      setHolidayEvents(holidays);

      // 3. Process Recommendations
      const recommendations =
        recommendationsRes.data.recommendedBunkTargets.map(
          (rec: Recommendation) => ({
            title: rec.reason.slice(0, 10),
            start: rec.date,
            allDay: true,
            display: "background",
            backgroundColor: "#800080",
            className: "recommendation",
          }),
        );
      setRecommendationEvents(recommendations);

      // 4. Process Attendance logs
      const attendance = attendanceRes.data.map((record: AttendanceRecord) => ({
        title: record.status,
        start: record.log_date,
        allDay: true,
        display: "background",
        backgroundColor:
          record.status === "present"
            ? "#22c55e"
            : record.status === "absent"
              ? "#ef4444"
              : "#f59e0b",
        className: "attendance",
      }));
      setAttendanceEvents(attendance);
    } catch (err) {
      console.error("Error loading calendar datasets:", err);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, userId]);

  // Initial mount load
  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const handleDateClick = (info: { dateStr: string }) => {
    setSelectedDate(info.dateStr);
    setShowModal(true);
  };

  const saveAttendance = async (status: "present" | "absent") => {
    if (!selectedDate) return;
    try {
      await axios.post(`${baseUrl}/attendence`, {
        user_id: userId,
        log_date: selectedDate,
        periods_total: 6,
        periods_attended: status === "present" ? 6 : 0,
        status,
      });

      setAttendanceEvents((prev) => [
        ...prev,
        {
          start: selectedDate,
          allDay: true,
          display: "background",
          backgroundColor: status === "present" ? "#22c55e" : "#ef4444",
        },
      ]);

      setShowModal(false);
      // Optional: Refresh attendance metric automatically after post
      const currentAttendanceRes = await axios.get(
        `${baseUrl}/current/${userId}`,
      );
      setCurrentAttendance(currentAttendanceRes.data.attendancePercentage);
    } catch (err) {
      console.error("Error saving attendance:", err);
    }
  };

  useEffect(() => {
    // 1. Request OS level Notification permissions
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted" && "serviceWorker" in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            // Wake up the service worker hook
            registration.active?.postMessage({
              type: "START_NOTIFICATION_INTERVAL",
            });
          });
        }
      });
    }

    // 2. Client Side polling fallback loop (Runs seamlessly while app is alive or in a background tab)
    const INTERVAL_TIME = 3.5 * 60 * 60 * 1000; // 3.5 Hours in milliseconds

    const verifyAttendanceLogging = () => {
      const todayStr = new Date().toISOString().split("T")[0];

      // Scan your existing state records array for matches matching today's date string
      const isLoggedToday = attendanceEvents.some(
        (event) => event.start === todayStr,
      );

      if (!isLoggedToday && Notification.permission === "granted") {
        new Notification("Attendance Logging Pending", {
          body: "Keep your streaks accurate! Click here to log today's attendance status.",
          icon: "/icon-192x192.png",
        });
      }
    };

    // Run initial evaluation shortly after logs populate
    const initialDelay = setTimeout(() => {
      if (attendanceEvents.length > 0) verifyAttendanceLogging();
    }, 10000);

    // Periodic interval execution loop
    const periodicTimer = setInterval(() => {
      verifyAttendanceLogging();
    }, INTERVAL_TIME);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(periodicTimer);
    };
  }, [attendanceEvents]);

  return (
    <div className="relative min-h-100">
      {/* Absolute overlay loader using BouncingCubes component */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-40 transition-all">
          <div className="flex flex-col items-center gap-2">
            <BouncingCubes size={50} />
            <span className="text-sm text-muted-foreground animate-pulse">
              Loading schedule...
            </span>
          </div>
        </div>
      )}

      {/* Action / Input Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Mark Attendance</h2>
            <p className="text-muted-foreground mb-4 text-sm font-medium">
              {selectedDate}
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => saveAttendance("present")}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 transition-colors text-white text-sm font-medium rounded"
              >
                Present
              </button>

              <button
                onClick={() => saveAttendance("absent")}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 transition-colors text-white text-sm font-medium rounded"
              >
                Absent
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border hover:bg-accent transition-colors text-sm font-medium rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Sync Controls */}
      <div className="flex items-center justify-between max-w-5xl mx-auto my-5 px-4 font-bold">
        <span>Current Attendance: {currentAttendance}%</span>
        <Button onClick={loadCalendarData} disabled={isLoading}>
          Sync
        </Button>
      </div>

      {/* Main Grid Calendar */}
      <div className="max-w-5xl mx-auto px-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          dateClick={handleDateClick}
          height="auto"
          events={[
            ...holidayEvents,
            ...recommendationEvents,
            ...attendanceEvents,
          ]}
          dayCellClassNames={(arg) => {
            if (arg.date.getDay() === 0) {
              return ["sunday-cell"];
            }
            return [];
          }}
        />
      </div>
    </div>
  );
}
