import React, { useState, useEffect } from "react";

export default function MenuBarClock({ onClick }) {
  const [clockText, setClockText] = useState("");
  const [is24Hour, setIs24Hour] = useState(() => {
    try {
      return localStorage.getItem("aura_clock_format") === "24h";
    } catch (_) {
      return false;
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        setIs24Hour(localStorage.getItem("aura_clock_format") === "24h");
      } catch (_) {}
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      const dayName = days[now.getDay()];
      const monthName = months[now.getMonth()];
      const dateNum = now.getDate();

      const rawHours = now.getHours();
      const minutes = now.getMinutes();
      const minStr = minutes < 10 ? `0${minutes}` : minutes;

      if (is24Hour) {
        const hourStr = rawHours < 10 ? `0${rawHours}` : rawHours;
        setClockText(`${dayName} ${monthName} ${dateNum}  ${hourStr}:${minStr}`);
      } else {
        const ampm = rawHours >= 12 ? "PM" : "AM";
        const hours12 = rawHours % 12 || 12;
        setClockText(`${dayName} ${monthName} ${dateNum}  ${hours12}:${minStr} ${ampm}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [is24Hour]);

  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3px 8px",
        minHeight: 28,
        borderRadius: 6,
        cursor: "pointer",
        transition: "background 0.15s ease",
        userSelect: "none",
        fontSize: 13,
        fontWeight: 500,
        fontVariantNumeric: "tabular-nums",
        color: "#ffffff",
        whiteSpace: "nowrap",
        letterSpacing: "-0.1px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
      title="Open Calendar & Tasks"
    >
      <span>{clockText}</span>
    </div>
  );
}
