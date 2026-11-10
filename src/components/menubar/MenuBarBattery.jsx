import React from "react";
import { Zap } from "lucide-react";

export default function MenuBarBattery({ batteryInfo, onClick }) {
  const percent = typeof batteryInfo?.percent === "number" ? batteryInfo.percent : 100;
  const charging = Boolean(batteryInfo?.charging);

  // Fill width within the 18px wide battery body (inner width ~ 13px)
  const fillWidth = Math.max(1, Math.min(13, Math.round((percent / 100) * 13)));
  const isLow = !charging && percent <= 20;

  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 7px",
        borderRadius: 6,
        cursor: "pointer",
        transition: "background 0.15s ease",
        userSelect: "none",
        fontSize: 12.5,
        fontWeight: 500,
        color: "#ffffff",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
      title={`Battery: ${percent}% ${charging ? "(Charging)" : ""}`}
    >
      <span>{percent}%</span>

      {/* SVG Battery Icon */}
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <svg width="22" height="12" viewBox="0 0 22 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer pill frame */}
          <rect
            x="0.75"
            y="0.75"
            width="17.5"
            height="10.5"
            rx="3"
            stroke="rgba(255, 255, 255, 0.85)"
            strokeWidth="1.2"
          />
          {/* Positive terminal nipple */}
          <path
            d="M20 4.2C20.6 4.2 21 4.6 21 5.2V6.8C21 7.4 20.6 7.8 20 7.8V4.2Z"
            fill="rgba(255, 255, 255, 0.75)"
          />
          {/* Battery level fill */}
          <rect
            x="2.5"
            y="2.5"
            width={fillWidth}
            height="7"
            rx="1.5"
            fill={isLow ? "#ff453a" : charging ? "#30d158" : "#ffffff"}
          />
        </svg>

        {charging && (
          <Zap
            size={10}
            color="#30d158"
            fill="#30d158"
            style={{
              position: "absolute",
              left: "4px",
              top: "1px",
              filter: "drop-shadow(0 0 2px rgba(0,0,0,0.8))",
            }}
          />
        )}
      </div>
    </div>
  );
}
