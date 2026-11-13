import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Volume1, Volume, ExternalLink } from "lucide-react";

export default function VolumeDropdown({ onClose }) {
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Read real system volume from Windows
    if (window.electronAPI?.getSystemVolume) {
      window.electronAPI.getSystemVolume().then((res) => {
        if (res && typeof res.volume === "number") {
          setVolume(res.volume);
          setIsMuted(Boolean(res.isMuted));
        }
      }).catch(() => {});
    }

    const unsub = window.electronAPI?.onVolumeChange?.((data) => {
      if (data && typeof data.volume === "number") {
        setVolume(data.volume);
        if (typeof data.isMuted === "boolean") setIsMuted(data.isMuted);
      }
    });
    return () => unsub?.();
  }, []);

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (isMuted && val > 0) setIsMuted(false);
    window.electronAPI?.setSystemVolume?.(val);
  };

  const handleAction = (action) => {
    if (action === "mute") {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
    }
    window.electronAPI?.controlSystemVolume?.(action);
  };

  const renderIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={15} color="#ff453a" />;
    if (volume < 35) return <Volume size={15} color="#30d158" />;
    if (volume < 70) return <Volume1 size={15} color="#30d158" />;
    return <Volume2 size={15} color="#30d158" />;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 250, padding: "2px 4px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {renderIcon()}
          <span style={{ fontSize: 13, fontWeight: 700 }}>Sound Volume</span>
        </div>
        <button
          onClick={() => handleAction("mute")}
          style={{
            background: isMuted ? "rgba(255, 69, 58, 0.2)" : "rgba(255, 255, 255, 0.08)",
            border: `1px solid ${isMuted ? "rgba(255, 69, 58, 0.4)" : "rgba(255, 255, 255, 0.12)"}`,
            borderRadius: 6,
            color: isMuted ? "#ff453a" : "#ffffff",
            fontSize: 10.5,
            fontWeight: 600,
            padding: "2px 8px",
            cursor: "pointer",
          }}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
      </div>

      {/* Volume Percentage & Slider */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "2px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, opacity: 0.65 }}>Master Output</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: isMuted ? "#ff453a" : "#30d158" }}>
            {isMuted ? "Muted" : `${volume}%`}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => handleAction("mute")}
            style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", padding: 0 }}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {renderIcon()}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={handleSliderChange}
            style={{
              flex: 1,
              accentColor: "#30d158",
              cursor: "pointer",
              height: 6,
              borderRadius: 3,
            }}
          />
        </div>
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
          <Volume1 size={13} /> Step Down
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
          <Volume2 size={13} /> Step Up
        </button>
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Link to Windows Sound Settings */}
      <div
        onClick={() => {
          onClose?.();
          window.electronAPI?.openSoundSettings?.();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "5px 6px",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 11.5,
          color: "rgba(255, 255, 255, 0.85)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0070f3")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span>Sound Settings...</span>
        <ExternalLink size={12} opacity={0.6} />
      </div>
    </div>
  );
}
