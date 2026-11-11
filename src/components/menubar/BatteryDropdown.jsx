import React, { useState } from "react";
import { Battery, Zap, Check } from "lucide-react";

export default function BatteryDropdown({ batteryInfo }) {
  const [powerMode, setPowerMode] = useState("balanced");
  const percent = typeof batteryInfo?.percent === "number" ? batteryInfo.percent : 100;
  const charging = Boolean(batteryInfo?.charging);

  const powerModes = [
    { id: "efficiency", label: "Power Efficiency", desc: "Reduces performance to save energy" },
    { id: "balanced", label: "Balanced (Recommended)", desc: "Automatically balances power and performance" },
    { id: "performance", label: "Best Performance", desc: "Favors performance over battery life" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 260 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Battery size={14} color={charging ? "#30d158" : "#ffffff"} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Battery</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {charging && <Zap size={12} color="#30d158" fill="#30d158" />}
          <span style={{ fontSize: 12, fontWeight: 700, color: charging ? "#30d158" : "#ffffff" }}>
            {percent}%
          </span>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Charging state text */}
      <div
        style={{
          padding: "6px 8px",
          borderRadius: 8,
          background: "rgba(255, 255, 255, 0.05)",
          fontSize: 11,
          opacity: 0.8,
        }}
      >
        {charging ? "Power Source: Power Adapter (Charging)" : "Power Source: Battery"}
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Power Mode Selector */}
      <div style={{ padding: "2px 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", opacity: 0.45, letterSpacing: "0.5px" }}>
        Power Mode
      </div>

      {powerModes.map((mode) => (
        <div
          key={mode.id}
          onClick={() => setPowerMode(mode.id)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "5px 8px",
            borderRadius: 7,
            cursor: "pointer",
            background: powerMode === mode.id ? "rgba(255, 255, 255, 0.08)" : "transparent",
            transition: "background 0.12s ease",
          }}
          onMouseEnter={(e) => {
            if (powerMode !== mode.id) e.currentTarget.style.background = "#0070f3";
          }}
          onMouseLeave={(e) => {
            if (powerMode !== mode.id) e.currentTarget.style.background = "transparent";
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: "#ffffff" }}>{mode.label}</span>
            <span style={{ fontSize: 9.5, opacity: 0.5 }}>{mode.desc}</span>
          </div>
          {powerMode === mode.id && <Check size={12} color="#30d158" />}
        </div>
      ))}
    </div>
  );
}
