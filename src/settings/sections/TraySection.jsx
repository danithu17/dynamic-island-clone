import React, { useState } from "react";
import {
  SettingsCard,
  SettingsRow,
  SegmentedControl,
  Stepper,
  SettingsButton,
  TextField,
  InlineConfirmSheet,
} from "../components/SettingsUI";
import { Folder, Trash2, Sliders, FolderOpen } from "lucide-react";

export default function TraySection({ settings = {}, onUpdate, highlightedRow }) {
  const tray = settings.trayStorage || {};
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const defaultFolder = "%APPDATA%\\AuraIsland\\Tray";

  const handleClearUnpinned = () => {
    setIsClearConfirmOpen(false);
    if (window.electronAPI?.clearShelf) {
      window.electronAPI.clearShelf();
    }
    setNotice("Unpinned tray files cleared.");
    setTimeout(() => setNotice(""), 3000);
  };

  return (
    <div>
      {notice && (
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
          {notice}
        </div>
      )}

      <SettingsCard title="Storage Location & Drop Modes" description="Configure where files swallowed into the shelf tray reside">
        <SettingsRow
          id="trayFolder"
          highlight={highlightedRow === "trayFolder"}
          icon={<FolderOpen size={16} />}
          label="Storage Directory"
          description="Local directory for staged shelf files"
          control={
            <div style={{ display: "flex", gap: 8 }}>
              <TextField
                value={tray.folder || defaultFolder}
                onChange={(val) => onUpdate("trayStorage.folder", val)}
                width={200}
              />
              <SettingsButton
                label="Browse"
                onClick={() => {
                  if (window.electronAPI?.openPath) {
                    window.electronAPI.openPath("");
                  }
                }}
              />
            </div>
          }
        />
        <SettingsRow
          id="trayDropMode"
          highlight={highlightedRow === "trayDropMode"}
          icon={<Sliders size={16} />}
          label="File Handling Behavior"
          description="Choose whether files dropped into the notch are copied, moved, or linked"
          isLast
          control={
            <SegmentedControl
              options={[
                { label: "Copy", value: "copy" },
                { label: "Move", value: "move" },
                { label: "Link", value: "link" },
              ]}
              value={tray.dropMode || "copy"}
              onChange={(val) => onUpdate("trayStorage.dropMode", val)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Automated Clean-up" description="Periodically purge temporary staging files">
        <SettingsRow
          id="autoClean"
          highlight={highlightedRow === "autoClean"}
          label="Auto-Clean Staged Files"
          description="Automatically delete unpinned files older than N days (0 = Never)"
          control={
            <Stepper
              min={0}
              max={365}
              step={7}
              unit="days"
              value={tray.autoCleanDays || 0}
              onChange={(val) => onUpdate("trayStorage.autoCleanDays", val)}
            />
          }
        />
        <SettingsRow
          id="clearUnpinned"
          highlight={highlightedRow === "clearUnpinned"}
          icon={<Trash2 size={16} />}
          label="Clear Unpinned Files Now"
          description="Purge all temporary shelf staging files immediately"
          isDanger
          isLast
          control={
            <SettingsButton
              variant="danger"
              icon={<Trash2 size={13} />}
              label="Clear Unpinned"
              onClick={() => setIsClearConfirmOpen(true)}
            />
          }
        />
      </SettingsCard>

      <InlineConfirmSheet
        isOpen={isClearConfirmOpen}
        title="Clear Unpinned Shelf Files?"
        message="Are you sure you want to remove all unpinned temporary files from your shelf storage?"
        confirmLabel="Clear Files"
        cancelLabel="Cancel"
        isDanger
        onConfirm={handleClearUnpinned}
        onCancel={() => setIsClearConfirmOpen(false)}
      />
    </div>
  );
}
