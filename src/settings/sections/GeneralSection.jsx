import React, { useState, useEffect } from "react";
import {
  SettingsCard,
  SettingsRow,
  ToggleSwitch,
  TextField,
  Dropdown,
  HotkeyRecorder,
} from "../components/SettingsUI";
import { User, Globe, Power, Keyboard, Monitor } from "lucide-react";
import { translations, getTranslation } from "../../locales/translations";

export default function GeneralSection({ settings = {}, onUpdate, highlightedRow }) {
  const [displays, setDisplays] = useState([{ label: "Primary Monitor", value: "primary" }]);

  const general = settings.general || {};
  const currentLang = general.language || "en";
  const t = getTranslation(currentLang).general || translations.en.general;

  useEffect(() => {
    if (window.electronAPI?.getDisplays) {
      window.electronAPI.getDisplays().then((dispList) => {
        if (Array.isArray(dispList) && dispList.length > 0) {
          const opts = dispList.map((d, i) => ({
            label: `${d.primary ? "Primary Monitor" : `Monitor ${i + 1}`} (${d.bounds?.width || d.width || 1920}x${d.bounds?.height || d.height || 1080})`,
            value: String(d.id || i),
          }));
          setDisplays(opts);
        }
      }).catch(() => {});
    }
  }, []);

  const languageOptions = [
    { label: "English", value: "en" },
    { label: "සිංහල (Sinhala)", value: "si" },
    { label: "தமிழ் (Tamil)", value: "ta" },
  ];

  return (
    <div>
      <SettingsCard title="Identity & Greeting" description="Customize how Aura Island recognizes and addresses you">
        <SettingsRow
          id="displayName"
          highlight={highlightedRow === "displayName"}
          icon={<User size={16} />}
          label={t.displayName}
          description={t.displayNameDesc}
          control={
            <TextField
              value={general.displayName || "User"}
              placeholder="Your name"
              width={160}
              onChange={(val) => onUpdate("general.displayName", val)}
            />
          }
        />
        <SettingsRow
          id="language"
          highlight={highlightedRow === "language"}
          icon={<Globe size={16} />}
          label={t.language}
          description={t.languageDesc}
          isLast
          control={
            <Dropdown
              options={languageOptions}
              value={general.language || "en"}
              width={160}
              onChange={(val) => onUpdate("general.language", val)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="System Startup & Shortcuts" description="Manage autostart and global access shortcuts">
        <SettingsRow
          id="startWithWindows"
          highlight={highlightedRow === "startWithWindows"}
          icon={<Power size={16} />}
          label={t.startWithWindows}
          description={t.startWithWindowsDesc}
          control={
            <ToggleSwitch
              checked={Boolean(general.startWithWindows)}
              onChange={(val) => {
                onUpdate("general.startWithWindows", val);
                if (window.electronAPI?.setAutoLaunch) {
                  window.electronAPI.setAutoLaunch(val);
                }
              }}
            />
          }
        />
        <SettingsRow
          id="checkHotkey"
          highlight={highlightedRow === "checkHotkey"}
          icon={<Keyboard size={16} />}
          label={t.checkHotkey}
          description={t.checkHotkeyDesc}
          isLast
          control={
            <HotkeyRecorder
              value={general.checkHotkey || settings.shortcuts?.openSettings || "Ctrl+Alt+,"}
              onChange={(val) => {
                onUpdate("general.checkHotkey", val);
                onUpdate("shortcuts.openSettings", val);
              }}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Display & Positioning" description="Select which monitor will host the island and reserved menu bar">
        <SettingsRow
          id="monitor"
          highlight={highlightedRow === "monitor"}
          icon={<Monitor size={16} />}
          label={t.monitor}
          description={t.monitorDesc}
          isLast
          control={
            <Dropdown
              options={displays}
              value={String(general.targetDisplay || "primary")}
              width={220}
              onChange={(val) => {
                onUpdate("general.targetDisplay", val);
                if (window.electronAPI?.setDisplay) {
                  window.electronAPI.setDisplay(val);
                }
              }}
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
