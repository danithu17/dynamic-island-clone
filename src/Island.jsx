import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Music, Zap, Battery, ArrowLeft, Timer as TimerIcon, Play, Square } from "lucide-react";
import "./App.css";
import MediaControls from "./components/MediaControls";
import QuickToggles from "./components/QuickToggles";
import SettingsView from "./components/SettingsView";
import SmartAlertView from "./components/SmartAlertView";
import ErrorBoundary from "./components/ErrorBoundary";
import { alertQueue } from "./services/alertQueue";

export default function Island() {
  const [mode, setMode] = useState("still"); // "still" | "expanded"
  const [activeView, setActiveView] = useState("media"); // "media" | "settings"
  const [isHovered, setIsHovered] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [mediaTrack, setMediaTrack] = useState(null);
  const [appVersion, setAppVersion] = useState("5.5.1");
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [batteryInfo, setBatteryInfo] = useState({ percent: 100, charging: false });
  const [currentTime, setCurrentTime] = useState("");

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [timerTotalDuration, setTimerTotalDuration] = useState(0);

  const mouseLeaveTimer = useRef(null);
  const isHoveredRef = useRef(false);
  const prevBatteryRef = useRef({ percent: 100, charging: false });

  // Subscribe to central Smart Alerts
  useEffect(() => {
    const unsubscribe = alertQueue.subscribe((alert) => {
      setActiveAlert(alert);
    });
    return unsubscribe;
  }, []);

  // Time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes < 10 ? "0" : ""}${minutes}`);
    };
    updateTime();
    const ticker = setInterval(updateTime, 10000);
    return () => clearInterval(ticker);
  }, []);

  // Battery monitoring & Smart Alerts
  useEffect(() => {
    if (!navigator.getBattery) return;

    navigator.getBattery().then((battery) => {
      const evaluateBattery = () => {
        const percent = Math.round(battery.level * 100);
        const charging = battery.charging;
        const prev = prevBatteryRef.current;

        setBatteryInfo({ percent, charging });

        // Charging started
        if (charging && !prev.charging) {
          alertQueue.showAlert({
            type: "battery",
            icon: "battery-charging",
            title: "Charging Started",
            subtitle: `${percent}% Power`,
            accentColor: "#30d158",
            priority: 5,
          });
        }
        // Low battery warnings (20% and 10%)
        else if (!charging && percent <= 20 && prev.percent > 20) {
          alertQueue.showAlert({
            type: "battery",
            icon: "battery-low",
            title: "Low Battery",
            subtitle: `${percent}% Remaining`,
            accentColor: "#ff453a",
            priority: 8,
          });
        } else if (!charging && percent <= 10 && prev.percent > 10) {
          alertQueue.showAlert({
            type: "battery",
            icon: "battery-low",
            title: "Very Low Battery",
            subtitle: `${percent}% Connect Charger`,
            accentColor: "#ff453a",
            priority: 9,
          });
        }
        // Fully charged
        else if (charging && percent === 100 && prev.percent < 100) {
          alertQueue.showAlert({
            type: "battery",
            icon: "battery-full",
            title: "Fully Charged",
            subtitle: "100% Ready",
            accentColor: "#30d158",
            priority: 6,
          });
        }

        prevBatteryRef.current = { percent, charging };
      };

      evaluateBattery();
      battery.addEventListener("levelchange", evaluateBattery);
      battery.addEventListener("chargingchange", evaluateBattery);
    }).catch(() => {});
  }, []);

  // Downloads Completed Watcher listener
  useEffect(() => {
    if (!window.electronAPI?.onNewDownload) return;
    const cleanup = window.electronAPI.onNewDownload(({ fileName, filePath }) => {
      alertQueue.showAlert({
        type: "download",
        icon: "download",
        title: "Download Complete",
        subtitle: fileName,
        accentColor: "#0a84ff",
        priority: 7,
        duration: 5000,
        action: () => {
          window.electronAPI?.showItemInFolder?.(filePath);
        },
      });
    });
    return cleanup;
  }, []);

  // System Volume change alert listener
  useEffect(() => {
    if (!window.electronAPI?.onVolumeChange) return;
    const cleanup = window.electronAPI.onVolumeChange(({ action }) => {
      alertQueue.showAlert({
        type: "volume",
        icon: action === "mute" ? "volume-mute" : "volume",
        title: action === "mute" ? "Audio Muted" : "Volume Changed",
        subtitle: action === "mute" ? "Muted" : action === "volup" ? "▲ Up" : "▼ Down",
        accentColor: "#ffffff",
        priority: 4,
        duration: 2500,
      });
    });
    return cleanup;
  }, []);

  // Online / Offline network alerts
  useEffect(() => {
    const handleOnline = () => {
      alertQueue.showAlert({
        type: "network",
        icon: "wifi",
        title: "Wi-Fi Connected",
        subtitle: "Online",
        accentColor: "#30d158",
        priority: 4,
        duration: 3500,
      });
    };

    const handleOffline = () => {
      alertQueue.showAlert({
        type: "network",
        icon: "wifi-off",
        title: "Wi-Fi Disconnected",
        subtitle: "Offline",
        accentColor: "#ff453a",
        priority: 7,
        duration: 4500,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Live Timer Countdown ticker
  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          const nextSec = prev - 1;
          const m = Math.floor(nextSec / 60);
          const s = nextSec % 60;
          const timeStr = `${m}:${s < 10 ? "0" : ""}${s}`;

          if (nextSec <= 0) {
            setTimerRunning(false);
            alertQueue.dismissByType("timer");
            alertQueue.showAlert({
              type: "timer",
              icon: "timer",
              title: "Timer Finished",
              subtitle: "Time's up!",
              accentColor: "#ff9f0a",
              priority: 20,
              duration: 5000,
            });
            return 0;
          }

          // Live pill countdown activity
          alertQueue.showAlert({
            type: "timer",
            icon: "timer",
            title: "Timer",
            subtitle: timeStr,
            progress: timerTotalDuration > 0 ? nextSec / timerTotalDuration : 0,
            persistent: true,
            priority: 10,
            accentColor: "#ff9f0a",
          });

          return nextSec;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerSecondsLeft, timerTotalDuration]);

  const startTimer = (minutes) => {
    const totalSec = minutes * 60;
    setTimerTotalDuration(totalSec);
    setTimerSecondsLeft(totalSec);
    setTimerRunning(true);

    const m = minutes;
    const timeStr = `${m}:00`;
    alertQueue.showAlert({
      type: "timer",
      icon: "timer",
      title: "Timer",
      subtitle: timeStr,
      progress: 1,
      persistent: true,
      priority: 10,
      accentColor: "#ff9f0a",
    });
  };

  const stopTimer = () => {
    setTimerRunning(false);
    setTimerSecondsLeft(0);
    alertQueue.dismissByType("timer");
  };

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
    alertQueue.pauseTimer();

    // If an alert is active, hovering keeps it visible, or click opens large
    setMode("expanded");
    window.electronAPI?.setIgnoreMouseEvents?.(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (mouseLeaveTimer.current) clearTimeout(mouseLeaveTimer.current);
    mouseLeaveTimer.current = setTimeout(() => {
      mouseLeaveTimer.current = null;
      isHoveredRef.current = false;
      setIsHovered(false);
      alertQueue.resumeTimer();
      setMode("still");
      setActiveView("media");
      window.electronAPI?.setIgnoreMouseEvents?.(true, true);
    }, 220);
  }, []);

  const isPlaying = mediaTrack?.state === "playing";
  const isExpanded = mode === "expanded";

  // Dynamic dimensions based on state
  let width = 126;
  let height = 30;

  if (isExpanded) {
    width = activeView === "settings" ? 560 : 520;
    height = activeView === "settings" ? 220 : 190;
  } else if (activeAlert) {
    // Morph pill to fit compact live activity alert
    width = 270;
    height = 34;
  } else if (isPlaying) {
    width = 140;
    height = 30;
  }

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
          borderBottomLeftRadius: isExpanded ? 26 : 16,
          borderBottomRightRadius: isExpanded ? 26 : 16,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          boxShadow: isExpanded
            ? "0 18px 40px rgba(0, 0, 0, 0.45), 0 4px 14px rgba(0, 0, 0, 0.25)"
            : activeAlert
              ? `0 12px 28px rgba(0, 0, 0, 0.4), 0 0 12px ${activeAlert.accentColor || "#0a84ff"}35`
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
        {/* Concave upper notch ears merging with display bezel */}
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

        {/* --- STATE 1: SMART ALERT LIVE ACTIVITY (IDLE MORPH) --- */}
        {!isExpanded && activeAlert && (
          <SmartAlertView alert={activeAlert} onClick={() => alertQueue.dismissCurrent()} />
        )}

        {/* --- STATE 2: IDLE NOTCH RESTING STATE --- */}
        {!isExpanded && !activeAlert && (
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

        {/* --- STATE 3: EXPANDED DASHBOARD --- */}
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

            {/* View Content */}
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <ErrorBoundary tabName="Island Content">
                {activeView === "media" ? (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <div style={{ flex: 1, minHeight: 0 }}>
                      <MediaControls
                        track={mediaTrack}
                        onPlayPause={() => window.electronAPI?.controlSystemMedia?.("playpause")}
                        onNext={() => window.electronAPI?.controlSystemMedia?.("next")}
                        onPrev={() => window.electronAPI?.controlSystemMedia?.("previous")}
                      />
                    </div>

                    {/* Quick Toggles Row */}
                    <QuickToggles />

                    {/* Quick Timer presets bar */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 14px 10px 14px",
                        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                        boxSizing: "border-box",
                        background: "rgba(0, 0, 0, 0.2)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <TimerIcon size={13} color="#ff9f0a" />
                        <span style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.75 }}>Quick Timer:</span>
                        {[1, 5, 15, 25].map((mins) => (
                          <button
                            key={mins}
                            onClick={() => startTimer(mins)}
                            style={{
                              background: "rgba(255, 255, 255, 0.08)",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              borderRadius: 6,
                              color: "#ffffff",
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "2px 7px",
                              cursor: "pointer",
                            }}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>

                      {timerRunning && (
                        <button
                          onClick={stopTimer}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "rgba(255, 69, 58, 0.2)",
                            border: "1px solid rgba(255, 69, 58, 0.4)",
                            borderRadius: 6,
                            color: "#ff453a",
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 7px",
                            cursor: "pointer",
                          }}
                        >
                          <Square size={9} fill="#ff453a" /> Stop ({Math.floor(timerSecondsLeft / 60)}:{(timerSecondsLeft % 60).toString().padStart(2, "0")})
                        </button>
                      )}
                    </div>
                  </div>
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
