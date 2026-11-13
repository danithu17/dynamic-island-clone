import React, { useState } from "react";
import {
  SettingsCard,
  SettingsRow,
  ToggleSwitch,
  Stepper,
  SettingsButton,
  TextField,
  InlineConfirmSheet,
} from "../components/SettingsUI";
import { Clipboard, Shield, Trash2, Plus, X, Lock } from "lucide-react";

export default function ClipboardSection({ settings = {}, onUpdate, highlightedRow }) {
  const clip = settings.clipboard || {};
  const [newIgnoreApp, setNewIgnoreApp] = useState("");
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [clearNotice, setClearNotice] = useState("");

  const appsToIgnore = clip.appsToIgnore || ["1Password.exe", "KeePass.exe", "Bitwarden.exe"];

  const handleAddIgnoreApp = () => {
    if (!newIgnoreApp.trim()) return;
    const clean = newIgnoreApp.trim();
    if (!appsToIgnore.includes(clean)) {
      onUpdate("clipboard.appsToIgnore", [...appsToIgnore, clean]);
    }
    setNewIgnoreApp("");
  };

  const handleRemoveIgnoreApp = (appName) => {
    onUpdate(
      "clipboard.appsToIgnore",
      appsToIgnore.filter((a) => a !== appName)
    );
  };

  const handleClearHistory = async () => {
    setIsClearConfirmOpen(false);
    if (window.electronAPI?.clearClipboardHistory) {
      await window.electronAPI.clearClipboardHistory();
    }
    setClearNotice("Clipboard history erased.");
    setTimeout(() => setClearNotice(""), 3000);
  };

  return (
    <div>
      {clearNotice && (
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
          }}
        >
          {clearNotice}
        </div>
      )}

      <SettingsCard title="Clipboard Ring Buffer" description="Capture copied snippets for quick recall from the island">
        <SettingsRow
          id="clipboardEnabled"
          highlight={highlightedRow === "clipboardEnabled"}
          icon={<Clipboard size={16} />}
          label="Clipboard History"
          description="Record copied text snippets locally on this PC"
          control={
            <ToggleSwitch
              checked={clip.enabled !== false}
              onChange={(val) => onUpdate("clipboard.enabled", val)}
            />
          }
        />
        <SettingsRow
          id="historySize"
          highlight={highlightedRow === "historySize"}
          label="Maximum History Size"
          description="Number of copied items kept in the local ring buffer (10 - 200)"
          control={
            <Stepper
              min={10}
              max={200}
              step={10}
              value={clip.historySize || 50}
              onChange={(val) => onUpdate("clipboard.historySize", val)}
            />
          }
        />
        <SettingsRow
          id="secretFilter"
          highlight={highlightedRow === "secretFilter"}
          icon={<Shield size={16} />}
          label="Secret & Password Filter"
          description="Automatically detects and skips passkeys, tokens, and password fields"
          isLast
          control={
            <ToggleSwitch
              checked={clip.secretFilter !== false}
              onChange={(val) => onUpdate("clipboard.secretFilter", val)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Ignored Applications" description="Applications whose clipboard contents are never copied or tracked">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "6px 0" }}>
          {appsToIgnore.map((app) => (
            <div
              key={app}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                borderRadius: 7,
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: 12,
              }}
            >
              <Lock size={12} color="#ffd60a" />
              <span>{app}</span>
              <button
                type="button"
                aria-label={`Remove ${app}`}
                onClick={() => handleRemoveIgnoreApp(app)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <TextField
            value={newIgnoreApp}
            onChange={setNewIgnoreApp}
            placeholder="Process name (e.g. KeePassXC.exe)"
            width={240}
          />
          <SettingsButton
            icon={<Plus size={13} />}
            label="Add App"
            onClick={handleAddIgnoreApp}
          />
        </div>
      </SettingsCard>

      <SettingsCard title="Buffer Maintenance" description="Purge sensitive clipboard items from memory">
        <SettingsRow
          id="clearHistory"
          highlight={highlightedRow === "clearHistory"}
          icon={<Trash2 size={16} />}
          label="Clear Clipboard History"
          description="Erase all saved clips from system memory immediately"
          isDanger
          isLast
          control={
            <SettingsButton
              variant="danger"
              icon={<Trash2 size={13} />}
              label="Clear History"
              onClick={() => setIsClearConfirmOpen(true)}
            />
          }
        />
      </SettingsCard>

      <InlineConfirmSheet
        isOpen={isClearConfirmOpen}
        title="Clear Clipboard History?"
        message="Are you sure you want to erase all saved clipboard snippets? This cannot be undone."
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        isDanger
        onConfirm={handleClearHistory}
        onCancel={() => setIsClearConfirmOpen(false)}
      />
    </div>
  );
}
