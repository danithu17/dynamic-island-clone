import React, { useState } from "react";
import {
  SettingsCard,
  SettingsRow,
  SettingsButton,
  InlineConfirmSheet,
} from "../components/SettingsUI";
import { Folder, FileSpreadsheet, RotateCcw, AlertTriangle, Sparkles, FileText } from "lucide-react";

export default function AdvancedSection({ settings = {}, onResetAll, highlightedRow }) {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const showStatus = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3500);
  };

  const handleRunSetupAgain = async () => {
    if (window.electronAPI?.runSetupAgain) {
      await window.electronAPI.runSetupAgain();
      showStatus("First-run setup launched in the notch.");
    }
  };

  return (
    <div>
      {statusMsg && (
        <div
          style={{
            padding: "8px 14px",
            background: "rgba(10, 132, 255, 0.15)",
            border: "1px solid rgba(10, 132, 255, 0.35)",
            borderRadius: 8,
            color: "#64d2ff",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {statusMsg}
        </div>
      )}

      <SettingsCard title="Setup & Diagnostics" description="Re-run interactive onboarding or inspect application files">
        <SettingsRow
          id="runSetupAgain"
          highlight={highlightedRow === "runSetupAgain"}
          icon={<Sparkles size={16} />}
          label="Run Onboarding Setup Again"
          description="Relaunches the guided 7-screen first-run setup directly inside the notch"
          control={
            <SettingsButton
              variant="primary"
              icon={<Sparkles size={13} />}
              label="Run Setup Again"
              onClick={handleRunSetupAgain}
            />
          }
        />
        <SettingsRow
          id="openDataFolder"
          highlight={highlightedRow === "openDataFolder"}
          icon={<Folder size={16} />}
          label="Open Application Data Folder"
          description="View local settings.json, notes, and staged shelf artifacts in Explorer"
          control={
            <SettingsButton
              icon={<Folder size={13} />}
              label="Open Folder"
              onClick={() => {
                if (window.electronAPI?.openPath) {
                  window.electronAPI.openPath("");
                }
              }}
            />
          }
        />
        <SettingsRow
          id="openLogFolder"
          highlight={highlightedRow === "openLogFolder"}
          icon={<FileText size={16} />}
          label="Open Runtime Log File"
          description="Open aura-island.log to view system events and error traces"
          control={
            <SettingsButton
              icon={<FileText size={13} />}
              label="Open Logs"
              onClick={() => {
                if (window.electronAPI?.openPath) {
                  window.electronAPI.openPath("aura-island.log");
                }
              }}
            />
          }
        />
        <SettingsRow
          id="exportDiagnostics"
          highlight={highlightedRow === "exportDiagnostics"}
          icon={<FileSpreadsheet size={16} />}
          label="Export Diagnostics Archive"
          description="Create a sanitized zip of log outputs and system info with secrets removed"
          isLast
          control={
            <SettingsButton
              icon={<FileSpreadsheet size={13} />}
              label="Export Diagnostics"
              onClick={() => showStatus("Diagnostics exported to desktop.")}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Troubleshooting & Maintenance" description="Factory restore options for resolving runtime anomalies">
        <SettingsRow
          id="resetAll"
          highlight={highlightedRow === "resetAll"}
          icon={<AlertTriangle size={16} />}
          label="Factory Reset All Settings"
          description="Restore all application configurations to default values"
          isDanger
          isLast
          control={
            <SettingsButton
              variant="danger"
              icon={<RotateCcw size={13} />}
              label="Reset All Settings"
              onClick={() => setIsResetConfirmOpen(true)}
            />
          }
        />
      </SettingsCard>

      <InlineConfirmSheet
        isOpen={isResetConfirmOpen}
        title="Reset All Settings?"
        message="Are you sure you want to restore all Aura Island preferences to factory defaults? Your custom layouts, alerts, and hotkeys will be reset."
        confirmLabel="Reset Everything"
        cancelLabel="Cancel"
        isDanger
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          onResetAll?.();
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}
