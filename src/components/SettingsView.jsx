import React, { useState, useEffect } from "react";
import { SlidersHorizontal, Monitor, Info, Check } from "lucide-react";
import AboutCredits from "./AboutCredits";

export default function SettingsView({
  textColor = "#ffffff",
  appVersion = "5.5.1",
  alwaysOnTop = true,
  onToggleAlwaysOnTop,
  onClose,
}) {
  const [activeCategory, setActiveCategory] = useState("general");
  const [displays, setDisplays] = useState([]);
  const [selectedDisplay, setSelectedDisplay] = useState("");
  const [autoLaunch, setAutoLaunch] = useState(false);

  useEffect(() => {
    if (window.electronAPI?.getDisplays) {
      window.electronAPI.getDisplays().then((ds) => {
        setDisplays(ds || []);
      });
    }
    const savedDisp = localStorage.getItem("display-id") || "";
    setSelectedDisplay(savedDisp);

    const savedAutoLaunch = localStorage.getItem("auto-launch") === "true";
    setAutoLaunch(savedAutoLaunch);
  }, []);

  const handleDisplayChange = (id) => {
    setSelectedDisplay(id);
    localStorage.setItem("display-id", id);
    window.electronAPI?.setDisplay?.(id);
  };

  const handleAutoLaunchChange = (enable) => {
    setAutoLaunch(enable);
    localStorage.setItem("auto-launch", enable ? "true" : "false");
    window.electronAPI?.setAutoLaunch?.(enable);
  };

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        userSelect: "none",
        color: textColor,
        fontFamily: 'OpenRunde, -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 140,
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "8px 6px",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          background: "rgba(0, 0, 0, 0.25)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setActiveCategory("general")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 8,
            border: "none",
            background: activeCategory === "general" ? "rgba(255, 255, 255, 0.14)" : "transparent",
            color: activeCategory === "general" ? "#ffffff" : "rgba(255, 255, 255, 0.65)",
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <SlidersHorizontal size={14} />
          General
        </button>

        <button
          onClick={() => setActiveCategory("about")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 8,
            border: "none",
            background: activeCategory === "about" ? "rgba(255, 255, 255, 0.14)" : "transparent",
            color: activeCategory === "about" ? "#ffffff" : "rgba(255, 255, 255, 0.65)",
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Info size={14} />
          About & Credits
        </button>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: "10px 16px",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        {activeCategory === "general" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px" }}>General Preferences</span>

            {/* Always on top row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Always on Top</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>Keep Aura Island floating over other windows</div>
              </div>
              <input
                type="checkbox"
                checked={alwaysOnTop}
                onChange={(e) => onToggleAlwaysOnTop?.(e.target.checked)}
                style={{ cursor: "pointer", width: 16, height: 16 }}
              />
            </div>

            {/* Run at Startup */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Start with Windows</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>Launch automatically when you sign in</div>
              </div>
              <input
                type="checkbox"
                checked={autoLaunch}
                onChange={(e) => handleAutoLaunchChange(e.target.checked)}
                style={{ cursor: "pointer", width: 16, height: 16 }}
              />
            </div>

            {/* Display / Monitor selector */}
            {displays.length > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 10,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>Monitor Selection</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>Choose which screen displays the island</div>
                </div>
                <select
                  value={selectedDisplay}
                  onChange={(e) => handleDisplayChange(e.target.value)}
                  style={{
                    background: "rgba(0, 0, 0, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    borderRadius: 6,
                    color: "#ffffff",
                    fontSize: 11,
                    padding: "3px 8px",
                  }}
                >
                  <option value="">Primary Display</option>
                  {displays.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {activeCategory === "about" && <AboutCredits textColor={textColor} appVersion={appVersion} />}
      </div>
    </div>
  );
}
