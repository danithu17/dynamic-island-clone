import React, { useState, useEffect } from "react";
import { SlidersHorizontal, Bell, Info, Monitor } from "lucide-react";
import AboutCredits from "./AboutCredits";
import { alertQueue } from "../services/alertQueue";

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
  const [alertPrefs, setAlertPrefs] = useState(alertQueue.getPreferences());

  // Menu Bar / AppBar Settings
  const [islandPosition, setIslandPosition] = useState("reserved"); // "reserved" | "overlay" | "autohide"
  const [stripMargin, setStripMargin] = useState(0);
  const [fullscreenBehavior, setFullscreenBehavior] = useState("hide"); // "hide" | "collapse"

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

    if (window.electronAPI?.getMenuBarConfig) {
      window.electronAPI.getMenuBarConfig().then((cfg) => {
        if (cfg) {
          if (cfg.islandPosition) setIslandPosition(cfg.islandPosition);
          if (typeof cfg.stripMargin === "number") setStripMargin(cfg.stripMargin);
          if (cfg.fullscreenBehavior) setFullscreenBehavior(cfg.fullscreenBehavior);
        }
      });
    }
  }, []);

  const handleIslandPositionChange = (mode) => {
    setIslandPosition(mode);
    window.electronAPI?.setIslandMode?.(mode);
  };

  const handleStripMarginChange = (val) => {
    const num = parseInt(val, 10) || 0;
    setStripMargin(num);
    window.electronAPI?.setStripMargin?.(num);
  };

  const handleFullscreenBehaviorChange = (behavior) => {
    setFullscreenBehavior(behavior);
    window.electronAPI?.setFullscreenBehavior?.(behavior);
  };

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

  const handleAlertPrefToggle = (key, val) => {
    const updated = { ...alertPrefs, [key]: val };
    setAlertPrefs(updated);
    alertQueue.savePreferences(updated);
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
          onClick={() => setActiveCategory("display")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 8,
            border: "none",
            background: activeCategory === "display" ? "rgba(255, 255, 255, 0.14)" : "transparent",
            color: activeCategory === "display" ? "#ffffff" : "rgba(255, 255, 255, 0.65)",
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Monitor size={14} />
          Display
        </button>

        <button
          onClick={() => setActiveCategory("alerts")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 8,
            border: "none",
            background: activeCategory === "alerts" ? "rgba(255, 255, 255, 0.14)" : "transparent",
            color: activeCategory === "alerts" ? "#ffffff" : "rgba(255, 255, 255, 0.65)",
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <Bell size={14} />
          Smart Alerts
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

        {activeCategory === "display" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px" }}>Display & Island Position</span>

            {/* Island Position Mode */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "10px 12px",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Island Position</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>How the top bar reserves space on your desktop</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontSize: 11.5 }}>
                  <input
                    type="radio"
                    name="islandPosition"
                    value="reserved"
                    checked={islandPosition === "reserved"}
                    onChange={() => handleIslandPositionChange("reserved")}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>Reserved strip (Default)</div>
                    <div style={{ fontSize: 10, opacity: 0.65 }}>AppBar registered; other app windows maximize below the island and menu bar.</div>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontSize: 11.5 }}>
                  <input
                    type="radio"
                    name="islandPosition"
                    value="overlay"
                    checked={islandPosition === "overlay"}
                    onChange={() => handleIslandPositionChange("overlay")}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>Overlay</div>
                    <div style={{ fontSize: 10, opacity: 0.65 }}>Floating over apps, click-through everywhere except the pill and bar.</div>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontSize: 11.5 }}>
                  <input
                    type="radio"
                    name="islandPosition"
                    value="autohide"
                    checked={islandPosition === "autohide"}
                    onChange={() => handleIslandPositionChange("autohide")}
                    style={{ marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>Auto-hide</div>
                    <div style={{ fontSize: 10, opacity: 0.65 }}>No space reserved; bar hides into top edge and slides down when mouse touches the top edge.</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Top Strip Margin */}
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
                <div style={{ fontSize: 12, fontWeight: 600 }}>Top Strip Extra Margin</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>Extra spacing below the top bar (in pixels)</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="2"
                  value={stripMargin}
                  onChange={(e) => handleStripMarginChange(e.target.value)}
                  style={{ width: 80, cursor: "pointer" }}
                />
                <span style={{ fontSize: 11, fontWeight: 600, minWidth: 28, textAlign: "right" }}>
                  {stripMargin}px
                </span>
              </div>
            </div>

            {/* Fullscreen Behavior */}
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
                <div style={{ fontSize: 12, fontWeight: 600 }}>Fullscreen Behavior</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>When another app is fullscreen (video, games, F11)</div>
              </div>
              <select
                value={fullscreenBehavior}
                onChange={(e) => handleFullscreenBehaviorChange(e.target.value)}
                style={{
                  background: "rgba(0, 0, 0, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  borderRadius: 6,
                  color: "#ffffff",
                  fontSize: 11,
                  padding: "3px 8px",
                }}
              >
                <option value="hide">Hide Completely</option>
                <option value="collapse">Collapse Minimal</option>
              </select>
            </div>

            {/* Monitor Selection */}
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

        {activeCategory === "alerts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px" }}>Smart Alerts Configuration</span>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: 10,
                padding: "8px 12px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              {[
                { key: "battery", label: "Battery Alerts", desc: "Low battery (20%, 10%) & charging updates" },
                { key: "download", label: "Downloads Alert", desc: "Completed downloads in Downloads folder" },
                { key: "timer", label: "Timer & Stopwatch", desc: "Live countdown in pill & completion alert" },
                { key: "network", label: "Wi-Fi & Bluetooth", desc: "Connection status & disconnect notifications" },
                { key: "volume", label: "Volume & Brightness", desc: "Overlay indicator bar on adjustment" },
              ].map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 0",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 9.5, opacity: 0.6 }}>{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertPrefs[item.key] !== false}
                    onChange={(e) => handleAlertPrefToggle(item.key, e.target.checked)}
                    style={{ cursor: "pointer", width: 15, height: 15 }}
                  />
                </div>
              ))}
            </div>

            {/* Duration selector */}
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
                <div style={{ fontSize: 11.5, fontWeight: 600 }}>Alert Display Duration</div>
                <div style={{ fontSize: 9.5, opacity: 0.6 }}>How long alerts stay before auto-shrinking</div>
              </div>
              <select
                value={alertPrefs.durationSec || 4}
                onChange={(e) => handleAlertPrefToggle("durationSec", parseInt(e.target.value, 10))}
                style={{
                  background: "rgba(0, 0, 0, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  borderRadius: 6,
                  color: "#ffffff",
                  fontSize: 11,
                  padding: "3px 8px",
                }}
              >
                <option value={3}>3 seconds</option>
                <option value={4}>4 seconds</option>
                <option value={5}>5 seconds</option>
                <option value={6}>6 seconds</option>
              </select>
            </div>
          </div>
        )}

        {activeCategory === "about" && <AboutCredits textColor={textColor} appVersion={appVersion} />}
      </div>
    </div>
  );
}
