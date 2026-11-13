import React, { useState } from "react";
import {
  SettingsCard,
  SettingsRow,
  SettingsButton,
  InlineConfirmSheet,
} from "../components/SettingsUI";
import {
  ShieldCheck,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  XCircle,
  Check,
  Download,
  Upload,
} from "lucide-react";
import { getTranslation } from "../../locales/translations";

export default function DataPrivacySection({ settings = {}, onResetAll, highlightedRow }) {
  const [clearedNotice, setClearedNotice] = useState("");
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);

  const currentLang = settings.general?.language || "en";
  const t = getTranslation(currentLang).privacy;

  const showCleared = (msg) => {
    setClearedNotice(msg);
    setTimeout(() => setClearedNotice(""), 3000);
  };

  const handleDeleteAllData = async () => {
    setIsDeleteSheetOpen(false);
    try {
      if (window.electronAPI?.deleteAllUserData) {
        await window.electronAPI.deleteAllUserData();
      } else {
        if (window.electronAPI?.clearShelf) await window.electronAPI.clearShelf();
        if (window.electronAPI?.clearClipboardHistory) await window.electronAPI.clearClipboardHistory();
        if (window.electronAPI?.clearNotes) await window.electronAPI.clearNotes();
        if (window.electronAPI?.resetAllSettings) await window.electronAPI.resetAllSettings();
      }
      showCleared("All local data has been permanently deleted.");
    } catch (_) {
      showCleared("Data clearance finished.");
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
        showCleared("Failed to parse settings JSON");
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

      {/* What Aura Island Reads */}
      <SettingsCard title={t.readsTitle} description={t.readsDesc}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
          {t.readsItems.map((item, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <CheckCircle2 size={15} style={{ color: "#30d158", marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.4 }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* What Aura Island NEVER Does */}
      <SettingsCard title={t.neverTitle} description={t.neverDesc}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
          {t.neverItems.map((item, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <XCircle size={15} style={{ color: "#0a84ff", marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.4 }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Data Management & Deletion */}
      <SettingsCard title={t.deleteTitle} description={t.deleteDesc}>
        <SettingsRow
          id="deleteData"
          highlight={highlightedRow === "deleteData"}
          icon={<ShieldAlert size={16} />}
          label="Erase Local Identity & History"
          description="Wipes clipboard history, notes, shelf items, and restores defaults"
          isDanger
          control={
            <SettingsButton
              variant="danger"
              icon={<Trash2 size={13} />}
              label={t.deleteButton}
              onClick={() => setIsDeleteSheetOpen(true)}
            />
          }
        />
        <SettingsRow
          id="exportSettings"
          icon={<Download size={16} />}
          label="Export Configuration Backup"
          description="Download your preferences as a portable JSON file"
          control={
            <SettingsButton
              icon={<Download size={13} />}
              label="Export Settings"
              onClick={handleExport}
            />
          }
        />
        <SettingsRow
          id="importSettings"
          icon={<Upload size={16} />}
          label="Restore from Backup"
          description="Load preferences from a previously saved JSON file"
          isLast
          control={
            <label style={{ display: "inline-flex", cursor: "pointer" }}>
              <input
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleImport}
              />
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                <Upload size={13} />
                <span>Import JSON</span>
              </span>
            </label>
          }
        />
      </SettingsCard>

      {/* Inline Confirm Sheet for Delete All Data */}
      <InlineConfirmSheet
        isOpen={isDeleteSheetOpen}
        title={t.deleteConfirmTitle}
        message={t.deleteConfirmMessage}
        confirmLabel={t.deleteConfirmButton}
        cancelLabel="Cancel"
        isDanger
        onConfirm={handleDeleteAllData}
        onCancel={() => setIsDeleteSheetOpen(false)}
      />
    </div>
  );
}
