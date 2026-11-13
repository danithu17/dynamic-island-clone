import React from "react";
import { Bluetooth, ExternalLink } from "lucide-react";

export default function BluetoothDropdown({ onClose }) {
  const handleOpenSettings = () => {
    window.electronAPI?.openBluetoothSettings?.();
    onClose?.();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 250 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Bluetooth size={14} color="#0a84ff" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Bluetooth</span>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#6ea8fe",
            background: "rgba(10, 132, 255, 0.18)",
            padding: "1px 6px",
            borderRadius: 6,
          }}
        >
          Enabled
        </span>
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      <div
        style={{
          padding: "8px 9px",
          borderRadius: 8,
          background: "rgba(255, 255, 255, 0.05)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>Bluetooth Devices</span>
        <span style={{ fontSize: 10, opacity: 0.55 }}>Manage paired peripherals and audio devices</span>
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
        <span>Bluetooth Settings...</span>
        <ExternalLink size={12} opacity={0.6} />
      </div>
    </div>
  );
}
