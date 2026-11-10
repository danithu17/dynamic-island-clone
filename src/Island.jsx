import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Music, Zap, Battery, BatteryCharging, ArrowLeft } from "lucide-react";
import "./App.css";
import MediaControls from "./components/MediaControls";
import SettingsView from "./components/SettingsView";
import ErrorBoundary from "./components/ErrorBoundary";

export default function Island() {
  const [mode, setMode] = useState("still"); // "still" | "expanded"
  const [activeView, setActiveView] = useState("media"); // "media" | "settings"
  const [isHovered, setIsHovered] = useState(false);
  const [mediaTrack, setMediaTrack] = useState(null);
  const [appVersion, setAppVersion] = useState("5.5.1");
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [batteryInfo, setBatteryInfo] = useState({ percent: 100, charging: false });
  const [currentTime, setCurrentTime] = useState("");

  const mouseLeaveTimer = useRef(null);
  const isHoveredRef = useRef(false);

  // Time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes < 10 ? "0" : ""}${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Battery monitoring
  useEffect(() => {
    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        const updateBat = () => {
          setBatteryInfo({
            percent: Math.round(battery.level * 100),
            charging: battery.charging,
          });
        };
        updateBat();
        battery.addEventListener("levelchange", updateBat);
        battery.addEventListener("chargingchange", updateBat);
      }).catch(() => {});
    }
  }, []);

  // System Media polling
  useEffect(() => {
    let mounted = true;
    const fetchMedia = async () => {
      if (!window.electronAPI?.getSystemMedia) return;
      try {
        const track = await window.electronAPI.getSystemMedia();
        if (mounted) {
          setMediaTrack(track);
        }
      } catch (_) {}
    };

    fetchMedia();
    const interval = setInterval(fetchMedia, 2500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch app version & alwaysOnTop
  useEffect(() => {
    window.electronAPI?.getAppVersion?.().then((v) => v && setAppVersion(v));
    window.electronAPI?.getAlwaysOnTop?.().then((aot) => typeof aot === "boolean" && setAlwaysOnTop(aot));

    const cleanup = window.electronAPI?.onAlwaysOnTopChange?.((aot) => {
      setAlwaysOnTop(aot);
    });
    return () => cleanup?.();
  }, []);

  // Single-instance wakeup listener
  useEffect(() => {
    if (!window.electronAPI?.onIslandWake) return;
    const cleanup = window.electronAPI.onIslandWake(() => {
      setMode("expanded");
      window.electronAPI?.setIgnoreMouseEvents?.(false);
    });
    return () => cleanup?.();
  }, []);

  // Mouse leave & enter handlers
  const handleMouseEnter = useCallback(() => {
    if (mouseLeaveTimer.current) {
      clearTimeout(mouseLeaveTimer.current);
      mouseLeaveTimer.current = null;
    }
    isHoveredRef.current = true;
    setIsHovered(true);
    setMode("expanded");
    window.electronAPI?.setIgnoreMouseEvents?.(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (mouseLeaveTimer.current) clearTimeout(mouseLeaveTimer.current);
    mouseLeaveTimer.current = setTimeout(() => {
      mouseLeaveTimer.current = null;
      isHoveredRef.current = false;
      setIsHovered(false);
      setMode("still");
      setActiveView("media");
      window.electronAPI?.setIgnoreMouseEvents?.(true, true);
    }, 220);
  }, []);

  // Media control handlers
  const handlePlayPause = useCallback(() => {
    window.electronAPI?.controlSystemMedia?.("playpause");
  }, []);
  const handleNext = useCallback(() => {
    window.electronAPI?.controlSystemMedia?.("next");
  }, []);
  const handlePrev = useCallback(() => {
    window.electronAPI?.controlSystemMedia?.("previous");
  }, []);

  const isPlaying = mediaTrack?.state === "playing";

  // Dimensions
  const isExpanded = mode === "expanded";
  const width = isExpanded ? (activeView === "settings" ? 560 : 520) : (isPlaying ? 140 : 126);
  const height = isExpanded ? (activeView === "settings" ? 220 : 130) : 30;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 999999,
      }}
    >
      <motion.div
        id="Island"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        animate={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: "#000000",
          borderBottomLeftRadius: isExpanded ? 26 : 15,
          borderBottomRightRadius: isExpanded ? 26 : 15,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          boxShadow: isExpanded
            ? "0 18px 40px rgba(0, 0, 0, 0.45), 0 4px 14px rgba(0, 0, 0, 0.25)"
            : "0 4px 18px rgba(0, 0, 0, 0.35), 0 0 1px rgba(255, 255, 255, 0.08)",
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 28,
          mass: 0.65,
        }}
        style={{
          position: "fixed",
          top: 0,
          pointerEvents: "auto",
          overflow: "hidden",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Concave upper notch ears */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: -12,
            width: 13,
            height: 12,
            pointerEvents: "none",
            zIndex: 999,
          }}
          viewBox="0 0 13 12"
        >
          <path d="M 0,0 A 12,12 0 0,1 12,12 H 13 V 0 Z" fill="#000000" />
        </svg>

        <svg
          style={{
            position: "absolute",
            top: 0,
            right: -12,
            width: 13,
            height: 12,
            pointerEvents: "none",
            zIndex: 999,
          }}
          viewBox="0 0 13 12"
        >
          <path d="M 0,0 V 12 H 1 A 12,12 0 0,1 13,0 Z" fill="#000000" />
        </svg>

        {/* --- IDLE STATE --- */}
        {!isExpanded && (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 12px",
              boxSizing: "border-box",
              fontSize: 11.5,
              fontWeight: 600,
              fontFamily: 'OpenRunde, -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            }}
          >
            {/* Left: Clock */}
            <span style={{ letterSpacing: "-0.2px" }}>{currentTime}</span>

            {/* Right: Music Indicator or Battery */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {isPlaying ? (
                <div style={{ display: "flex", alignItems: "center", gap: 3, color: "#30d158" }}>
                  <Music size={12} />
                  <span style={{ fontSize: 10, maxWidth: 45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {mediaTrack?.title || "Playing"}
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 3, opacity: 0.8 }}>
                  {batteryInfo.charging ? (
                    <Zap size={12} color="#30d158" />
                  ) : (
                    <Battery size={12} color={batteryInfo.percent <= 20 ? "#ff453a" : "#ffffff"} />
                  )}
                  <span style={{ fontSize: 10.5 }}>{batteryInfo.percent}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- EXPANDED STATE --- */}
        {isExpanded && (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              position: "relative",
            }}
          >
            {/* Top Toolbar Navigation */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 14px 0 14px",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {activeView === "settings" ? (
                  <button
                    onClick={() => setActiveView("media")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "none",
                      borderRadius: 6,
                      color: "#ffffff",
                      fontSize: 10.5,
                      fontWeight: 600,
                      padding: "2px 8px",
                      cursor: "pointer",
                    }}
                  >
                    <ArrowLeft size={11} /> Back
                  </button>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.65, letterSpacing: "0.2px" }}>
                    AURA ISLAND
                  </span>
                )}
              </div>

              {activeView !== "settings" && (
                <button
                  onClick={() => setActiveView("settings")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.65)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 4,
                  }}
                  title="Settings"
                >
                  <Settings size={14} />
                </button>
              )}
            </div>

            {/* View Switcher */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <ErrorBoundary tabName="Island Content">
                {activeView === "media" ? (
                  <MediaControls
                    track={mediaTrack}
                    onPlayPause={handlePlayPause}
                    onNext={handleNext}
                    onPrev={handlePrev}
                  />
                ) : (
                  <SettingsView
                    appVersion={appVersion}
                    alwaysOnTop={alwaysOnTop}
                    onToggleAlwaysOnTop={(enable) => {
                      setAlwaysOnTop(enable);
                      window.electronAPI?.setAlwaysOnTop?.(enable);
                    }}
                    onClose={() => setActiveView("media")}
                  />
                )}
              </ErrorBoundary>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
