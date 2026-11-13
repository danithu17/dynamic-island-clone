import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronLeft,
  X,
  Check,
  BatteryCharging,
  Download,
  Timer,
  Sliders,
  Cloud,
  Music,
  Calendar,
  Activity,
  Layers,
  Power,
  ShieldCheck,
  Eye,
  FolderDown,
  Mail,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

export default function FirstRunSetup({
  settings = {},
  onUpdateSetting,
  onComplete,
  onOpenSettings,
}) {
  const [step, setStep] = useState(() => settings.firstRun?.step || 1);
  const [userName, setUserName] = useState(() => settings.general?.displayName || "");
  const [style, setStyle] = useState(() => settings.island?.style || "notch");
  const [alerts, setAlerts] = useState({
    battery: true,
    downloads: true,
    timer: true,
    volumeHud: true,
  });
  const [selectedChips, setSelectedChips] = useState(() => settings.homeDock?.homeChips || ["weather", "media", "calendar", "battery"]);
  const [accentColor, setAccentColor] = useState(() => settings.appearance?.accentColor || "#0a84ff");
  const [mascotEyes, setMascotEyes] = useState(() => settings.island?.mascotEyes !== false);
  const [startWithWindows, setStartWithWindows] = useState(() => Boolean(settings.general?.startWithWindows));
  const [clipboardHistory, setClipboardHistory] = useState(() => settings.clipboard?.enabled !== false);
  const [hotkey, setHotkey] = useState("Ctrl+Shift+Space");
  const [tryItSwallowed, setTryItSwallowed] = useState(false);

  // Sync step changes to persistence so restarting resumes where user left off
  const goToStep = (s) => {
    const nextStep = Math.max(1, Math.min(7, s));
    setStep(nextStep);
    onUpdateSetting?.("firstRun.step", nextStep);
  };

  const handleSkip = () => {
    onUpdateSetting?.("firstRun.completed", true);
    onComplete?.();
  };

  const handleFinish = () => {
    onUpdateSetting?.("firstRun.completed", true);
    onUpdateSetting?.("firstRun.step", 7);
    onComplete?.();
  };

  const availableChips = [
    { id: "weather", label: "Weather", icon: <Cloud size={14} /> },
    { id: "media", label: "Now Playing", icon: <Music size={14} /> },
    { id: "calendar", label: "Calendar", icon: <Calendar size={14} /> },
    { id: "battery", label: "Battery", icon: <BatteryCharging size={14} /> },
    { id: "stats", label: "System Stats", icon: <Activity size={14} /> },
    { id: "timer", label: "Timer", icon: <Timer size={14} /> },
  ];

  const colors = ["#0a84ff", "#30d158", "#ff9f0a", "#ff375f", "#bf5af2", "#64d2ff"];

  const toggleChip = (id) => {
    if (selectedChips.includes(id)) {
      if (selectedChips.length > 1) {
        const next = selectedChips.filter((c) => c !== id);
        setSelectedChips(next);
        onUpdateSetting?.("homeDock.homeChips", next);
      }
    } else {
      if (selectedChips.length < 4) {
        const next = [...selectedChips, id];
        setSelectedChips(next);
        onUpdateSetting?.("homeDock.homeChips", next);
      }
    }
  };

  return (
    <div
      style={{
        width: 480,
        height: 252,
        padding: "16px 22px 14px 22px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#ffffff",
        position: "relative",
      }}
    >
      {/* Top Navigation Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 24 }}>
        {step > 1 && step < 7 ? (
          <button
            type="button"
            onClick={() => goToStep(step - 1)}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.65)",
              cursor: "pointer",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: 0,
            }}
          >
            <ChevronLeft size={14} />
            <span>Back</span>
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.6, fontSize: 11, fontWeight: 600 }}>
            <Sparkles size={13} color="#0a84ff" />
            <span>Welcome to Aura Island</span>
          </div>
        )}

        {/* Step indicator dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div
              key={s}
              style={{
                width: s === step ? 14 : 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: s === step ? accentColor : "rgba(255, 255, 255, 0.2)",
                transition: "all 0.2s ease",
              }}
            />
          ))}
        </div>

        {step < 7 && (
          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.45)",
              cursor: "pointer",
              fontSize: 11.5,
              padding: 0,
            }}
          >
            Skip setup
          </button>
        )}
      </div>

      {/* Screen Content Carousel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 0, margin: "6px 0" }}>
        <AnimatePresence mode="wait">
          {/* SCREEN 1: Name & Greeting */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, filter: "blur(6px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(6px)", y: -10 }}
              transition={{ duration: 0.24 }}
              style={{ textAlign: "center" }}
            >
              <div style={{ fontSize: 26, marginBottom: 4 }}>👋</div>
              <h2 style={{ margin: "0 0 6px 0", fontSize: 19, fontWeight: 700 }}>
                What should I call you?
              </h2>
              <p style={{ margin: "0 0 14px 0", fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
                Aura Island greets you and personalizes your notifications.
              </p>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    onUpdateSetting?.("general.displayName", e.target.value || "User");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goToStep(2);
                  }}
                  style={{
                    width: 240,
                    textAlign: "center",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: `1.5px solid ${accentColor}`,
                    borderRadius: 10,
                    padding: "8px 14px",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 600,
                    outline: "none",
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: Style Pick (Notch vs Floating) */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, filter: "blur(6px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(6px)", y: -10 }}
              transition={{ duration: 0.24 }}
              style={{ textAlign: "center" }}
            >
              <h2 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 700 }}>
                Pick your style
              </h2>
              <p style={{ margin: "0 0 12px 0", fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
                Watch the island above transform in real time.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
                {/* Notch Option */}
                <button
                  type="button"
                  onClick={() => {
                    setStyle("notch");
                    onUpdateSetting?.("island.style", "notch");
                  }}
                  style={{
                    width: 140,
                    padding: "12px 10px",
                    borderRadius: 12,
                    background: style === "notch" ? "rgba(10, 132, 255, 0.2)" : "rgba(255, 255, 255, 0.06)",
                    border: style === "notch" ? "1.5px solid #0a84ff" : "1px solid rgba(255, 255, 255, 0.1)",
                    cursor: "pointer",
                    color: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 14,
                      background: "#000000",
                      borderRadius: "0 0 6px 6px",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Notch</div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                      Bezel-integrated
                    </div>
                  </div>
                </button>

                {/* Floating Option */}
                <button
                  type="button"
                  onClick={() => {
                    setStyle("floating");
                    onUpdateSetting?.("island.style", "floating");
                  }}
                  style={{
                    width: 140,
                    padding: "12px 10px",
                    borderRadius: 12,
                    background: style === "floating" ? "rgba(10, 132, 255, 0.2)" : "rgba(255, 255, 255, 0.06)",
                    border: style === "floating" ? "1.5px solid #0a84ff" : "1px solid rgba(255, 255, 255, 0.1)",
                    cursor: "pointer",
                    color: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 14,
                      background: "#000000",
                      borderRadius: 7,
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Floating</div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                      Detached capsule
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* SCREEN 3: Alerts toggles */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, filter: "blur(6px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(6px)", y: -10 }}
              transition={{ duration: 0.24 }}
            >
              <h2 style={{ margin: "0 0 2px 0", fontSize: 17, fontWeight: 700, textAlign: "center" }}>
                Smart Alerts
              </h2>
              <p style={{ margin: "0 0 10px 0", fontSize: 11.5, color: "rgba(255, 255, 255, 0.6)", textAlign: "center" }}>
                Select notification events to expand into live activities.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 10px" }}>
                {[
                  { key: "battery", label: "Power & Battery", icon: <BatteryCharging size={14} color="#30d158" /> },
                  { key: "downloads", label: "Downloads Done", icon: <Download size={14} color="#0a84ff" /> },
                  { key: "timer", label: "Focus Timer", icon: <Timer size={14} color="#ff9f0a" /> },
                  { key: "volumeHud", label: "Volume Indicator", icon: <Sliders size={14} color="#bf5af2" /> },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      const next = !alerts[item.key];
                      setAlerts((prev) => ({ ...prev, [item.key]: next }));
                      onUpdateSetting?.(`alerts.types.${item.key}.enabled`, next);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: alerts[item.key] ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      cursor: "pointer",
                      color: "#ffffff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {item.icon}
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{item.label}</span>
                    </div>
                    {alerts[item.key] && <Check size={13} color="#30d158" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* SCREEN 4: Your Home Chips */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, filter: "blur(6px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(6px)", y: -10 }}
              transition={{ duration: 0.24 }}
            >
              <h2 style={{ margin: "0 0 2px 0", fontSize: 17, fontWeight: 700, textAlign: "center" }}>
                Your Home
              </h2>
              <p style={{ margin: "0 0 10px 0", fontSize: 11.5, color: "rgba(255, 255, 255, 0.6)", textAlign: "center" }}>
                Choose up to 4 quick chips for your top status bar.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0 10px" }}>
                {availableChips.map((chip) => {
                  const isSelected = selectedChips.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => toggleChip(chip.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: isSelected ? "rgba(10, 132, 255, 0.22)" : "rgba(255, 255, 255, 0.05)",
                        border: isSelected ? "1px solid #0a84ff" : "1px solid rgba(255, 255, 255, 0.1)",
                        color: "#ffffff",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: isSelected ? 600 : 500,
                      }}
                    >
                      {chip.icon}
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* SCREEN 5: Make it yours */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, filter: "blur(6px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(6px)", y: -10 }}
              transition={{ duration: 0.24 }}
            >
              <h2 style={{ margin: "0 0 2px 0", fontSize: 17, fontWeight: 700, textAlign: "center" }}>
                Make it yours
              </h2>
              <p style={{ margin: "0 0 10px 0", fontSize: 11.5, color: "rgba(255, 255, 255, 0.6)", textAlign: "center" }}>
                Accent color, mascot eyes, and desktop privacy.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 14px" }}>
                {/* Accent Colors */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Accent Color:</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setAccentColor(c);
                          onUpdateSetting?.("appearance.accentColor", c);
                        }}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          backgroundColor: c,
                          border: accentColor === c ? "2px solid #ffffff" : "none",
                          boxShadow: accentColor === c ? `0 0 8px ${c}` : "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Mascot Eyes */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Mascot Eyes Animation:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !mascotEyes;
                      setMascotEyes(next);
                      onUpdateSetting?.("island.mascotEyes", next);
                    }}
                    style={{
                      background: mascotEyes ? accentColor : "rgba(255, 255, 255, 0.18)",
                      border: "none",
                      borderRadius: 12,
                      width: 40,
                      height: 22,
                      cursor: "pointer",
                      position: "relative",
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        backgroundColor: "#ffffff",
                        position: "absolute",
                        top: 2,
                        left: mascotEyes ? 20 : 2,
                        transition: "left 0.2s ease",
                      }}
                    />
                  </button>
                </div>

                {/* Clipboard History statement */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>Clipboard Ring Buffer</div>
                    <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.5)" }}>
                      Passkeys skipped; 100% stays on this PC.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !clipboardHistory;
                      setClipboardHistory(next);
                      onUpdateSetting?.("clipboard.enabled", next);
                    }}
                    style={{
                      background: clipboardHistory ? accentColor : "rgba(255, 255, 255, 0.18)",
                      border: "none",
                      borderRadius: 12,
                      width: 40,
                      height: 22,
                      cursor: "pointer",
                      position: "relative",
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        backgroundColor: "#ffffff",
                        position: "absolute",
                        top: 2,
                        left: clipboardHistory ? 20 : 2,
                        transition: "left 0.2s ease",
                      }}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 6: Connect Google */}
          {step === 6 && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, filter: "blur(6px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(6px)", y: -10 }}
              transition={{ duration: 0.24 }}
              style={{ textAlign: "center" }}
            >
              <h2 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 700 }}>
                Connect Google
              </h2>
              <p style={{ margin: "0 0 12px 0", fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
                Get real-time meeting reminders and incoming Gmail count.
              </p>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 10,
                  padding: "10px 16px",
                  display: "inline-block",
                  marginBottom: 12,
                  textAlign: "left",
                  fontSize: 11.5,
                  color: "rgba(255, 255, 255, 0.75)",
                  lineHeight: 1.45,
                }}
              >
                <div>• Gmail read & draft creation</div>
                <div>• Google Calendar events overview</div>
                <div>• Zero external server relay; direct token storage</div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 7: Try it (Drag & Drop Mouth Swallow) */}
          {step === 7 && (
            <motion.div
              key="step-7"
              initial={{ opacity: 0, filter: "blur(6px)", y: 10 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(6px)", y: -10 }}
              transition={{ duration: 0.24 }}
              style={{ textAlign: "center" }}
            >
              {!tryItSwallowed ? (
                <>
                  <div style={{ fontSize: 24, marginBottom: 2 }}>📥</div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 700 }}>
                    Try it: Drop files into the island
                  </h2>
                  <p style={{ margin: "0 0 10px 0", fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>
                    Drag any file to the top of your screen to save to Shelf, Mail, or Phone.
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setTryItSwallowed(true)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 10,
                        background: "rgba(48, 209, 88, 0.18)",
                        border: "1px solid rgba(48, 209, 88, 0.4)",
                        color: "#30d158",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <FolderDown size={14} />
                      <span>Simulate File Drop</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 2 }}>🎉</div>
                  <h2 style={{ margin: "0 0 4px 0", fontSize: 19, fontWeight: 700, color: "#30d158" }}>
                    You're all set!
                  </h2>
                  <p style={{ margin: "0 0 12px 0", fontSize: 12, color: "rgba(255, 255, 255, 0.7)" }}>
                    Aura Island is running and ready. Hover the notch anytime to explore.
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Button Action Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
        <div />
        {step < 6 ? (
          <button
            type="button"
            onClick={() => goToStep(step + 1)}
            style={{
              padding: "7px 22px",
              borderRadius: 20,
              backgroundColor: accentColor,
              color: "#ffffff",
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: `0 4px 14px ${accentColor}44`,
            }}
          >
            Continue
          </button>
        ) : step === 6 ? (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => goToStep(7)}
              style={{
                padding: "6px 14px",
                borderRadius: 18,
                background: "rgba(255, 255, 255, 0.08)",
                color: "rgba(255, 255, 255, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={() => goToStep(7)}
              style={{
                padding: "6px 18px",
                borderRadius: 18,
                backgroundColor: accentColor,
                color: "#ffffff",
                border: "none",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Connect
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => onOpenSettings?.("general")}
              style={{
                padding: "6px 14px",
                borderRadius: 18,
                background: "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              More settings
            </button>
            <button
              type="button"
              onClick={handleFinish}
              style={{
                padding: "6px 20px",
                borderRadius: 18,
                backgroundColor: "#30d158",
                color: "#000000",
                border: "none",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Start Using
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
