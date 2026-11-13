import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, ExternalLink, Check } from "lucide-react";

export default function WifiDropdown({ onClose }) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleOpenSettings = () => {
    window.electronAPI?.openWifiSettings?.();
    onClose?.();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 250 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {online ? <Wifi size={14} color="#30d158" /> : <WifiOff size={14} color="#ff453a" />}
          <span style={{ fontSize: 13, fontWeight: 700 }}>Wi-Fi</span>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: online ? "#30d158" : "#ff453a",
            background: online ? "rgba(48, 209, 88, 0.18)" : "rgba(255, 69, 58, 0.18)",
            padding: "1px 6px",
            borderRadius: 6,
          }}
        >
          {online ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Network info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 9px",
          borderRadius: 8,
          background: "rgba(255, 255, 255, 0.05)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>
            {online ? "Local Network" : "No Internet"}
          </span>
          <span style={{ fontSize: 10, opacity: 0.55 }}>
            {online ? "Internet access available" : "Check network cables/router"}
          </span>
        </div>
        {online && <Check size={13} color="#30d158" />}
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Action */}
      <div
        onClick={handleOpenSettings}
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
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0a84ff")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span>Wi-Fi Settings...</span>
        <ExternalLink size={12} opacity={0.6} />
      </div>
    </div>
  );
}
