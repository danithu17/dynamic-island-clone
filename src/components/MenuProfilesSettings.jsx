import React, { useState, useEffect } from "react";
import { Code, RotateCcw, Check, AlertCircle, Save, Info } from "lucide-react";
import designTokens from "../styles/designTokens";

export default function MenuProfilesSettings() {
  const [profiles, setProfiles] = useState([]);
  const [selectedApp, setSelectedApp] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle"); // "idle" | "saved" | "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  const fetchProfiles = async () => {
    if (window.electronAPI?.getAppMenuProfiles) {
      try {
        const list = await window.electronAPI.getAppMenuProfiles();
        setProfiles(list || []);
        if (list && list.length > 0) {
          const current = selectedApp ? list.find((p) => p.app === selectedApp) : list[0];
          const active = current || list[0];
          setSelectedApp(active.app);
          setJsonText(JSON.stringify(active, null, 2));
        }
      } catch (_) {}
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSelectApp = (appName) => {
    setSelectedApp(appName);
    const found = profiles.find((p) => p.app === appName);
    if (found) {
      setJsonText(JSON.stringify(found, null, 2));
      setSaveStatus("idle");
    }
  };

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.app || !Array.isArray(parsed.processNames) || !Array.isArray(parsed.menus)) {
        throw new Error("Profile must include 'app', 'processNames' (array), and 'menus' (array).");
      }

      if (window.electronAPI?.saveAppMenuProfile) {
        const ok = await window.electronAPI.saveAppMenuProfile(parsed);
        if (ok) {
          setSaveStatus("saved");
          setErrorMessage("");
          await fetchProfiles();
          setTimeout(() => setSaveStatus("idle"), 2500);
          return;
        }
      }
      throw new Error("Failed to save profile.");
    } catch (err) {
      setSaveStatus("error");
      setErrorMessage(err.message || "Invalid JSON syntax.");
    }
  };

  const handleReset = async () => {
    if (window.confirm("Reset all menu profiles to built-in defaults?")) {
      if (window.electronAPI?.resetAppMenuProfiles) {
        await window.electronAPI.resetAppMenuProfiles();
        await fetchProfiles();
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    }
  };

  const handleToggleEnabled = (checked) => {
    setIsEnabled(checked);
    window.electronAPI?.setAppMenuEnabled?.(checked);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        height: "100%",
        fontFamily: designTokens.typography.fontFamily,
      }}
    >
      {/* Header & Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 8,
          borderBottom: `1px solid ${designTokens.colors.separator}`,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
            Per-App Menu Profiles
          </div>
          <div style={{ fontSize: 11, color: designTokens.colors.textMuted }}>
            Mirror macOS-style application menus on the left side of the top bar
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11.5 }}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleToggleEnabled(e.target.checked)}
            style={{ accentColor: designTokens.colors.accentBlue }}
          />
          Enabled
        </label>
      </div>

      {/* Profile Selector & Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <select
          value={selectedApp}
          onChange={(e) => handleSelectApp(e.target.value)}
          style={{
            flex: 1,
            background: "#1c1d22",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 6,
            padding: "5px 8px",
            fontSize: 12,
            outline: "none",
          }}
        >
          {profiles.map((p) => (
            <option key={p.app} value={p.app}>
              {p.app} ({p.processNames.join(", ")})
            </option>
          ))}
        </select>

        <button
          onClick={handleSave}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 10px",
            borderRadius: 6,
            border: "none",
            background: saveStatus === "saved" ? "#30d158" : designTokens.colors.accentBlue,
            color: "#ffffff",
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.15s ease",
          }}
        >
          {saveStatus === "saved" ? <Check size={13} /> : <Save size={13} />}
          {saveStatus === "saved" ? "Saved!" : "Save"}
        </button>

        <button
          onClick={handleReset}
          title="Reset to default profiles"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 8px",
            borderRadius: 6,
            border: "1px solid rgba(255, 255, 255, 0.12)",
            background: "rgba(255, 255, 255, 0.06)",
            color: designTokens.colors.textSecondary,
            fontSize: 11.5,
            cursor: "pointer",
          }}
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>

      {saveStatus === "error" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#ff453a",
            fontSize: 11,
            background: "rgba(255, 69, 58, 0.12)",
            padding: "4px 8px",
            borderRadius: 5,
          }}
        >
          <AlertCircle size={13} />
          {errorMessage}
        </div>
      )}

      {/* JSON Editor Textarea */}
      <textarea
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value);
          if (saveStatus !== "idle") setSaveStatus("idle");
        }}
        spellCheck={false}
        style={{
          flex: 1,
          minHeight: 180,
          background: "#0d0e11",
          color: "#a9b7c6",
          border: "1px solid rgba(255, 255, 255, 0.10)",
          borderRadius: 8,
          padding: "8px 10px",
          fontFamily: 'Consolas, "Fira Code", monospace',
          fontSize: 11,
          lineHeight: "1.45",
          resize: "none",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {/* Documentation Note */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 6,
          padding: "6px 8px",
          borderRadius: 6,
          background: "rgba(255, 255, 255, 0.04)",
          color: designTokens.colors.textMuted,
          fontSize: 10.5,
          lineHeight: "1.35",
        }}
      >
        <Info size={13} style={{ flexShrink: 0, marginTop: 1, opacity: 0.8 }} />
        <span>
          <strong>Format:</strong> <code>&#123; app, processNames: [...], menus: [&#123; label, items: [&#123; label, shortcut, action &#125;] &#125;] &#125;</code>.
          Shortcuts are delivered cleanly with Win32 <code>SendInput</code> without stealing focus from the active app.
        </span>
      </div>
    </div>
  );
}
