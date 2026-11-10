import React, { useState, useEffect } from "react";

export default function MenuBarClock({ onClick }) {
  const [clockText, setClockText] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format: "Tue Nov 10  11:02 AM"
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      const dayName = days[now.getDay()];
      const monthName = months[now.getMonth()];
      const dateNum = now.getDate();

      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      const minStr = minutes < 10 ? `0${minutes}` : minutes;

      setClockText(`${dayName} ${monthName} ${dateNum}  ${hours}:${minStr} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: 6,
        cursor: "pointer",
        transition: "background 0.15s ease",
        userSelect: "none",
        fontSize: 13,
        fontWeight: 500,
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
