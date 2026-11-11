import React, { useState } from "react";
import { Volume2, VolumeX, Volume1, Volume } from "lucide-react";

export default function VolumeDropdown() {
  const [isMuted, setIsMuted] = useState(false);

  const handleAction = (action) => {
    if (action === "mute") setIsMuted(!isMuted);
    window.electronAPI?.controlSystemVolume?.(action);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 220 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {isMuted ? <VolumeX size={14} color="#ff453a" /> : <Volume2 size={14} color="#30d158" />}
          <span style={{ fontSize: 13, fontWeight: 700 }}>Sound Volume</span>
        </div>
        <button
          onClick={() => handleAction("mute")}
          style={{
            background: isMuted ? "rgba(255, 69, 58, 0.2)" : "rgba(255, 255, 255, 0.08)",
            border: "none",
            borderRadius: 6,
            color: isMuted ? "#ff453a" : "#ffffff",
            fontSize: 10.5,
            fontWeight: 600,
            padding: "2px 7px",
            cursor: "pointer",
          }}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Quick Vol Up / Down buttons */}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => handleAction("voldown")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: "6px 8px",
            borderRadius: 7,
            background: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#0070f3")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.07)")}
        >
          <Volume1 size={13} /> Down
        </button>

        <button
          onClick={() => handleAction("volup")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: "6px 8px",
            borderRadius: 7,
            background: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#0070f3")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.07)")}
        >
          <Volume2 size={13} /> Up
        </button>
      </div>
    </div>
  );
}
