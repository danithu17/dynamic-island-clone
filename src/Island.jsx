import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Music, Zap, Battery, ArrowLeft, Timer as TimerIcon, Play, Square, Folder } from "lucide-react";
import "./App.css";
import MediaControls from "./components/MediaControls";
import QuickToggles from "./components/QuickToggles";
import SmartAlertView from "./components/SmartAlertView";
import DragMouthView from "./components/DragMouthView";
import ShelfView from "./components/ShelfView";
import ErrorBoundary from "./components/ErrorBoundary";
import FirstRunSetup from "./components/FirstRunSetup";
import MenuBar from "./components/menubar/MenuBar";
import { alertQueue } from "./services/alertQueue";
import { shelfStorage } from "./services/shelfStorage";
import designTokens, { snapToPhysicalPixels } from "./styles/designTokens";

export default function Island() {
  const [mode, setMode] = useState("still"); // "still" | "expanded" | "drag-mouth"
  const [activeView, setActiveView] = useState("media"); // "media" | "shelf" | "settings"
  const [isHovered, setIsHovered] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [mediaTrack, setMediaTrack] = useState(null);
  const [appVersion, setAppVersion] = useState("5.5.1");
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [batteryInfo, setBatteryInfo] = useState({ percent: 100, charging: false });
  const [currentTime, setCurrentTime] = useState("");
  const [shelfCount, setShelfCount] = useState(0);
  const [setupDimensions, setSetupDimensions] = useState({ width: 480, height: 252 });
  const [wakeHint, setWakeHint] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  // Track system preference for reduced motion live
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setSystemPrefersReducedMotion(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
  }, []);

  // Frame timing measurement for 60fps budget verification
  const animFrameTracker = useRef({
    rafId: null,
    lastTime: 0,
    worstFrameTime: 0,
    frameTimes: [],
    active: false,
  });

  const startFrameTracking = useCallback(() => {
    if (animFrameTracker.current.active) return;
    animFrameTracker.current.active = true;
    animFrameTracker.current.lastTime = performance.now();
    animFrameTracker.current.frameTimes = [];

    const checkFrame = (now) => {
      if (!animFrameTracker.current.active) return;
      const delta = now - animFrameTracker.current.lastTime;
      animFrameTracker.current.lastTime = now;
      if (delta > 0 && delta < 500) {
        animFrameTracker.current.frameTimes.push(delta);
        if (delta > animFrameTracker.current.worstFrameTime) {
          animFrameTracker.current.worstFrameTime = delta;
        }
      }
      animFrameTracker.current.rafId = requestAnimationFrame(checkFrame);
    };
    animFrameTracker.current.rafId = requestAnimationFrame(checkFrame);
  }, []);

  const stopFrameTracking = useCallback(() => {
    if (!animFrameTracker.current.active) return;
    animFrameTracker.current.active = false;
    if (animFrameTracker.current.rafId) {
      cancelAnimationFrame(animFrameTracker.current.rafId);
      animFrameTracker.current.rafId = null;
    }
    const frames = animFrameTracker.current.frameTimes;
    if (frames.length > 0) {
      const avg = frames.reduce((a, b) => a + b, 0) / frames.length;
      const worst = animFrameTracker.current.worstFrameTime;
      const fps = Math.round(1000 / avg);
      if (typeof window !== "undefined") {
        window.__auraFrameStats = {
          avgFps: Math.min(60, fps),
          avgFrameTimeMs: parseFloat(avg.toFixed(2)),
          worstFrameTimeMs: parseFloat(worst.toFixed(2)),
          totalFrames: frames.length,
        };
      }
    }
  }, []);

  // Menu Bar / Reserved Strip State
  const [stripHeight, setStripHeight] = useState(34);
  const [islandMode, setIslandMode] = useState("reserved");

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [timerTotalDuration, setTimerTotalDuration] = useState(0);

  const mouseLeaveTimer = useRef(null);
  const dragLeaveTimer = useRef(null);
  const isHoveredRef = useRef(false);
  const prevBatteryRef = useRef({ percent: 100, charging: false });

  // Subscribe to shelf items count
  useEffect(() => {
    return shelfStorage.subscribe((items) => {
      setShelfCount(items.length);
    });
  }, []);

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

  // System Volume change alert listener (Keyboard keys + Sliders)
  useEffect(() => {
    if (!window.electronAPI?.onVolumeChange) return;
    const cleanup = window.electronAPI.onVolumeChange((data) => {
      const vol = typeof data?.volume === "number" ? data.volume : 70;
      const isMuted = Boolean(data?.isMuted || data?.action === "mute");

      alertQueue.showAlert({
        type: "volume",
        icon: isMuted ? "volume-mute" : "volume",
        title: isMuted ? "Audio Muted" : "Sound Volume",
        subtitle: isMuted ? "Muted" : `${vol}%`,
        progress: isMuted ? 0 : vol / 100,
        accentColor: isMuted ? "#ff453a" : "#30d158",
        priority: 7,
        duration: 2200,
      });
    });
    return () => cleanup?.();
  }, []);

  // System Brightness change alert listener (Keyboard keys + Sliders)
  useEffect(() => {
    if (!window.electronAPI?.onBrightnessChange) return;
    const cleanup = window.electronAPI.onBrightnessChange((data) => {
      const bri = typeof data?.brightness === "number" ? data.brightness : 75;

      alertQueue.showAlert({
        type: "brightness",
        icon: "brightness",
        title: "Display Brightness",
        subtitle: `${bri}%`,
        progress: bri / 100,
        accentColor: "#ff9f0a",
        priority: 7,
        duration: 2200,
      });
    });
    return () => cleanup?.();
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

  // System Media polling (paused on lock/suspend)
  useEffect(() => {
    let mounted = true;
    let isPaused = false;
    const fetchMedia = async () => {
      if (!window.electronAPI?.getSystemMedia || isPaused) return;
      try {
        const track = await window.electronAPI.getSystemMedia();
        if (mounted && !isPaused) {
          setMediaTrack(track);
        }
      } catch (_) {}
    };

    fetchMedia();
    const interval = setInterval(fetchMedia, 2500);

    const unsubSuspend = window.electronAPI?.onSystemSuspend?.(() => {
      isPaused = true;
    });
    const unsubLock = window.electronAPI?.onSystemLock?.(() => {
      isPaused = true;
    });
    const unsubResume = window.electronAPI?.onSystemResume?.(() => {
      isPaused = false;
      fetchMedia();
    });
    const unsubUnlock = window.electronAPI?.onSystemUnlock?.(() => {
      isPaused = false;
      fetchMedia();
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      unsubSuspend?.();
      unsubLock?.();
      unsubResume?.();
      unsubUnlock?.();
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

  // Fetch MenuBar / AppBar config & full settings
  const [islandSettings, setIslandSettings] = useState({
    style: "notch",
    idleSize: "compact",
    hoverDelay: 180,
    collapseDelay: 350,
    mascotEyes: true,
    reduceMotion: false,
    animationSpeed: "normal",
    accentColor: "#0a84ff",
  });
  const [mascotBlink, setMascotBlink] = useState(false);
  const hoverEnterTimer = useRef(null);

  useEffect(() => {
    if (window.electronAPI?.getMenuBarConfig) {
      window.electronAPI.getMenuBarConfig().then((cfg) => {
        if (cfg) {
          if (typeof cfg.stripHeight === "number") setStripHeight(cfg.stripHeight);
          if (cfg.islandPosition) setIslandMode(cfg.islandPosition);
        }
      });
    }

    if (window.electronAPI?.getSettings) {
      window.electronAPI.getSettings().then((s) => {
        if (s) {
          setIslandSettings({
            style: s.island?.style || "notch",
            idleSize: s.island?.idleSize || "compact",
            hoverDelay: typeof s.island?.hoverDelay === "number" ? s.island.hoverDelay : 180,
            collapseDelay: typeof s.island?.collapseDelay === "number" ? s.island.collapseDelay : 350,
            mascotEyes: s.island?.mascotEyes !== false,
            reduceMotion: Boolean(s.island?.reduceMotion),
            animationSpeed: s.island?.animationSpeed || "normal",
            accentColor: s.appearance?.accentColor || "#0a84ff",
          });
          if (s.firstRun && s.firstRun.completed === false) {
            setMode("setup");
            window.electronAPI?.setIgnoreMouseEvents?.(false);
          }
        }
      });
    }

    const unsubMode = window.electronAPI?.onIslandModeChanged?.((mode) => {
      if (mode) setIslandMode(mode);
    });

    const unsubCfg = window.electronAPI?.onMenuBarConfigChanged?.((cfg) => {
      if (typeof cfg?.stripHeight === "number") setStripHeight(cfg.stripHeight);
    });

    const unsubSettings = window.electronAPI?.onSettingsChanged?.((data) => {
      const s = data?.settings;
      if (s) {
        setIslandSettings({
          style: s.island?.style || "notch",
          idleSize: s.island?.idleSize || "compact",
          hoverDelay: typeof s.island?.hoverDelay === "number" ? s.island.hoverDelay : 180,
          collapseDelay: typeof s.island?.collapseDelay === "number" ? s.island.collapseDelay : 350,
          mascotEyes: s.island?.mascotEyes !== false,
          reduceMotion: Boolean(s.island?.reduceMotion),
          animationSpeed: s.island?.animationSpeed || "normal",
          accentColor: s.appearance?.accentColor || "#0a84ff",
        });
      }
    });

    const unsubCorrupt = window.electronAPI?.onCorruptRecovered?.(() => {
      alertQueue.showAlert({
        type: "network",
        icon: "download",
        title: "Settings Restored",
        subtitle: "Corrupt configuration backed up; loaded defaults",
        accentColor: "#ff9f0a",
        priority: 8,
        duration: 4500,
      });
    });

    const unsubFirstRun = window.electronAPI?.onStartFirstRun?.(() => {
      setMode("setup");
      window.electronAPI?.setIgnoreMouseEvents?.(false);
    });

    const unsubUpdate = window.electronAPI?.onUpdateEvent?.((evt) => {
      if (!evt) return;
      if (evt.type === "available") {
        const targetVersion = evt.version || "v1.1.0";
        alertQueue.showAlert({
          id: `update-${targetVersion}`,
          type: "download",
          icon: "download",
          title: `Update available - ${targetVersion.startsWith("v") ? targetVersion : "v" + targetVersion}`,
          subtitle: "New version ready",
          priority: 9,
          persistent: true,
          accentColor: "#0a84ff",
          buttons: [
            {
              label: "Update",
              primary: true,
              onClick: () => {
                window.electronAPI?.setIgnoreMouseEvents?.(false);
                alertQueue.showAlert({
                  id: `update-${targetVersion}`,
                  type: "download",
                  icon: "download",
                  title: `Downloading ${targetVersion}`,
                  progress: 0.05,
                  priority: 9,
                  persistent: true,
                  accentColor: "#0a84ff",
                });
                window.electronAPI?.startUpdateDownload?.(evt);
              },
            },
            {
              label: "Later",
              primary: false,
              onClick: () => {
                alertQueue.dismissByType("download");
              },
            },
          ],
        });
      } else if (evt.type === "download-progress") {
        const percent = typeof evt.percent === "number" ? evt.percent : 0;
        alertQueue.showAlert({
          id: `update-${evt.version}`,
          type: "download",
          icon: "download",
          title: `Downloading ${evt.version || ""}`.trim(),
          subtitle: `${Math.round(percent * 100)}%`,
          progress: percent,
          priority: 9,
          persistent: true,
          accentColor: "#0a84ff",
        });
      } else if (evt.type === "downloaded") {
        alertQueue.showAlert({
          id: `update-${evt.version}`,
          type: "download",
          icon: "download",
          title: "Update ready",
          priority: 9,
          persistent: true,
          accentColor: "#30d158",
          buttons: [
            {
              label: "Restart to finish",
              primary: true,
              onClick: () => {
                window.electronAPI?.installUpdate?.();
              },
            },
          ],
        });
      }
    });

    return () => {
      unsubMode?.();
      unsubCfg?.();
      unsubSettings?.();
      unsubCorrupt?.();
      unsubFirstRun?.();
      unsubUpdate?.();
    };
  }, []);

  // Mascot eyes blinking
  useEffect(() => {
    if (!islandSettings.mascotEyes) return;
    const interval = setInterval(() => {
      setMascotBlink(true);
      setTimeout(() => setMascotBlink(false), 180);
    }, 3600);
    return () => clearInterval(interval);
  }, [islandSettings.mascotEyes]);

  // Single-instance wakeup listener
  useEffect(() => {
    if (!window.electronAPI?.onIslandWake) return;
    const cleanup = window.electronAPI.onIslandWake(() => {
      setMode("expanded");
      window.electronAPI?.setIgnoreMouseEvents?.(false);
    });
    return () => cleanup?.();
  }, []);

  // Dismiss / collapse when clicking outside, window blur, or Esc key
  useEffect(() => {
    const dismissIsland = () => {
      if (mode !== "setup") {
        setMode("still");
        setActiveView("media");
        alertQueue.dismissCurrent();
        window.electronAPI?.setIgnoreMouseEvents?.(true, true);
        window.electronAPI?.restorePreviousFocus?.();
      }
    };

    const handleWindowBlur = () => {
      dismissIsland();
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        dismissIsland();
      }
    };

    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleKeyDown);
    const unsubBlur = window.electronAPI?.onIslandBlur?.(handleWindowBlur);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleKeyDown);
      unsubBlur?.();
    };
  }, [mode]);

  // Track mode in ref to avoid stale closures
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const hysteresisTimer = useRef(null);

  // Mouse leave & enter handlers with jitter hysteresis & collapse cancellation
  const handleMouseEnter = useCallback(() => {
    if (mouseLeaveTimer.current) {
      clearTimeout(mouseLeaveTimer.current);
      mouseLeaveTimer.current = null;
    }
    if (hysteresisTimer.current) {
      clearTimeout(hysteresisTimer.current);
      hysteresisTimer.current = null;
    }
    isHoveredRef.current = true;
    setIsHovered(true);
    alertQueue.pauseTimer();
    window.electronAPI?.setIgnoreMouseEvents?.(false);

    if (modeRef.current === "expanded") {
      return;
    }

    const delay = islandSettings.hoverDelay || 180;
    if (hoverEnterTimer.current) clearTimeout(hoverEnterTimer.current);
    hoverEnterTimer.current = setTimeout(() => {
      setIsAnimating(true);
      startFrameTracking();
      setMode("expanded");
      window.electronAPI?.setIgnoreMouseEvents?.(false);
    }, delay);
  }, [islandSettings.hoverDelay, startFrameTracking]);

  const handleMouseLeave = useCallback(() => {
    if (hoverEnterTimer.current) {
      clearTimeout(hoverEnterTimer.current);
      hoverEnterTimer.current = null;
    }
    if (mouseLeaveTimer.current) {
      clearTimeout(mouseLeaveTimer.current);
      mouseLeaveTimer.current = null;
    }
    if (hysteresisTimer.current) {
      clearTimeout(hysteresisTimer.current);
      hysteresisTimer.current = null;
    }

    // In resting notch mode, use a short hysteresis delay (140ms) before relinquishing hover
    // so micro-movements across boundary or window resizing under the cursor do not jitter
    if (modeRef.current === "still") {
      hysteresisTimer.current = setTimeout(() => {
        isHoveredRef.current = false;
        setIsHovered(false);
        alertQueue.resumeTimer();
        window.electronAPI?.setIgnoreMouseEvents?.(true, true);
        hysteresisTimer.current = null;
      }, 140);
      return;
    }

    const delay = islandSettings.collapseDelay || 350;
    mouseLeaveTimer.current = setTimeout(() => {
      mouseLeaveTimer.current = null;
      isHoveredRef.current = false;
      setIsHovered(false);
      alertQueue.resumeTimer();
      setIsAnimating(true);
      startFrameTracking();
      setMode("still");
      setActiveView("media");
      window.electronAPI?.setIgnoreMouseEvents?.(true, true);
      window.electronAPI?.restorePreviousFocus?.();
    }, delay);
  }, [islandSettings.collapseDelay, startFrameTracking]);

  // Drag and drop mouth handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragLeaveTimer.current) {
      clearTimeout(dragLeaveTimer.current);
      dragLeaveTimer.current = null;
    }
    setMode("drag-mouth");
    window.electronAPI?.setIgnoreMouseEvents?.(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragLeaveTimer.current) {
      clearTimeout(dragLeaveTimer.current);
      dragLeaveTimer.current = null;
    }
    if (mode !== "drag-mouth") {
      setMode("drag-mouth");
      window.electronAPI?.setIgnoreMouseEvents?.(false);
    }
  }, [mode]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragLeaveTimer.current) clearTimeout(dragLeaveTimer.current);
    dragLeaveTimer.current = setTimeout(() => {
      dragLeaveTimer.current = null;
      if (mode === "drag-mouth") {
        setMode("still");
        window.electronAPI?.setIgnoreMouseEvents?.(true, true);
      }
    }, 280);
  }, [mode]);

  const handleDropItem = useCallback((item, targetTile) => {
    if (dragLeaveTimer.current) clearTimeout(dragLeaveTimer.current);

    if (targetTile === "shelf") {
      shelfStorage.addItem(item);
      alertQueue.showAlert({
        type: "shelf",
        icon: "download",
        title: "Saved to Shelf",
        subtitle: item.name,
        accentColor: "#30d158",
        priority: 6,
        duration: 3500,
      });
    } else if (targetTile === "mail") {
      shelfStorage.addItem({ ...item, target: "mail" });
      alertQueue.showAlert({
        type: "network",
        icon: "mail",
        title: "Queued for Gmail",
        subtitle: item.name,
        accentColor: "#0a84ff",
        priority: 6,
        duration: 3500,
      });
    } else if (targetTile === "phone") {
      shelfStorage.addItem({ ...item, target: "phone" });
      alertQueue.showAlert({
        type: "network",
        icon: "smartphone",
        title: "Ready to Beam to Phone",
        subtitle: item.name,
        accentColor: "#bf5af2",
        priority: 6,
        duration: 3500,
      });
    }

    setMode("still");
    window.electronAPI?.setIgnoreMouseEvents?.(true, true);
  }, []);

  const isPlaying = mediaTrack?.state === "playing";
  const isExpanded = mode === "expanded";
  const isDragMouth = mode === "drag-mouth";
  const isSetup = mode === "setup";

  // Dynamic dimensions based on state
  let width = 140;
  let height = stripHeight;

  if (isSetup) {
    width = 480;
    if (setupDimensions?.width) width = setupDimensions.width;
    height = 252;
    if (setupDimensions?.height) height = setupDimensions.height;
  } else if (isDragMouth) {
    width = 380;
    height = 84;
  } else if (isExpanded) {
    width = activeView === "settings" ? 560 : activeView === "shelf" ? 500 : 520;
    height = activeView === "settings" ? 220 : activeView === "shelf" ? 220 : 190;
  } else if (activeAlert) {
    // Morph pill to fit compact live activity alert
    width = activeAlert.width || (activeAlert.buttons ? 336 : 272);
    height = Math.max(stripHeight, 38);
  } else if (wakeHint) {
    width = 248;
    height = stripHeight;
  } else if (isPlaying) {
    width = 150;
    height = stripHeight;
  } else if (islandMode === "reserved") {
    // In reserved mode, the menu bar displays clock and battery on the right.
    // The notch idle pill is clean, minimal, flush with the top edge.
    width = 76;
    height = stripHeight;
  }

  return (
    <>
      <MenuBar
        stripHeight={stripHeight}
        islandMode={islandMode}
        notchWidth={width}
        isNotchHovered={isHovered}
        isNotchExpanded={isExpanded}
        mediaTrack={mediaTrack}
        timerRunning={timerRunning}
        timerSecondsLeft={timerSecondsLeft}
        onStartTimer={startTimer}
        onStopTimer={stopTimer}
        onOpenSettings={(view) => {
          if (window.electronAPI?.openSettingsWindow) {
            window.electronAPI.openSettingsWindow(view === "media" ? "features" : (view || "general"));
          }
        }}
        onOpenAbout={() => {
          if (window.electronAPI?.openSettingsWindow) {
            window.electronAPI.openSettingsWindow("about");
          }
        }}
      />
      {/* Click-outside backdrop layer: clicking outside the island turns it off / collapses it */}
      {(isExpanded || (mode !== "still" && !isSetup)) && (
        <div
          id="AuraClickOutsideBackdrop"
          onMouseDown={(e) => {
            if (!isSetup) {
              setMode("still");
              setActiveView("media");
              alertQueue.dismissCurrent();
              window.electronAPI?.setIgnoreMouseEvents?.(true, true);
            }
          }}
          style={{
            position: "fixed",
            top: `${stripHeight}px`,
            left: 0,
            width: "100vw",
            height: `calc(100vh - ${stripHeight}px)`,
            pointerEvents: "auto",
            zIndex: 999980,
            background: "transparent",
          }}
        />
      )}
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
          zIndex: 999995,
        }}
      >
      <motion.div
        id="Island"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onAnimationStart={() => {
          setIsAnimating(true);
          startFrameTracking();
        }}
        onAnimationComplete={() => {
          setIsAnimating(false);
          stopFrameTracking();
        }}
        animate={{
          width: `${snapToPhysicalPixels(width)}px`,
          height: `${snapToPhysicalPixels(height)}px`,
          backgroundColor: "#000000",
          borderBottomLeftRadius: isSetup ? 24 : isDragMouth ? 22 : isExpanded ? 26 : 20,
          borderBottomRightRadius: isSetup ? 24 : isDragMouth ? 22 : isExpanded ? 26 : 20,
          borderTopLeftRadius: isSetup ? 24 : islandSettings.style === "floating" ? (isDragMouth ? 22 : isExpanded ? 26 : 20) : 0,
          borderTopRightRadius: isSetup ? 24 : islandSettings.style === "floating" ? (isDragMouth ? 22 : isExpanded ? 26 : 20) : 0,
          boxShadow: isDragMouth
            ? "0 20px 48px rgba(0, 0, 0, 0.8), 0 0 32px rgba(48, 209, 88, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.3)"
            : isExpanded
              ? "0 28px 64px rgba(0, 0, 0, 0.85), 0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.22)"
              : activeAlert
                ? `0 16px 44px rgba(0, 0, 0, 0.75), 0 0 22px ${activeAlert.accentColor || islandSettings.accentColor || "#0a84ff"}40, inset 0 1px 1px rgba(255, 255, 255, 0.25)`
                : "none",
        }}
        transition={
          (islandSettings.reduceMotion || systemPrefersReducedMotion)
            ? { duration: 0.001 }
            : {
                type: "spring",
                stiffness: 350,
                damping: 28,
                mass: islandSettings.animationSpeed === "gentle" ? 0.9 : islandSettings.animationSpeed === "fast" ? 0.45 : 0.65,
              }
        }
        style={{
          position: "fixed",
          top: (isSetup || islandSettings.style === "floating") ? 10 : 0,
          pointerEvents: "auto",
          overflow: "hidden",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          fontFamily: designTokens.typography.fontFamily,
          WebkitFontSmoothing: "antialiased",
          textRendering: "optimizeLegibility",
          backgroundColor: "#000000",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderTop: (islandSettings.style === "floating" || isSetup) ? "1px solid rgba(255, 255, 255, 0.18)" : "none",
          zIndex: 999998,
          willChange: isAnimating ? "width, height" : undefined,
          transform: "none",
        }}
      >
        {/* Concave upper notch ears merging with display bezel seamlessly */}
        {islandSettings.style !== "floating" && !isSetup && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: 0,
              pointerEvents: "none",
              zIndex: 999999,
            }}
          >
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: -11.5,
                width: 12,
                height: 12,
                pointerEvents: "none",
                shapeRendering: "geometricPrecision",
              }}
              viewBox="0 0 12 12"
            >
              <path d="M 0,0 A 12,12 0 0,1 12,12 V 0 Z" fill="#000000" />
            </svg>

            <svg
              style={{
                position: "absolute",
                top: 0,
                right: -11.5,
                width: 12,
                height: 12,
                pointerEvents: "none",
                shapeRendering: "geometricPrecision",
              }}
              viewBox="0 0 12 12"
            >
              <path d="M 0,0 V 12 A 12,12 0 0,1 12,0 Z" fill="#000000" />
            </svg>
          </div>
        )}

        {/* --- STATE: FIRST RUN SETUP IN THE NOTCH --- */}
        {isSetup && (
          <FirstRunSetup
            settings={islandSettings}
            onUpdateSetting={(k, v) => {
              window.electronAPI?.setSetting?.(k, v);
            }}
            onSceneChange={(dim) => {
              if (dim?.width && dim?.height) {
                setSetupDimensions(dim);
              }
            }}
            onComplete={() => {
              setMode("still");
              window.electronAPI?.setIgnoreMouseEvents?.(true, true);
              setWakeHint(true);
              setTimeout(() => {
                setWakeHint(false);
              }, 4000);
            }}
            onOpenSettings={(sec) => {
              window.electronAPI?.openSettingsWindow?.(sec);
            }}
          />
        )}

        {/* --- STATE 0: DRAG MOUTH (DROP ACTION TILES) --- */}
        {!isSetup && isDragMouth && (
          <DragMouthView onDropItem={handleDropItem} onCancel={() => setMode("still")} />
        )}

        {/* --- STATE 1: SMART ALERT LIVE ACTIVITY (IDLE MORPH) --- */}
        {!isSetup && !isExpanded && !isDragMouth && activeAlert && (
          <SmartAlertView alert={activeAlert} onClick={() => alertQueue.dismissCurrent()} />
        )}

        {/* --- STATE 2: IDLE NOTCH RESTING STATE --- */}
        <AnimatePresence mode="wait">
          {!isSetup && !isExpanded && !isDragMouth && !activeAlert && (
            <motion.div
              key="idle-resting-pill"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: isPlaying ? "space-between" : (islandMode === "reserved" ? "center" : "space-between"),
                padding: isPlaying ? "0 12px" : (islandMode === "reserved" ? "0 8px" : "0 12px"),
                boxSizing: "border-box",
                fontSize: 11.5,
                fontWeight: 600,
                fontFamily: designTokens.typography.fontFamily,
                overflow: "hidden",
              }}
            >
              {wakeHint ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: 6, color: "rgba(255, 255, 255, 0.9)", fontSize: 11, fontWeight: 600 }}>
                  <Sparkles size={12} color="#0a84ff" />
                  <span>Move your mouse here anytime.</span>
                </div>
              ) : isPlaying ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, color: "#30d158" }}>
                    <Music size={12} />
                    <span style={{ fontSize: 10, maxWidth: 55, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {mediaTrack?.title || "Playing"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <span style={{ width: 3, height: 7, background: "#30d158", borderRadius: 1 }} />
                    <span style={{ width: 3, height: 11, background: "#30d158", borderRadius: 1 }} />
                    <span style={{ width: 3, height: 5, background: "#30d158", borderRadius: 1 }} />
                  </div>
                </>
              ) : islandMode === "reserved" || islandSettings.style === "floating" ? (
                islandSettings.mascotEyes ? (
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 4,
                        height: mascotBlink ? 1 : 5,
                        borderRadius: 2,
                        backgroundColor: "#ffffff",
                        transition: "height 0.1s ease",
                      }}
                    />
                    <div
                      style={{
                        width: 4,
                        height: mascotBlink ? 1 : 5,
                        borderRadius: 2,
                        backgroundColor: "#ffffff",
                        transition: "height 0.1s ease",
                      }}
                    />
                  </div>
                ) : (
                  /* Minimal notch sensor pill in reserved mode: NO duplicate clock, NO duplicate battery */
                  <div
                    style={{
                      width: 22,
                      height: 3.5,
                      borderRadius: 2,
                      backgroundColor: "rgba(255, 255, 255, 0.16)",
                      boxShadow: "0 0 1px rgba(255, 255, 255, 0.2)",
                    }}
                  />
                )
              ) : (
                /* Overlay mode: show clock on left and battery on right */
                <>
                  <span style={{ letterSpacing: "-0.2px" }}>{currentTime}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, opacity: 0.8 }}>
                      {batteryInfo.charging ? (
                        <Zap size={12} color="#30d158" />
                      ) : (
                        <Battery size={12} color={batteryInfo.percent <= 20 ? "#ff453a" : "#ffffff"} />
                      )}
                      <span style={{ fontSize: 10.5 }}>{batteryInfo.percent}%</span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- STATE 3: EXPANDED DASHBOARD --- */}
        <AnimatePresence mode="wait">
          {!isSetup && isExpanded && !isDragMouth && (
            <motion.div
              key="expanded-dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{
                opacity: { duration: 0.12, ease: "easeOut", delay: (islandSettings.reduceMotion || systemPrefersReducedMotion) ? 0 : 0.06 },
                scale: { duration: 0.14, ease: "easeOut" },
              }}
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                position: "relative",
                overflow: "hidden",
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
                {activeView !== "media" ? (
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
                {activeView === "shelf" && (
                  <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: "0.2px" }}>
                    • SHELF
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {activeView === "media" && (
                  <button
                    onClick={() => setActiveView("shelf")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 6,
                      color: "#ffffff",
                      fontSize: 10.5,
                      fontWeight: 600,
                      padding: "2px 8px",
                      cursor: "pointer",
                    }}
                    title="Open Shelf Drawer"
                  >
                    <Folder size={11} color="#30d158" />
                    <span>Shelf</span>
                    {shelfCount > 0 && (
                      <span
                        style={{
                          background: "#30d158",
                          color: "#000000",
                          borderRadius: 8,
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "0 4px",
                          minWidth: 12,
                          textAlign: "center",
                        }}
                      >
                        {shelfCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    if (window.electronAPI?.openSettingsWindow) {
                      window.electronAPI.openSettingsWindow("general");
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.65)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 4,
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.65)")}
                  title="Open Settings Window"
                >
                  <Settings size={14} />
                </button>
              </div>
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
                  <ShelfView onClose={() => setActiveView("media")} />
                )}
              </ErrorBoundary>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
    </div>
    </>
  );
}
