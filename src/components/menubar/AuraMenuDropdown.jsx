import React from "react";
import { Sparkles, Settings, RefreshCw, Power, Check, ShieldCheck, ExternalLink, Minimize2 } from "lucide-react";

export default function AuraMenuDropdown({
  appVersion = "5.5.1",
  currentMode = "reserved",
  onOpenSettings,
  onOpenAbout,
  onSelectMode,
  onReleaseSpace,
  onClose,
}) {
  const handleItemClick = (action) => {
    onClose?.();
    action();
  };

  const itemStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 7,
    fontSize: 12.5,
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.92)",
    cursor: "pointer",
    transition: "background 0.12s ease",
  };

  const separatorStyle = {
    height: 1,
    background: "rgba(255, 255, 255, 0.09)",
    margin: "4px 6px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {/* Header Info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 10px 9px 10px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          marginBottom: 3,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: "linear-gradient(135deg, #0a84ff 0%, #bf5af2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={13} color="#ffffff" />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px" }}>Aura Island</span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>v{appVersion} • Top Bar System</span>
        </div>
      </div>

      {/* Main Options */}
      <div
        style={itemStyle}
        onClick={() => handleItemClick(() => onOpenAbout?.())}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0070f3")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <ShieldCheck size={14} opacity={0.8} />
          <span>About Aura Island</span>
        </div>
      </div>

      <div
        style={itemStyle}
        onClick={() => handleItemClick(() => {
          if (window.electronAPI?.openSettingsWindow) {
            window.electronAPI.openSettingsWindow("general");
          } else {
            onOpenSettings?.("general");
          }
        })}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0070f3")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Settings size={14} opacity={0.8} />
          <span>Island Settings...</span>
        </div>
        <span style={{ fontSize: 10.5, opacity: 0.5 }}>Ctrl+,</span>
      </div>

      <div style={separatorStyle} />

      {/* Mode Sub-section */}
      <div style={{ padding: "3px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", opacity: 0.45, letterSpacing: "0.5px" }}>
        Island Position Mode
      </div>

      <div
        style={itemStyle}
        onClick={() => handleItemClick(() => onSelectMode?.("reserved"))}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0070f3")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span>Reserved Top Strip</span>
        {currentMode === "reserved" && <Check size={13} color="#30d158" />}
      </div>

      <div
        style={itemStyle}
        onClick={() => handleItemClick(() => onSelectMode?.("overlay"))}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0070f3")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span>Overlay (Floating)</span>
        {currentMode === "overlay" && <Check size={13} color="#30d158" />}
      </div>

      <div
        style={itemStyle}
        onClick={() => handleItemClick(() => onSelectMode?.("autohide"))}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0070f3")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span>Auto-hide Edge</span>
        {currentMode === "autohide" && <Check size={13} color="#30d158" />}
      </div>

      <div
        style={itemStyle}
        onClick={() => handleItemClick(() => onReleaseSpace?.())}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0070f3")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Minimize2 size={14} opacity={0.8} />
          <span>Release Reserved Space</span>
        </div>
      </div>

      <div style={separatorStyle} />

      {/* Relaunch & Quit */}
      <div
        style={itemStyle}
        onClick={() => handleItemClick(() => window.electronAPI?.relaunchApp?.())}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0070f3")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <RefreshCw size={13} opacity={0.8} />
          <span>Restart Aura Island</span>
        </div>
      </div>

      <div
        style={{ ...itemStyle, color: "#ff453a" }}
        onClick={() => handleItemClick(() => window.electronAPI?.quitApp?.())}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 69, 58, 0.25)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Power size={13} color="#ff453a" />
          <span>Quit Aura Island</span>
        </div>
        <span style={{ fontSize: 10.5, opacity: 0.65 }}>⌘Q</span>
      </div>
    </div>
  );
}
