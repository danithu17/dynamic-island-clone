import React from "react";
import { Calendar as CalendarIcon, Clock, Timer, Play } from "lucide-react";

export default function ClockDropdown({ onStartTimer, onClose }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const today = now.getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Days in current month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 260, padding: "2px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CalendarIcon size={14} color="#0a84ff" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {monthNames[month]} {year}
          </span>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Calendar Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
        {dayLabels.map((label, idx) => (
          <span key={idx} style={{ fontSize: 10, fontWeight: 700, opacity: 0.5, padding: "2px 0" }}>
            {label}
          </span>
        ))}

        {calendarDays.map((day, idx) => {
          const isToday = day === today;
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 24,
                borderRadius: "50%",
                fontSize: 11,
                fontWeight: isToday ? 700 : 500,
                background: isToday ? "#0a84ff" : "transparent",
                color: isToday ? "#ffffff" : day ? "rgba(255, 255, 255, 0.9)" : "transparent",
              }}
            >
              {day || ""}
            </div>
          );
        })}
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Quick Timer presets */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", opacity: 0.45, letterSpacing: "0.5px", padding: "0 4px" }}>
          Quick Focus Timer
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {[15, 25, 45].map((mins) => (
            <button
              key={mins}
              onClick={() => {
                onStartTimer?.(mins);
                onClose?.();
              }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                padding: "5px 6px",
                borderRadius: 7,
                background: "rgba(255, 159, 10, 0.15)",
                border: "1px solid rgba(255, 159, 10, 0.3)",
                color: "#ff9f0a",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 159, 10, 0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 159, 10, 0.15)")}
            >
              <Timer size={11} /> {mins}m
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
