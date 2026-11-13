import React from "react";
import {
  SettingsCard,
  SettingsRow,
  SegmentedControl,
  ColorDots,
  ToggleSwitch,
  Dropdown,
} from "../components/SettingsUI";
import { Moon, Palette, Type, Clock } from "lucide-react";

export default function AppearanceSection({ settings = {}, onUpdate, highlightedRow }) {
  const app = settings.appearance || {};

  const fontOptions = [
    { label: "Segoe UI Variable (Default)", value: "Segoe UI Variable" },
    { label: "Segoe UI", value: "Segoe UI" },
    { label: "Inter", value: "Inter" },
    { label: "System UI", value: "system-ui" },
  ];

  return (
    <div>
      <SettingsCard title="Theme & Color" description="Customize background mode, accent highlights, and text size">
        <SettingsRow
          id="theme"
          highlight={highlightedRow === "theme"}
          icon={<Moon size={16} />}
          label="Interface Theme"
          description="Dark mode is enabled by default or can match Windows system settings"
          control={
            <SegmentedControl
              options={[
                { label: "Dark", value: "dark" },
                { label: "Match System", value: "match-system" },
                { label: "Light", value: "light" },
              ]}
              value={app.theme || "dark"}
              onChange={(val) => onUpdate("appearance.theme", val)}
            />
          }
        />
        <SettingsRow
          id="accentColor"
          highlight={highlightedRow === "accentColor"}
          icon={<Palette size={16} />}
          label="Accent Color"
          description="Color applied to active tabs, scrubber handles, and toggle switches"
          control={
            <ColorDots
              value={app.accentColor || "#0a84ff"}
              onChange={(val) => onUpdate("appearance.accentColor", val)}
            />
          }
        />
        <SettingsRow
          id="textSize"
          highlight={highlightedRow === "textSize"}
          icon={<Type size={16} />}
          label="Text Size"
          description="Adjust overall text scaling across the island and dashboard"
          control={
            <SegmentedControl
              options={[
                { label: "Small", value: "small" },
                { label: "Medium", value: "medium" },
                { label: "Large", value: "large" },
              ]}
              value={app.textSize || "medium"}
              onChange={(val) => onUpdate("appearance.textSize", val)}
            />
          }
        />
        <SettingsRow
          id="largeClock"
          highlight={highlightedRow === "largeClock"}
          icon={<Clock size={16} />}
          label="Large Clock on Home"
          description="Display an expanded digital clock widget on the Home dashboard"
          isLast
          control={
            <ToggleSwitch
              checked={Boolean(app.largeClock)}
              onChange={(val) => onUpdate("appearance.largeClock", val)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Typography Font" description="Crisp ClearType rendering on high-DPI displays">
        <SettingsRow
          id="font"
          highlight={highlightedRow === "font"}
          icon={<Type size={16} />}
          label="Font Family"
          description="Windows 11 Segoe UI Variable provides optimal optical sizing"
          isLast
          control={
            <Dropdown
              options={fontOptions}
              value={app.font || "Segoe UI Variable"}
              width={200}
              onChange={(val) => onUpdate("appearance.font", val)}
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
