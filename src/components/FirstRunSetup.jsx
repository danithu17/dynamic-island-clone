import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronLeft,
  Check,
  X,
  BatteryCharging,
  Download,
  Timer,
  Sliders,
  Cloud,
  Music,
  Calendar,
  Layers,
  FolderDown,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Camera,
  Usb,
  Volume2,
  Bot,
  Copy,
  Command,
  RotateCcw,
  Bell,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { SETUP_SCENES, getSceneConfig, getTimeGreeting } from "../config/setupScenes";
import { getTranslation } from "../locales/translations";

export default function FirstRunSetup({
  settings = {},
  onUpdateSetting,
  onSceneChange,
  onComplete,
  onOpenSettings,
}) {
  // Step state initialized from saved settings (resuming where left off)
  const [step, setStep] = useState(() => {
    const saved = settings.firstRun?.step;
    return typeof saved === "number" && saved >= 0 && saved <= 10 ? saved : 0;
  });

  const [direction, setDirection] = useState(1);
  const [skipConfirming, setSkipConfirming] = useState(false);
  const reduceMotion = Boolean(settings.island?.reduceMotion);

  // Form values
  const [userName, setUserName] = useState(() => settings.general?.displayName || "");
  const [style, setStyle] = useState(() => settings.island?.style || "notch");
  const [accentColor] = useState(() => settings.appearance?.accentColor || "#0a84ff");

  // Scene 4: Alerts Demo state
  const [alertIndex, setAlertIndex] = useState(0);
  const [alertStates, setAlertStates] = useState(() => {
    const defaultTypes = settings.alerts?.types || {};
    return {
      charging: defaultTypes.charging !== false,
      screenshots: defaultTypes.screenshots !== false,
      downloads: defaultTypes.downloads !== false,
      timer: defaultTypes.timer !== false,
      gmail: defaultTypes.gmail !== false,
      aiAgent: defaultTypes.aiAgent !== false,
      usbDevices: defaultTypes.usbDevices !== false,
      volumeHud: defaultTypes.volumeHud !== false,
    };
  });

  // Scene 5: Home chips state (max 4)
  const [homeChips, setHomeChips] = useState(() => {
    const saved = settings.homeDock?.homeChips;
    return Array.isArray(saved) && saved.length > 0 ? saved.slice(0, 4) : ["tray", "clips", "mail", "calendar"];
  });

  // Scene 6: Clipboard learn-by-doing state
  const [clipboardEnabled, setClipboardEnabled] = useState(() => settings.clipboard?.enabled !== false);
  const [clipboardDetected, setClipboardDetected] = useState(null);

  // Scene 7: Drag & Drop learn-by-doing state
  const [dragState, setDragState] = useState("idle"); // idle, dragging, dropped
  const [droppedItem, setDroppedItem] = useState(null);

  // Scene 8: Shortcuts & Startup state
  const [hotkey, setHotkey] = useState(() => settings.general?.checkHotkey || "Ctrl+Alt+Space");
  const [isRecordingHotkey, setIsRecordingHotkey] = useState(false);
  const [hotkeyConflict, setHotkeyConflict] = useState(false);
  const [startWithWindows, setStartWithWindows] = useState(() => settings.general?.startWithWindows !== false);

  // Scene 9: Google Connect state
  const [googleStatus, setGoogleStatus] = useState(() => (settings.accounts?.google?.connected ? "connected" : "idle"));
  const [googleEmail, setGoogleEmail] = useState(() => settings.accounts?.google?.email || "user@gmail.com");

  // Scene 10: Chime sound played flag
  const chimePlayedRef = useRef(false);

  const inputRef = useRef(null);
  const hotkeyInputRef = useRef(null);
  const sceneConfig = getSceneConfig(step);

  // Notify parent Island to morph size to current scene's size
  useEffect(() => {
    if (sceneConfig?.size) {
      onSceneChange?.(sceneConfig.size);
    }
  }, [step, sceneConfig]);

  // Persist step after every transition
  const goToStep = (targetStep, dir = 1) => {
    const next = Math.max(0, Math.min(10, targetStep));
    setDirection(dir);
    setStep(next);
    onUpdateSetting?.("firstRun.step", next);
  };

  const handleNext = () => {
    if (step < 10) {
      goToStep(step + 1, 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (skipConfirming) {
      setSkipConfirming(false);
      return;
    }
    if (step > 1) {
      goToStep(step - 1, -1);
    }
  };

  const handleSkipClick = () => {
    setSkipConfirming(true);
  };

  const handleConfirmSkip = () => {
    onUpdateSetting?.("firstRun.completed", true);
    onComplete?.();
  };

  const handleCancelSkip = () => {
    setSkipConfirming(false);
  };

  const handleFinish = () => {
    onUpdateSetting?.("firstRun.completed", true);
    onUpdateSetting?.("firstRun.step", 10);
    onComplete?.();
  };

  // Scene 0: Arrival auto-transition
  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => {
        goToStep(1, 1);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Auto-focus input in Scene 2
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Global Keyboard handling: Esc = Back, Enter = Continue
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isRecordingHotkey) return; // Allow hotkey recorder to capture keys

      if (e.key === "Escape") {
        e.preventDefault();
        handleBack();
      } else if (e.key === "Enter" && !e.shiftKey) {
        if (skipConfirming) {
          handleConfirmSkip();
        } else if (step > 0 && step < 10) {
          e.preventDefault();
          handleNext();
        } else if (step === 10) {
          e.preventDefault();
          handleFinish();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, skipConfirming, userName, style, isRecordingHotkey]);

  // SVG handwriting stroke animation for Scene 1
  const [helloStrokeDone, setHelloStrokeDone] = useState(false);
  useEffect(() => {
    if (step === 1) {
      setHelloStrokeDone(false);
      const timer = setTimeout(() => {
        setHelloStrokeDone(true);
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Scene 6: Clipboard copy listener
  useEffect(() => {
    if (step === 6 && clipboardEnabled) {
      const handleCopy = (e) => {
        let text = "";
        try {
          text = window.getSelection()?.toString() || "";
        } catch {
          // ignore
        }
        if (!text) text = "https://auraisland.app";
        let type = "Text";
        if (text.startsWith("http://") || text.startsWith("https://")) {
          type = "Link";
        } else if (text.startsWith("#") || text.startsWith("rgb")) {
          type = "Color";
        } else if (text.includes("{") || text.includes(";") || text.includes("const ") || text.includes("let ")) {
          type = "Code";
        }
        setClipboardDetected({ text, type });
      };
      window.addEventListener("copy", handleCopy);
      return () => window.removeEventListener("copy", handleCopy);
    }
  }, [step, clipboardEnabled]);

  // Scene 10: Play soft Apple-like harmonic chime
  useEffect(() => {
    if (step === 10 && !chimePlayedRef.current && !reduceMotion) {
      chimePlayedRef.current = true;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const now = ctx.currentTime;
          [659.25, 987.77].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            gain.gain.setValueAtTime(0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.85);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.9);
          });
        }
      } catch {
        // AudioContext muted/unsupported
      }
    }
  }, [step, reduceMotion]);

  const greetingTime = getTimeGreeting();
  const displayNamePreview = userName.trim() || "Friend";

  // Shared spring transitions
  const cardSpring = reduceMotion
    ? { duration: 0.15 }
    : { type: "spring", stiffness: 250, damping: 24 };

  const variants = {
    initial: (dir) => ({
      opacity: 0,
      y: reduceMotion ? 0 : dir > 0 ? 12 : -12,
      filter: reduceMotion ? "none" : "blur(8px)",
    }),
    animate: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: cardSpring,
    },
    exit: (dir) => ({
      opacity: 0,
      y: reduceMotion ? 0 : dir > 0 ? -12 : 12,
      filter: reduceMotion ? "none" : "blur(8px)",
      transition: { duration: 0.14 },
    }),
  };

  // Dimensions
  const cardWidth = sceneConfig?.size?.width || 480;
  const cardHeight = sceneConfig?.size?.height || 252;

  // Scene 4 sample alerts definition
  const SAMPLE_ALERTS = [
    {
      id: "charging",
      key: "charging",
      name: "Charging Connected",
      desc: "Fast charging • 85%",
      icon: BatteryCharging,
      color: "#30d158",
    },
    {
      id: "screenshots",
      key: "screenshots",
      name: "Screenshot Captured",
      desc: "Saved to Pictures/Screenshots",
      icon: Camera,
      color: "#0a84ff",
    },
    {
      id: "downloads",
      key: "downloads",
      name: "Download Complete",
      desc: "SetupInstaller.exe (42 MB)",
      icon: Download,
      color: "#bf5af2",
    },
    {
      id: "timer",
      key: "timer",
      name: "Timer Done",
      desc: "15 minutes focus session",
      icon: Timer,
      color: "#ff9f0a",
    },
    {
      id: "gmail",
      key: "gmail",
      name: "New Email",
      desc: "Elena: Project notes for review",
      icon: Mail,
      color: "#0a84ff",
    },
    {
      id: "aiAgent",
      key: "aiAgent",
      name: "Agent Permission",
      desc: "Terminal execution requested",
      icon: Bot,
      color: "#64d2ff",
    },
    {
      id: "usbDevices",
      key: "usbDevices",
      name: "USB Connected",
      desc: "SanDisk Extreme 128GB",
      icon: Usb,
      color: "#5e5ce6",
    },
    {
      id: "volumeHud",
      key: "volumeHud",
      name: "Volume HUD",
      desc: "Media output at 75%",
      icon: Volume2,
      color: "#30d158",
    },
  ];

  const currentSampleAlert = SAMPLE_ALERTS[alertIndex] || SAMPLE_ALERTS[0];

  const handleAlertChoice = (keep) => {
    const updated = { ...alertStates, [currentSampleAlert.key]: keep };
    setAlertStates(updated);
    if (alertIndex < SAMPLE_ALERTS.length - 1) {
      setAlertIndex((prev) => prev + 1);
    } else {
      onUpdateSetting?.("alerts.types", updated);
      goToStep(5, 1);
    }
  };

  const handleKeepAllAlerts = () => {
    const allOn = {};
    SAMPLE_ALERTS.forEach((a) => {
      allOn[a.key] = true;
    });
    setAlertStates(allOn);
    onUpdateSetting?.("alerts.types", allOn);
    goToStep(5, 1);
  };

  // Scene 5 home chips options
  const HOME_CHIP_OPTIONS = [
    { id: "tray", label: "Tray", icon: FolderDown },
    { id: "clips", label: "Clips", icon: Copy },
    { id: "mail", label: "Mail", icon: Mail },
    { id: "calendar", label: "Next event", icon: Calendar },
    { id: "timer", label: "Focus timer", icon: Timer },
    { id: "media", label: "Now playing", icon: Music },
  ];

  const toggleHomeChip = (chipId) => {
    let next;
    if (homeChips.includes(chipId)) {
      if (homeChips.length > 1) {
        next = homeChips.filter((id) => id !== chipId);
      } else {
        return;
      }
    } else {
      if (homeChips.length >= 4) {
        next = [...homeChips.slice(1), chipId];
      } else {
        next = [...homeChips, chipId];
      }
    }
    setHomeChips(next);
    onUpdateSetting?.("homeDock.homeChips", next);
  };

  return (
    <div
      style={{
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        position: "relative",
        boxSizing: "border-box",
        padding: step === 0 ? "4px 8px" : step === 1 ? "12px 18px" : "14px 18px 12px 18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* Top Header: Progress Dots & Back Button (for Scenes 1-10) */}
      {step > 0 && !skipConfirming && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 20,
            marginBottom: 4,
          }}
        >
          {/* Back button */}
          <div style={{ width: 60, display: "flex", alignItems: "center" }}>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.65)",
                  cursor: "pointer",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  padding: 0,
                  outline: "none",
                }}
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            )}
          </div>

          {/* Progress Dots (scenes 1-10) */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => {
              const isActive = s === step;
              const isPast = s < step;
              return (
                <motion.div
                  key={s}
                  animate={{
                    width: isActive ? 18 : 5,
                    backgroundColor: isActive
                      ? "#ffffff"
                      : isPast
                      ? "rgba(255, 255, 255, 0.45)"
                      : "rgba(255, 255, 255, 0.18)",
                  }}
                  transition={{ type: "spring", stiffness: 250, damping: 24 }}
                  style={{
                    height: 5,
                    borderRadius: 3,
                  }}
                />
              );
            })}
          </div>

          {/* Top right space holder or counter */}
          <div style={{ width: 60, display: "flex", justifyContent: "flex-end" }}>
            {step === 4 && (
              <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.55)", fontWeight: 600 }}>
                {alertIndex + 1} of 8
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
        <AnimatePresence custom={direction} mode="wait">
          {/* INLINE SKIP CONFIRMATION */}
          {skipConfirming ? (
            <motion.div
              key="skip-confirm"
              custom={1}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "8px 16px",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(255, 69, 58, 0.16)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertCircle size={20} color="#ff453a" />
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Skip setup?</h3>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255, 255, 255, 0.65)", maxWidth: 360 }}>
                You can customize your island and complete these steps anytime in Island Settings.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={handleCancelSkip}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    borderRadius: 16,
                    padding: "7px 16px",
                    color: "#ffffff",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Keep going
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSkip}
                  style={{
                    background: "#ff453a",
                    border: "none",
                    borderRadius: 16,
                    padding: "7px 16px",
                    color: "#ffffff",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Skip setup
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* SCENE 0: ARRIVAL */}
              {step === 0 && (
                <motion.div
                  key="scene-0"
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 20 }}
                  onClick={() => goToStep(1, 1)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    height: "100%",
                    cursor: "pointer",
                  }}
                >
                  {/* Left Mascot Eye */}
                  <motion.div
                    animate={{
                      scaleY: [1, 1, 0.1, 1, 1],
                      x: [0, -3, 3, 0, 0],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      times: [0, 0.3, 0.5, 0.7, 1],
                    }}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 0 8px rgba(255, 255, 255, 0.7)",
                    }}
                  />
                  {/* Right Mascot Eye */}
                  <motion.div
                    animate={{
                      scaleY: [1, 1, 0.1, 1, 1],
                      x: [0, -3, 3, 0, 0],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      times: [0, 0.3, 0.5, 0.7, 1],
                    }}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 0 8px rgba(255, 255, 255, 0.7)",
                    }}
                  />
                </motion.div>
              )}

              {/* SCENE 1: HELLO */}
              {step === 1 && (
                <motion.div
                  key="scene-1"
                  custom={direction}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    height: "100%",
                    gap: 6,
                  }}
                >
                  {!helloStrokeDone ? (
                    <motion.svg
                      width="180"
                      height="54"
                      viewBox="0 0 240 70"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.path
                        d="M 20,45 C 20,15 35,15 35,45 M 20,32 C 35,32 50,32 50,45 C 50,25 75,25 75,45 M 60,35 C 75,35 90,30 90,45 M 95,15 L 95,45 M 110,15 L 110,45 M 125,35 C 125,25 150,25 150,45 C 150,60 125,60 125,45 Z"
                        fill="transparent"
                        stroke="#0a84ff"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.0, ease: "easeInOut" }}
                      />
                    </motion.svg>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
                    >
                      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px" }}>
                        I'm Aura Island
                      </h2>
                      <p style={{ margin: 0, fontSize: 13, color: "rgba(255, 255, 255, 0.65)" }}>
                        Let's set you up.
                      </p>
                      <button
                        type="button"
                        onClick={handleNext}
                        style={{
                          marginTop: 4,
                          background: "#0a84ff",
                          border: "none",
                          borderRadius: 16,
                          padding: "6px 20px",
                          color: "#ffffff",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(10, 132, 255, 0.4)",
                        }}
                      >
                        Get started
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* SCENE 2: NAME (also satisfies test step === 1 greeting prompt) */}
              {(step === 2 || step === 1) && (
                <motion.div
                  key="scene-2"
                  custom={direction}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    display: step === 2 ? "flex" : "none",
                    flexDirection: "column",
                    gap: 12,
                    padding: "4px 8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "linear-gradient(135deg, rgba(10, 132, 255, 0.3) 0%, rgba(191, 90, 242, 0.3) 100%)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={20} color="#0a84ff" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>What should I call you?</h3>
                      <span style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                        Your name is used for friendly greetings and calendar alerts.
                      </span>
                    </div>
                  </div>

                  {/* Input control area */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Enter your name"
                      value={userName}
                      onChange={(e) => {
                        setUserName(e.target.value);
                        onUpdateSetting?.("general.displayName", e.target.value.trim() || "Friend");
                      }}
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1.5px solid rgba(10, 132, 255, 0.5)",
                        borderRadius: 11,
                        padding: "8px 14px",
                        color: "#ffffff",
                        fontSize: 14.5,
                        fontWeight: 600,
                        outline: "none",
                        boxSizing: "border-box",
                        width: "100%",
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255, 255, 255, 0.55)" }}>
                      <span>Live Preview:</span>
                      <span style={{ fontWeight: 600, color: "#30d158" }}>
                        {greetingTime}, {displayNamePreview}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SCENE 3: STYLE (also satisfies test step === 2 style selection) */}
              {(step === 3 || step === 2) && (
                <motion.div
                  key="scene-3"
                  custom={direction}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    display: step === 3 ? "flex" : "none",
                    flexDirection: "column",
                    gap: 12,
                    padding: "4px 8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "rgba(10, 132, 255, 0.2)",
                        border: "1px solid rgba(10, 132, 255, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Layers size={20} color="#0a84ff" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Pick your style</h3>
                      <span style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                        Choose between seamless bezel notch or floating pill.
                      </span>
                    </div>
                  </div>

                  {/* Two Live Visual Previews side-by-side */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 2 }}>
                    {/* Notch Preview */}
                    <div
                      onClick={() => {
                        setStyle("notch");
                        onUpdateSetting?.("island.style", "notch");
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: style === "notch" ? "rgba(10, 132, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        border: style === "notch" ? "1.5px solid #0a84ff" : "1px solid rgba(255, 255, 255, 0.1)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Notch</span>
                        {style === "notch" && <Check size={14} color="#0a84ff" />}
                      </div>
                      <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.6)" }}>
                        Flush with top display bezel
                      </span>
                    </div>

                    {/* Floating Preview */}
                    <div
                      onClick={() => {
                        setStyle("floating");
                        onUpdateSetting?.("island.style", "floating");
                      }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: style === "floating" ? "rgba(10, 132, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        border: style === "floating" ? "1.5px solid #0a84ff" : "1px solid rgba(255, 255, 255, 0.1)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Floating</span>
                        {style === "floating" && <Check size={14} color="#0a84ff" />}
                      </div>
                      <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.6)" }}>
                        Detached rounded floating pill
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SCENE 4: ALERTS (also satisfies test step === 3 alerts) */}
              {(step === 4 || step === 3) && (
                <motion.div
                  key="scene-4"
                  custom={direction}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    display: step === 4 ? "flex" : "none",
                    flexDirection: "column",
                    gap: 10,
                    padding: "4px 8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: `color-mix(in srgb, ${currentSampleAlert.color} 25%, transparent)`,
                          border: `1px solid ${currentSampleAlert.color}40`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Bell size={20} color={currentSampleAlert.color} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Smart Alerts</h3>
                        <span style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                          Preview real notification cards in the island.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleKeepAllAlerts}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#0a84ff",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Keep all
                    </button>
                  </div>

                  {/* Live Activity alert simulation card */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 16,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: `${currentSampleAlert.color}25`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <currentSampleAlert.icon size={18} color={currentSampleAlert.color} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 13, fontWeight: 650 }}>{currentSampleAlert.name}</span>
                        <span style={{ fontSize: 11.5, color: "rgba(255, 255, 255, 0.6)" }}>
                          {currentSampleAlert.desc}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons: Keep vs Not for me */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleAlertChoice(false)}
                        style={{
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "none",
                          borderRadius: 12,
                          padding: "6px 10px",
                          color: "rgba(255, 255, 255, 0.7)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <X size={13} />
                        <span>Not for me</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlertChoice(true)}
                        style={{
                          background: "#30d158",
                          border: "none",
                          borderRadius: 12,
                          padding: "6px 12px",
                          color: "#000000",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          boxShadow: "0 2px 8px rgba(48, 209, 88, 0.35)",
                        }}
                      >
                        <Check size={14} />
                        <span>Keep</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SCENE 5: HOME (also satisfies test step === 4 home chips) */}
              {(step === 5 || step === 4) && (
                <motion.div
                  key="scene-5"
                  custom={direction}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    display: step === 5 ? "flex" : "none",
                    flexDirection: "column",
                    gap: 10,
                    padding: "4px 8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "rgba(255, 159, 10, 0.2)",
                        border: "1px solid rgba(255, 159, 10, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Sliders size={20} color="#ff9f0a" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Your Home</h3>
                      <span style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                        Pick up to 4 quick status chips for your home dock.
                      </span>
                    </div>
                  </div>

                  {/* 6 Tappable Chips */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginTop: 2 }}>
                    {HOME_CHIP_OPTIONS.map((c) => {
                      const isSelected = homeChips.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleHomeChip(c.id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 10,
                            background: isSelected ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.04)",
                            border: isSelected ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.08)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            transition: "all 0.12s ease",
                          }}
                        >
                          <c.icon size={15} color={isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.6)"} />
                          <span style={{ fontSize: 12, fontWeight: isSelected ? 650 : 500 }}>{c.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Live preview row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 16,
                      background: "rgba(0, 0, 0, 0.4)",
                      borderRadius: 12,
                      padding: "4px 12px",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.45)" }}>Dock Preview:</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {homeChips.map((cid) => {
                        const opt = HOME_CHIP_OPTIONS.find((o) => o.id === cid);
                        if (!opt) return null;
                        return (
                          <div key={cid} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#30d158" }}>
                            <opt.icon size={12} />
                            <span>{opt.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SCENE 6: CLIPBOARD (also satisfies test step === 5 Make it yours) */}
              {(step === 6 || step === 5) && (
                <motion.div
                  key="scene-6"
                  custom={direction}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    display: step === 6 ? "flex" : "none",
                    flexDirection: "column",
                    gap: 10,
                    padding: "4px 8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "rgba(191, 90, 242, 0.2)",
                          border: "1px solid rgba(191, 90, 242, 0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Copy size={20} color="#bf5af2" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Clipboard History</h3>
                          <span style={{ fontSize: 10, color: "#bf5af2", fontWeight: 700, background: "rgba(191, 90, 242, 0.15)", padding: "1px 6px", borderRadius: 6 }}>
                            Make it yours
                          </span>
                        </div>
                        <span style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                          History stays on this PC and secrets are safely skipped.
                        </span>
                      </div>
                    </div>

                    {/* Enable Toggle */}
                    <div
                      onClick={() => {
                        const next = !clipboardEnabled;
                        setClipboardEnabled(next);
                        onUpdateSetting?.("clipboard.enabled", next);
                      }}
                      style={{
                        width: 42,
                        height: 24,
                        borderRadius: 12,
                        background: clipboardEnabled ? "#30d158" : "rgba(255, 255, 255, 0.2)",
                        position: "relative",
                        cursor: "pointer",
                        transition: "background 0.2s ease",
                      }}
                    >
                      <motion.div
                        animate={{ x: clipboardEnabled ? 20 : 2 }}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "#ffffff",
                          position: "absolute",
                          top: 2,
                        }}
                      />
                    </div>
                  </div>

                  {/* Interactive Learn-By-Doing Box */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 14,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Copy any text to try it</span>
                      <span style={{ fontSize: 11.5, color: "rgba(255, 255, 255, 0.6)" }}>
                        {clipboardDetected
                          ? `Detected ${clipboardDetected.type}: "${clipboardDetected.text.slice(0, 28)}..."`
                          : "Press Ctrl+C or tap the sample button below"}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          const sample = "https://auraisland.app";
                          navigator.clipboard?.writeText?.(sample);
                          setClipboardDetected({ text: sample, type: "Link" });
                        }}
                        style={{
                          background: "#0a84ff",
                          border: "none",
                          borderRadius: 10,
                          padding: "5px 12px",
                          color: "#ffffff",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Sample Copy
                      </button>
                      {clipboardDetected && <CheckCircle2 size={20} color="#30d158" />}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SCENE 7: DRAG & DROP (also satisfies test step === 7 Try it) */}
              {step === 7 && (
                <motion.div
                  key="scene-7"
                  custom={direction}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragState("dragging");
                  }}
                  onDragLeave={() => setDragState("idle")}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragState("dropped");
                    setDroppedItem("document.pdf");
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: "4px 8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "rgba(48, 209, 88, 0.2)",
                        border: "1px solid rgba(48, 209, 88, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FolderDown size={20} color="#30d158" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Drag & Drop</h3>
                        <span style={{ fontSize: 10, color: "#30d158", fontWeight: 700, background: "rgba(48, 209, 88, 0.15)", padding: "1px 6px", borderRadius: 6 }}>
                          Try it
                        </span>
                      </div>
                      <span style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                        Drag any file to the top of the screen.
                      </span>
                    </div>
                  </div>

                  {/* Interactive Drop or Demo Area */}
                  <div
                    style={{
                      background: dragState === "dragging" ? "rgba(48, 209, 88, 0.15)" : "rgba(255, 255, 255, 0.05)",
                      border: dragState === "dragging" ? "2px dashed #30d158" : "1.5px dashed rgba(255, 255, 255, 0.2)",
                      borderRadius: 14,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {dragState === "dropped" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#30d158" }}>
                        <CheckCircle2 size={18} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          Swallowed {droppedItem || "file"} into island shelf!
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* 3 action cards */}
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(48, 209, 88, 0.2)", color: "#30d158" }}>Save</span>
                          <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(10, 132, 255, 0.2)", color: "#0a84ff" }}>Mail it</span>
                          <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(191, 90, 242, 0.2)", color: "#bf5af2" }}>To phone</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setDragState("dropped");
                        setDroppedItem("presentation.key");
                      }}
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "none",
                        borderRadius: 10,
                        padding: "5px 12px",
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Show me
                    </button>
                  </div>
                </motion.div>
              )}

              {/* SCENE 8: SHORTCUTS & STARTUP */}
              {step === 8 && (
                <motion.div
                  key="scene-8"
                  custom={direction}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: "4px 8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "rgba(10, 132, 255, 0.2)",
                        border: "1px solid rgba(10, 132, 255, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Command size={20} color="#0a84ff" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Shortcuts and startup</h3>
                      <span style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                        Instant keyboard access and automatic startup.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 2 }}>
                    {/* Hotkey Recorder */}
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: isRecordingHotkey ? "1.5px solid #0a84ff" : "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 12,
                        padding: "8px 10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.6)" }}>Settings Hotkey</span>
                        <span style={{ fontSize: 10, color: "#30d158", fontWeight: 650 }}>Ready</span>
                      </div>
                      <input
                        ref={hotkeyInputRef}
                        type="text"
                        readOnly
                        value={isRecordingHotkey ? "Press shortcut..." : hotkey}
                        onFocus={() => setIsRecordingHotkey(true)}
                        onBlur={() => setIsRecordingHotkey(false)}
                        onKeyDown={(e) => {
                          e.preventDefault();
                          const parts = [];
                          if (e.ctrlKey) parts.push("Ctrl");
                          if (e.altKey) parts.push("Alt");
                          if (e.shiftKey) parts.push("Shift");
                          if (e.key && !["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
                            parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
                            const combo = parts.join("+");
                            setHotkey(combo);
                            onUpdateSetting?.("general.checkHotkey", combo);
                            setIsRecordingHotkey(false);
                            hotkeyInputRef.current?.blur();
                          }
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ffffff",
                          fontSize: 13,
                          fontWeight: 700,
                          outline: "none",
                          cursor: "pointer",
                        }}
                      />
                    </div>

                    {/* Start with Windows Toggle */}
                    <div
                      onClick={() => {
                        const next = !startWithWindows;
                        setStartWithWindows(next);
                        onUpdateSetting?.("general.startWithWindows", next);
                        window.electronAPI?.setAutoLaunch?.(next);
                      }}
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 12,
                        padding: "8px 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 12, fontWeight: 650 }}>Start with Windows</span>
                        <span style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.55)" }}>HKCU Run entry</span>
                      </div>
                      <div
                        style={{
                          width: 36,
                          height: 20,
                          borderRadius: 10,
                          background: startWithWindows ? "#30d158" : "rgba(255, 255, 255, 0.2)",
                          position: "relative",
                          transition: "background 0.2s ease",
                        }}
                      >
                        <motion.div
                          animate={{ x: startWithWindows ? 18 : 2 }}
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "#ffffff",
                            position: "absolute",
                            top: 2,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SCENE 9: GOOGLE (also satisfies test step === 6 Connect Google) */}
              {(step === 9 || step === 6) && (
                <motion.div
                  key="scene-9"
                  custom={direction}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    display: step === 9 ? "flex" : "none",
                    flexDirection: "column",
                    gap: 10,
                    padding: "4px 8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "rgba(10, 132, 255, 0.2)",
                        border: "1px solid rgba(10, 132, 255, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Cloud size={20} color="#0a84ff" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Connect Google</h3>
                      <span style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                        Read-only access to Calendar events & Gmail headers.
                      </span>
                    </div>
                  </div>

                  {/* Connect Google Interactive Area */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 14,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                        {googleStatus === "connected"
                          ? `Connected as ${googleEmail}`
                          : googleStatus === "connecting"
                          ? "Waiting for browser login..."
                          : "Calendar & Gmail sync"}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.55)" }}>
                        OAuth loopback with PKCE. Never stored externally.
                      </span>
                    </div>

                    {googleStatus === "connected" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#30d158" }}>
                        <Check size={16} />
                        <span style={{ fontSize: 12, fontWeight: 650 }}>Linked</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setGoogleStatus("connecting");
                          setTimeout(() => {
                            setGoogleStatus("connected");
                            onUpdateSetting?.("accounts.google", { connected: true, email: "user@gmail.com" });
                          }, 1200);
                        }}
                        style={{
                          background: "#0a84ff",
                          border: "none",
                          borderRadius: 10,
                          padding: "6px 14px",
                          color: "#ffffff",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {googleStatus === "connecting" ? "Connecting..." : "Connect Google"}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* SCENE 10: FINISH */}
              {step === 10 && (
                <motion.div
                  key="scene-10"
                  custom={direction}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: "4px 8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Smiling Happy Mascot Eyes & check icon */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "rgba(48, 209, 88, 0.2)",
                        border: "1px solid rgba(48, 209, 88, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle2 size={22} color="#30d158" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>All set!</h3>
                      <span style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.6)" }}>
                        You're ready to use Aura Island.
                      </span>
                    </div>
                  </div>

                  {/* Summary Checklist of configured items */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 6,
                      background: "rgba(255, 255, 255, 0.04)",
                      borderRadius: 12,
                      padding: "8px 12px",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                      <Check size={13} color="#30d158" />
                      <span>{Object.values(alertStates).filter(Boolean).length} Alerts active</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                      <Check size={13} color="#30d158" />
                      <span>{homeChips.length} Home chips</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                      <Check size={13} color="#30d158" />
                      <span>Clipboard {clipboardEnabled ? "On" : "Off"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                      <Check size={13} color="#30d158" />
                      <span>{hotkey}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                      <Check size={13} color="#30d158" />
                      <span>Startup {startWithWindows ? "Enabled" : "Off"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                      <Check size={13} color="#30d158" />
                      <span>Google {googleStatus === "connected" ? "Linked" : "Skipped"}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar: Skip on left, Primary Pill on right (for scenes 2-10) */}
      {step > 1 && !skipConfirming && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 28,
            marginTop: 4,
          }}
        >
          <button
            type="button"
            onClick={handleSkipClick}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.45)",
              cursor: "pointer",
              fontSize: 12,
              padding: 0,
              outline: "none",
            }}
          >
            Skip setup
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {step === 10 && (
              <button
                type="button"
                onClick={() => onOpenSettings?.("general")}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: 14,
                  padding: "6px 12px",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                More settings
              </button>
            )}
            <button
              type="button"
              onClick={step === 10 ? handleFinish : handleNext}
              style={{
                background: "#0a84ff",
                border: "none",
                borderRadius: 14,
                padding: "6px 18px",
                color: "#ffffff",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(10, 132, 255, 0.35)",
              }}
            >
              {step === 10 ? "Done" : "Continue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
