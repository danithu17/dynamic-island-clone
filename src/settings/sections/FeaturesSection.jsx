import React from "react";
import { SettingsCard, SettingsRow, ToggleSwitch } from "../components/SettingsUI";
import { Timer, FolderPlus, Clipboard, FileEdit, Music, GitBranch, Smartphone, Layers } from "lucide-react";

export default function FeaturesSection({ settings, onUpdate }) {
  const feat = settings.features || {};

  const handleToggle = (key, val) => {
    onUpdate(`features.${key}`, val);
  };

  return (
    <div>
      <SettingsCard title="Productivity Tools" description="Toggle modular capabilities in the menu bar and Dynamic Island">
        <SettingsRow
          icon={<Timer size={16} />}
          label="Focus Timer & Pomodoro"
          description="Quick timer countdowns (1m, 5m, 15m, 25m) with active chip tracking"
          control={
            <ToggleSwitch
              checked={feat.focusTimer !== false}
              onChange={(val) => handleToggle("focusTimer", val)}
            />
          }
        />

        <SettingsRow
          icon={<Clipboard size={16} />}
          label="Clipboard History Manager"
          description="Automatic history tracking for copied text snippets with one-click restore"
          control={
            <ToggleSwitch
              checked={feat.clipboard !== false}
              onChange={(val) => handleToggle("clipboard", val)}
            />
          }
        />

        <SettingsRow
          icon={<FolderPlus size={16} />}
          label="Shelf File Staging"
          description="Drag-and-drop mouth on the island and temporary staging shelf panel"
          control={
            <ToggleSwitch
              checked={feat.shelf !== false}
              onChange={(val) => handleToggle("shelf", val)}
            />
          }
        />

        <SettingsRow
          icon={<FileEdit size={16} />}
          label="Quick Notes & Scratchpad"
          description="Instant plain text editor with auto-save for temporary thoughts and ideas"
          control={
            <ToggleSwitch
              checked={feat.notes !== false}
              onChange={(val) => handleToggle("notes", val)}
            />
          }
        />

        <SettingsRow
          icon={<Music size={16} />}
          label="System Media Controls"
          description="Global System Media Transport Controls (GSMTC) integration with Spotify, YouTube, Chrome"
          control={
            <ToggleSwitch
              checked={feat.mediaControls !== false}
              onChange={(val) => handleToggle("mediaControls", val)}
            />
          }
        />

        <SettingsRow
          icon={<Layers size={16} />}
          label="Per-App Menus"
          description="Mirror foreground application menus (UIA, curated profiles, generic fallback)"
          control={
            <ToggleSwitch
              checked={feat.perAppMenus !== false}
              onChange={(val) => handleToggle("perAppMenus", val)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Developer & System Extensions" description="Optional extended integrations">
        <SettingsRow
          icon={<GitBranch size={16} />}
          label="Git Repository Status"
          description="Show branch name, uncommitted changes, and sync badges when terminal is active"
          control={
            <ToggleSwitch
              checked={Boolean(feat.gitStatus)}
              onChange={(val) => handleToggle("gitStatus", val)}
            />
          }
        />

        <SettingsRow
          icon={<Smartphone size={16} />}
          label="Windows Phone Link"
          description="Bridge mobile notifications and battery level to the island"
          control={
            <ToggleSwitch
              checked={Boolean(feat.phoneLink)}
              onChange={(val) => handleToggle("phoneLink", val)}
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
