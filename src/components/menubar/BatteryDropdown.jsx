import React, { useState, useEffect } from "react";
import { Battery, Zap, Check, Moon, RotateCcw, PowerOff, ExternalLink, Sliders } from "lucide-react";

export default function BatteryDropdown({ batteryInfo, onClose }) {
  const [liveBattery, setLiveBattery] = useState(batteryInfo || { percent: 100, charging: false });
  const [powerMode, setPowerMode] = useState("balanced");

  useEffect(() => {
    if (batteryInfo && typeof batteryInfo.percent === "number") {
      setLiveBattery(batteryInfo);
    }
  }, [batteryInfo]);

  useEffect(() => {
    // Query live Windows battery status
    if (window.electronAPI?.getSystemBattery) {
      window.electronAPI.getSystemBattery().then((res) => {
        if (res && typeof res.percent === "number") {
          setLiveBattery({
            percent: res.percent,
            charging: Boolean(res.charging),
            isAC: Boolean(res.isAC),
            hasBattery: Boolean(res.hasBattery),
          });
        }
      }).catch(() => {});
    }

    // Query active Windows power scheme
    if (window.electronAPI?.getPowerScheme) {
      window.electronAPI.getPowerScheme().then((scheme) => {
        if (scheme?.id) {
          setPowerMode(scheme.id);
        }
      }).catch(() => {});
    }
  }, []);

  const handleSelectScheme = (schemeId) => {
    setPowerMode(schemeId);
    if (window.electronAPI?.setPowerScheme) {
      window.electronAPI.setPowerScheme(schemeId);
    }
  };

  const handlePowerAction = (action) => {
    onClose?.();
    if (window.electronAPI?.powerAction) {
      window.electronAPI.powerAction(action);
    }
  };

  const percent = typeof liveBattery?.percent === "number" ? liveBattery.percent : 100;
  const charging = Boolean(liveBattery?.charging);

  const powerModes = [
    { id: "efficiency", label: "Power Efficiency", desc: "Reduces performance to save energy" },
    { id: "balanced", label: "Balanced (Recommended)", desc: "Automatically balances power and performance" },
    { id: "performance", label: "Best Performance", desc: "Favors performance over battery life" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 270 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Battery size={14} color={charging ? "#30d158" : percent <= 20 ? "#ff453a" : "#ffffff"} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Power & Battery</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {charging && <Zap size={12} color="#30d158" fill="#30d158" />}
          <span style={{ fontSize: 12, fontWeight: 700, color: charging ? "#30d158" : percent <= 20 ? "#ff453a" : "#ffffff" }}>
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
          opacity: 0.85,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{charging ? "Power Source: Power Adapter (Charging)" : "Power Source: Battery"}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: charging ? "#30d158" : "#0a84ff" }}>
          {charging ? "Charging" : "In Use"}
        </span>
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Power Mode Selector */}
      <div style={{ padding: "2px 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", opacity: 0.45, letterSpacing: "0.5px" }}>
        Power Mode Plan
      </div>

      {powerModes.map((mode) => (
        <div
          key={mode.id}
          onClick={() => handleSelectScheme(mode.id)}
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

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Power Options: Sleep, Restart, Shutdown */}
      <div style={{ padding: "2px 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", opacity: 0.45, letterSpacing: "0.5px" }}>
        System Power Options
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => handlePowerAction("sleep")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "6px 4px",
            borderRadius: 7,
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.09)",
            color: "#ffffff",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#0070f3")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)")}
          title="Put Computer to Sleep"
        >
          <Moon size={12} /> Sleep
        </button>

        <button
          onClick={() => handlePowerAction("restart")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "6px 4px",
            borderRadius: 7,
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.09)",
            color: "#ffffff",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#0070f3")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)")}
          title="Restart Computer"
        >
          <RotateCcw size={12} /> Restart
        </button>

        <button
          onClick={() => handlePowerAction("shutdown")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "6px 4px",
            borderRadius: 7,
            background: "rgba(255, 69, 58, 0.15)",
            border: "1px solid rgba(255, 69, 58, 0.3)",
            color: "#ff453a",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 69, 58, 0.35)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 69, 58, 0.15)")}
          title="Shut Down Computer"
        >
          <PowerOff size={12} /> Shut Down
        </button>
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Link to Windows Power & Sleep Settings */}
      <div
        onClick={() => {
          onClose?.();
          window.electronAPI?.openPowerSettings?.();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 8px",
          borderRadius: 7,
          cursor: "pointer",
          fontSize: 12,
          color: "rgba(255, 255, 255, 0.85)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0070f3")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span>Power & Sleep Settings...</span>
        <ExternalLink size={12} opacity={0.6} />
      </div>
    </div>
  );
}
