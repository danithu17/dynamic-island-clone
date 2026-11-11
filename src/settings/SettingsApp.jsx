import React, { useState, useEffect } from "react";
import designTokens from "../styles/designTokens";

export default function SettingsApp() {
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState({});

  useEffect(() => {
    if (window.electronAPI?.getSettings) {
      window.electronAPI.getSettings().then((s) => {
        if (s) setSettings(s);
      });
    }

    if (window.electronAPI?.onNavigateSection) {
      const unsub = window.electronAPI.onNavigateSection((sec) => {
        if (sec) setActiveSection(sec);
      });
      return () => unsub?.();
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background: designTokens.colors.barBg,
        color: designTokens.colors.textPrimary,
        fontFamily: designTokens.typography.fontFamily,
        boxSizing: "border-box",
      }}
    >
      <div style={{ padding: 24 }}>
        <h2>Aura Island Settings</h2>
        <p>Active section: {activeSection}</p>
      </div>
    </div>
  );
}
