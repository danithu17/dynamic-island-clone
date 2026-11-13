import React, { useState, useEffect } from "react";
import {
  Wifi,
  Bluetooth,
  BellOff,
  Camera,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Music,
  Lock,
  Settings,
  Activity,
  Calculator,
  ChevronRight,
} from "lucide-react";

export default function ControlCenter({ mediaTrack, onClose }) {
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [brightness, setBrightness] = useState(75);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);

  // Sync real Windows brightness and volume
  useEffect(() => {
    window.electronAPI?.getSystemBrightness?.().then((bri) => {
      if (typeof bri === "number") setBrightness(bri);
    });
    window.electronAPI?.getSystemVolume?.().then((res) => {
      if (res && typeof res.volume === "number") {
        setVolume(res.volume);
        setIsMuted(Boolean(res.isMuted));
      }
    });

    const unsubVol = window.electronAPI?.onVolumeChange?.((data) => {
      if (typeof data?.volume === "number") setVolume(data.volume);
      if (typeof data?.isMuted === "boolean") setIsMuted(data.isMuted);
    });

    const unsubBri = window.electronAPI?.onBrightnessChange?.((data) => {
      if (typeof data?.brightness === "number") setBrightness(data.brightness);
    });

    return () => {
      unsubVol?.();
      unsubBri?.();
    };
  }, []);

  const isPlaying = mediaTrack?.state === "playing";

  const handleMediaControl = (command) => {
    window.electronAPI?.controlSystemMedia?.(command);
  };

  const handleBrightnessChange = (newVal) => {
    const val = Number(newVal);
    setBrightness(val);
    window.electronAPI?.setSystemBrightness?.(val);
  };

  const handleVolumeChange = (newVal) => {
    const val = Number(newVal);
    setVolume(val);
    window.electronAPI?.setSystemVolume?.(val);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    window.electronAPI?.controlSystemVolume?.("mute");
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 320, padding: "4px" }}>
      {/* Top 2x2 Network & Mode Toggles Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {/* Wi-Fi Tile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 10px",
            borderRadius: 11,
            background: wifiEnabled ? "rgba(10, 132, 255, 0.22)" : "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${wifiEnabled ? "rgba(10, 132, 255, 0.45)" : "rgba(255, 255, 255, 0.08)"}`,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onClick={() => setWifiEnabled(!wifiEnabled)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: wifiEnabled ? "#0a84ff" : "rgba(255, 255, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <Wifi size={14} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Wi-Fi</span>
              <span style={{ fontSize: 9.5, opacity: 0.6 }}>{wifiEnabled ? "Connected" : "Off"}</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.electronAPI?.openWifiSettings?.();
              onClose?.();
            }}
            style={{ background: "transparent", border: "none", color: "rgba(255, 255, 255, 0.5)", cursor: "pointer", padding: 2 }}
            title="Open Wi-Fi Settings"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Bluetooth Tile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 10px",
            borderRadius: 11,
            background: bluetoothEnabled ? "rgba(10, 132, 255, 0.22)" : "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${bluetoothEnabled ? "rgba(10, 132, 255, 0.45)" : "rgba(255, 255, 255, 0.08)"}`,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: bluetoothEnabled ? "#0a84ff" : "rgba(255, 255, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <Bluetooth size={14} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Bluetooth</span>
              <span style={{ fontSize: 9.5, opacity: 0.6 }}>{bluetoothEnabled ? "On" : "Off"}</span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.electronAPI?.openBluetoothSettings?.();
              onClose?.();
            }}
            style={{ background: "transparent", border: "none", color: "rgba(255, 255, 255, 0.5)", cursor: "pointer", padding: 2 }}
            title="Open Bluetooth Settings"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Do Not Disturb Tile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 11,
            background: dndEnabled ? "rgba(191, 90, 242, 0.22)" : "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${dndEnabled ? "rgba(191, 90, 242, 0.45)" : "rgba(255, 255, 255, 0.08)"}`,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onClick={() => setDndEnabled(!dndEnabled)}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: dndEnabled ? "#bf5af2" : "rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <BellOff size={14} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Focus Assist</span>
            <span style={{ fontSize: 9.5, opacity: 0.6 }}>{dndEnabled ? "Do Not Disturb" : "Off"}</span>
          </div>
        </div>

        {/* Screenshot Tile */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 11,
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onClick={() => {
            window.electronAPI?.takeScreenshot?.();
            onClose?.();
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255, 214, 10, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffd60a",
            }}
          >
            <Camera size={14} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Screenshot</span>
            <span style={{ fontSize: 9.5, opacity: 0.6 }}>Snipping Tool</span>
          </div>
        </div>
      </div>

      {/* Sliders Module (Display & Sound) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "10px 12px",
          borderRadius: 12,
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Display Brightness */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.85 }}>Display Brightness</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0a84ff" }}>{brightness}%</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sun size={15} opacity={0.7} />
            <input
              type="range"
              min="10"
              max="100"
              value={brightness}
              onChange={(e) => handleBrightnessChange(e.target.value)}
              style={{
                flex: 1,
                accentColor: "#0a84ff",
                cursor: "pointer",
                height: 6,
                borderRadius: 3,
              }}
            />
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: darkMode ? "rgba(255, 255, 255, 0.15)" : "transparent",
                border: "none",
                borderRadius: 6,
                padding: "3px 6px",
                color: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 10,
              }}
              title="Toggle Dark Mode"
            >
              <Moon size={11} /> {darkMode ? "Dark" : "Light"}
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(255, 255, 255, 0.07)" }} />

        {/* Sound Volume */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.85 }}>Sound Volume</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: isMuted ? "#ff453a" : "#30d158" }}>
              {isMuted ? "Muted" : `${volume}%`}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={toggleMute}
              style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", padding: 0 }}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={15} color="#ff453a" /> : <Volume2 size={15} opacity={0.7} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(e.target.value)}
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
      </div>

      {/* Now Playing Player Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "10px 12px",
          borderRadius: 12,
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, overflow: "hidden" }}>
            {mediaTrack?.artwork ? (
              <img
                src={mediaTrack.artwork}
                alt=""
                style={{ width: 34, height: 34, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  background: "linear-gradient(135deg, rgba(10, 132, 255, 0.3) 0%, rgba(191, 90, 242, 0.3) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Music size={16} color="#6ea8fe" />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "#ffffff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 160,
                }}
              >
                {mediaTrack?.title || "No Media Playing"}
              </span>
              <span
                style={{
                  fontSize: 10,
                  opacity: 0.6,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 160,
                }}
              >
                {mediaTrack?.artist || "System Media Transport"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <button
              onClick={() => handleMediaControl("previous")}
              style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", padding: 4 }}
              title="Previous Track"
            >
              <SkipBack size={13} />
            </button>
            <button
              onClick={() => handleMediaControl("playpause")}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "#0a84ff",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={12} fill="#ffffff" /> : <Play size={12} fill="#ffffff" />}
            </button>
            <button
              onClick={() => handleMediaControl("next")}
              style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", padding: 4 }}
              title="Next Track"
            >
              <SkipForward size={13} />
            </button>
          </div>
        </div>

        {/* Progress Bar (if track duration is available) */}
        {mediaTrack?.duration > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9.5, opacity: 0.65 }}>
            <span>{formatTime(mediaTrack.position || 0)}</span>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255, 255, 255, 0.15)", position: "relative" }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, ((mediaTrack.position || 0) / mediaTrack.duration) * 100))}%`,
                  height: "100%",
                  borderRadius: 2,
                  background: "#0a84ff",
                }}
              />
            </div>
            <span>{formatTime(mediaTrack.duration)}</span>
          </div>
        )}
      </div>

      {/* Bottom Quick Tools Row */}
      <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
        <button
          onClick={() => {
            window.electronAPI?.launchApp?.("calc");
            onClose?.();
          }}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "5px 6px",
            borderRadius: 8,
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#ffffff",
            fontSize: 10.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
          title="Calculator"
        >
          <Calculator size={11} color="#ff9f0a" /> Calc
        </button>

        <button
          onClick={() => {
            window.electronAPI?.launchApp?.("taskmgr");
            onClose?.();
          }}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "5px 6px",
            borderRadius: 8,
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#ffffff",
            fontSize: 10.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
          title="Task Manager"
        >
          <Activity size={11} color="#ff453a" /> Tasks
        </button>

        <button
          onClick={() => {
            window.electronAPI?.launchApp?.("settings");
            onClose?.();
          }}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "5px 6px",
            borderRadius: 8,
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#ffffff",
            fontSize: 10.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
          title="Windows Settings"
        >
          <Settings size={11} color="#bf5af2" /> Settings
        </button>

        <button
          onClick={() => {
            window.electronAPI?.lockWorkstation?.();
            onClose?.();
          }}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "5px 6px",
            borderRadius: 8,
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#ffffff",
            fontSize: 10.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
          title="Lock Workstation"
        >
          <Lock size={11} color="#ff3b30" /> Lock
        </button>
      </div>
    </div>
  );
}
