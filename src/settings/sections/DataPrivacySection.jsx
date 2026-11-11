import React, { useState } from "react";
import { SettingsCard, SettingsRow, SettingsButton } from "../components/SettingsUI";
import { Trash2, Download, Upload, RefreshCw, Check, ShieldAlert } from "lucide-react";

export default function DataPrivacySection({ settings, onResetAll }) {
  const [clearedNotice, setClearedNotice] = useState("");

  const showCleared = (msg) => {
    setClearedNotice(msg);
    setTimeout(() => setClearedNotice(""), 3000);
  };

  const handleClearShelf = () => {
    if (window.confirm("Clear all staged files from the Shelf?")) {
      if (window.electronAPI?.clearShelf) {
        window.electronAPI.clearShelf().then(() => showCleared("Shelf cleared!"));
      } else {
        showCleared("Shelf cleared!");
      }
    }
  };

  const handleClearClipboard = () => {
    if (window.confirm("Permanently erase saved clipboard history?")) {
      if (window.electronAPI?.clearClipboardHistory) {
        window.electronAPI.clearClipboardHistory().then(() => showCleared("Clipboard history cleared!"));
      } else {
        showCleared("Clipboard history cleared!");
      }
    }
  };

  const handleClearNotes = () => {
    if (window.confirm("Permanently erase all notes from the scratchpad?")) {
      if (window.electronAPI?.clearNotes) {
        window.electronAPI.clearNotes().then(() => showCleared("Notes cleared!"));
      } else {
        showCleared("Notes cleared!");
      }
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aura-island-settings-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showCleared("Settings exported!");
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed && typeof parsed === "object") {
          if (window.electronAPI?.setMultipleSettings) {
            window.electronAPI.setMultipleSettings(parsed).then(() => {
              showCleared("Settings imported successfully!");
            });
          }
        }
      } catch (err) {
        alert("Invalid settings JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      {clearedNotice && (
        <div
          style={{
            padding: "8px 14px",
            background: "rgba(48, 209, 88, 0.15)",
            border: "1px solid rgba(48, 209, 88, 0.4)",
            borderRadius: 8,
            color: "#30d158",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Check size={14} /> {clearedNotice}
        </div>
      )}

      <SettingsCard title="Local Cache & Data Clearance" description="Clean temporary local storage and private buffers">
        <SettingsRow
          icon={<Trash2 size={16} />}
          label="Clear Shelf Storage"
          description="Remove all staged file pointers and drag-and-drop items"
          control={<SettingsButton label="Clear Shelf" variant="danger" onClick={handleClearShelf} />}
        />

        <SettingsRow
          icon={<Trash2 size={16} />}
          label="Clear Clipboard History"
          description="Erase all stored snippets and clipboard memory"
          control={<SettingsButton label="Clear History" variant="danger" onClick={handleClearClipboard} />}
        />

        <SettingsRow
          icon={<Trash2 size={16} />}
          label="Clear Quick Notes"
          description="Delete all scratchpad text and draft notes"
          control={<SettingsButton label="Clear Notes" variant="danger" onClick={handleClearNotes} />}
        />
      </SettingsCard>

      <SettingsCard title="Backup & Restore" description="Export and import your complete Aura Island configuration">
        <SettingsRow
          icon={<Download size={16} />}
          label="Export Settings"
          description="Save preferences, shortcuts, and custom profiles to a JSON file"
          control={<SettingsButton label="Export JSON" onClick={handleExport} />}
        />

        <SettingsRow
          icon={<Upload size={16} />}
          label="Import Settings"
          description="Restore previously exported settings file"
          control={
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 7,
                background: "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span>Choose File</span>
              <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
            </label>
          }
        />
      </SettingsCard>

      <SettingsCard title="Factory Reset" description="Erase all customizations and restore factory settings">
        <SettingsRow
          icon={<ShieldAlert size={16} />}
          isDanger
          label="Reset All Settings"
          description="Restores all 10 configuration categories to default values immediately"
          control={
            <SettingsButton
              label="Reset All"
              variant="danger"
              onClick={() => {
                if (window.confirm("Are you sure you want to restore ALL Aura Island settings to default?")) {
                  onResetAll?.();
                }
              }}
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
