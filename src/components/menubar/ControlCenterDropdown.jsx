import React, { useState } from "react";
import {
  Wifi,
  Bluetooth,
  BellOff,
  Camera,
  Sun,
  Volume2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Music,
} from "lucide-react";

export default function ControlCenterDropdown({ mediaTrack, onClose }) {
  const [wifiOn, setWifiOn] = useState(true);
  const [bluetoothOn, setBluetoothOn] = useState(true);
  const [dndOn, setDndOn] = useState(false);
  const [brightness, setBrightness] = useState(80);
  const [volume, setVolume] = useState(70);

  const isPlaying = mediaTrack?.state === "playing";

  const handleMediaControl = (command) => {
    window.electronAPI?.controlSystemMedia?.(command);
  };

  const handleScreenshot = () => {
    window.electronAPI?.takeScreenshot?.();
    onClose?.();
  };

  const toggleTile = (type) => {
    if (type === "wifi") setWifiOn(!wifiOn);
    if (type === "bluetooth") setBluetoothOn(!bluetoothOn);
    if (type === "dnd") setDndOn(!dndOn);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 310, padding: "4px" }}>
      {/* 2x2 Quick Toggles Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {/* Wi-Fi */}
        <div
          onClick={() => toggleTile("wifi")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 10,
            background: wifiOn ? "rgba(10, 132, 255, 0.25)" : "rgba(255, 255, 255, 0.06)",
            border: `1px solid ${wifiOn ? "rgba(10, 132, 255, 0.45)" : "rgba(255, 255, 255, 0.08)"}`,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: wifiOn ? "#0a84ff" : "rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Wifi size={13} color="#ffffff" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700 }}>Wi-Fi</span>
            <span style={{ fontSize: 9.5, opacity: 0.6 }}>{wifiOn ? "Connected" : "Off"}</span>
          </div>
        </div>

        {/* Bluetooth */}
        <div
          onClick={() => toggleTile("bluetooth")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 10,
            background: bluetoothOn ? "rgba(10, 132, 255, 0.25)" : "rgba(255, 255, 255, 0.06)",
            border: `1px solid ${bluetoothOn ? "rgba(10, 132, 255, 0.45)" : "rgba(255, 255, 255, 0.08)"}`,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: bluetoothOn ? "#0a84ff" : "rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bluetooth size={13} color="#ffffff" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700 }}>Bluetooth</span>
            <span style={{ fontSize: 9.5, opacity: 0.6 }}>{bluetoothOn ? "On" : "Off"}</span>
          </div>
        </div>

        {/* Do Not Disturb */}
        <div
          onClick={() => toggleTile("dnd")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 10,
            background: dndOn ? "rgba(191, 90, 242, 0.25)" : "rgba(255, 255, 255, 0.06)",
            border: `1px solid ${dndOn ? "rgba(191, 90, 242, 0.45)" : "rgba(255, 255, 255, 0.08)"}`,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: dndOn ? "#bf5af2" : "rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BellOff size={13} color="#ffffff" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700 }}>Do Not Disturb</span>
            <span style={{ fontSize: 9.5, opacity: 0.6 }}>{dndOn ? "Active" : "Off"}</span>
          </div>
        </div>

        {/* Snipping / Screenshot */}
        <div
          onClick={handleScreenshot}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Camera size={13} color="#ffd60a" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700 }}>Screenshot</span>
            <span style={{ fontSize: 9.5, opacity: 0.6 }}>Capture Area</span>
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "10px",
          borderRadius: 10,
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Brightness */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sun size={14} opacity={0.7} />
          <input
            type="range"
            min="10"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            style={{ flex: 1, accentColor: "#0a84ff", cursor: "pointer" }}
          />
          <span style={{ fontSize: 10, width: 26, textAlign: "right", opacity: 0.7 }}>{brightness}%</span>
        </div>

        {/* Volume */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Volume2 size={14} opacity={0.7} />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              window.electronAPI?.controlSystemVolume?.(e.target.value > volume ? "volup" : "voldown");
            }}
            style={{ flex: 1, accentColor: "#0a84ff", cursor: "pointer" }}
          />
          <span style={{ fontSize: 10, width: 26, textAlign: "right", opacity: 0.7 }}>{volume}%</span>
        </div>
      </div>

      {/* Now Playing Tile */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px",
          borderRadius: 10,
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
          {mediaTrack?.artwork ? (
            <img
              src={mediaTrack.artwork}
              alt=""
              style={{ width: 28, height: 28, borderRadius: 5, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 5,
                background: "rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Music size={14} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
              {mediaTrack?.title || "No Media Playing"}
            </span>
            <span style={{ fontSize: 9.5, opacity: 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {mediaTrack?.artist || "System Audio"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => handleMediaControl("previous")}
            style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", padding: "4px" }}
          >
            <SkipBack size={12} />
          </button>
          <button
            onClick={() => handleMediaControl("playpause")}
            style={{
              background: "#0a84ff",
              border: "none",
              borderRadius: "50%",
              color: "#ffffff",
              cursor: "pointer",
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isPlaying ? <Pause size={10} fill="#ffffff" /> : <Play size={10} fill="#ffffff" />}
          </button>
          <button
            onClick={() => handleMediaControl("next")}
            style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", padding: "4px" }}
          >
            <SkipForward size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
