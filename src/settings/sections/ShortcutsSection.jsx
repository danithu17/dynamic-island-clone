import React, { useState } from "react";
import { SettingsCard, SettingsRow, SettingsButton } from "../components/SettingsUI";
import { Keyboard, AlertCircle, Check } from "lucide-react";

export default function ShortcutsSection({ settings, onUpdate }) {
  const sc = settings.shortcuts || {};
  const [editingKey, setEditingKey] = useState(null);
  const [tempValue, setTempValue] = useState("");

  const hotkeys = [
    { id: "openSettings", label: "Open Settings Window", defaultVal: "Ctrl+," },
    { id: "firstMenu", label: "Focus First Menu in Bar", defaultVal: "Alt+F" },
    { id: "toggleIsland", label: "Show/Hide Island & Menu Bar", defaultVal: "Ctrl+Shift+Space" },
  ];

  // Conflict detection
  const assignedValues = Object.entries(sc);
  const conflicts = new Set();
  const seen = new Map();
  for (const [k, v] of assignedValues) {
    if (v) {
      if (seen.has(v)) {
        conflicts.add(k);
        conflicts.add(seen.get(v));
      } else {
        seen.set(v, k);
      }
    }
  }

  const handleKeyDown = (e, hotkeyId) => {
    e.preventDefault();
    if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;

    const parts = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");

    let key = e.key;
    if (key === " ") key = "Space";
    else if (key.length === 1) key = key.toUpperCase();

    parts.push(key);
    const chord = parts.join("+");
    onUpdate(`shortcuts.${hotkeyId}`, chord);
    setEditingKey(null);
  };

  return (
    <div>
      <SettingsCard
        title="Global Keyboard Hotkeys"
        description="Press keyboard combinations anywhere in Windows to trigger Aura Island actions"
      >
        {hotkeys.map((item) => {
          const val = sc[item.id] || item.defaultVal;
          const isConflict = conflicts.has(item.id);
          const isRecording = editingKey === item.id;

          return (
            <SettingsRow
              key={item.id}
              icon={<Keyboard size={16} />}
              label={item.label}
              description={
                isConflict ? (
                  <span style={{ color: "#ff453a", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <AlertCircle size={12} /> Shortcut conflicts with another assignment!
                  </span>
                ) : (
                  `Default: ${item.defaultVal}`
                )
              }
              control={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isRecording ? (
                    <input
                      type="text"
                      autoFocus
                      placeholder="Press shortcut keys..."
                      onKeyDown={(e) => handleKeyDown(e, item.id)}
                      onBlur={() => setEditingKey(null)}
                      style={{
                        background: "rgba(10, 132, 255, 0.2)",
                        border: "1px solid #0a84ff",
                        borderRadius: 6,
                        color: "#ffffff",
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        width: 140,
                        textAlign: "center",
                        outline: "none",
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingKey(item.id)}
                      style={{
                        background: isConflict ? "rgba(255, 69, 58, 0.15)" : "rgba(255, 255, 255, 0.08)",
                        border: isConflict ? "1px solid rgba(255, 69, 58, 0.4)" : "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: 6,
                        color: isConflict ? "#ff453a" : "#ffffff",
                        padding: "5px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        outline: "none",
                        fontFamily: "monospace",
                      }}
                    >
                      {val}
                    </button>
                  )}
                  {val !== item.defaultVal && (
                    <button
                      type="button"
                      onClick={() => onUpdate(`shortcuts.${item.id}`, item.defaultVal)}
                      title="Reset to default"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "rgba(255, 255, 255, 0.4)",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              }
            />
          );
        })}
      </SettingsCard>
    </div>
  );
}
