import React from "react";
import { SettingsCard, SettingsRow, SegmentedControl } from "../components/SettingsUI";
import { Moon, Palette, Type } from "lucide-react";

const ACCENT_COLORS = [
  { label: "Blue", value: "#0a84ff" },
  { label: "Purple", value: "#5e5ce6" },
  { label: "Green", value: "#30d158" },
  { label: "Orange", value: "#ff9f0a" },
  { label: "Red", value: "#ff453a" },
  { label: "Pink", value: "#bf5af2" },
];

export default function AppearanceSection({ settings, onUpdate }) {
  const app = settings.appearance || {};

  return (
    <div>
      <SettingsCard title="Theme Mode" description="Choose how Aura Island adapts to your environment">
        <SettingsRow
          icon={<Moon size={16} />}
          label="Interface Theme"
          description="Select dark, light, or automatic system appearance"
          control={
            <SegmentedControl
              options={[
                { label: "Dark", value: "dark" },
                { label: "Light", value: "light" },
                { label: "Auto", value: "auto" },
              ]}
              value={app.theme || "dark"}
              onChange={(val) => onUpdate("appearance.theme", val)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Accent Color" description="Personalize status chips, active badges, and highlight colors">
        <SettingsRow
          icon={<Palette size={16} />}
          label="Theme Color"
          description="Color applied to active states, audio wave bars, and buttons"
          control={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {ACCENT_COLORS.map((col) => (
                <button
                  key={col.value}
                  type="button"
                  title={col.label}
                  onClick={() => onUpdate("appearance.accentColor", col.value)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: col.value,
                    border: (app.accentColor || "#0a84ff") === col.value ? "2px solid #ffffff" : "2px solid transparent",
                    cursor: "pointer",
                    outline: "none",
                    boxShadow: (app.accentColor || "#0a84ff") === col.value ? `0 0 8px ${col.value}` : "none",
                    transition: "transform 0.15s ease",
                  }}
                />
              ))}
            </div>
          }
        />
      </SettingsCard>

      <SettingsCard title="Typography" description="System font rendering and typography family">
        <SettingsRow
          icon={<Type size={16} />}
          label="Font Family"
          description="Windows 11 Segoe UI Variable is recommended for crisp ClearType rendering"
          control={
            <select
              value={app.font || "Segoe UI Variable"}
              onChange={(e) => onUpdate("appearance.font", e.target.value)}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 12,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="Segoe UI Variable" style={{ background: "#222" }}>Segoe UI Variable (Recommended)</option>
              <option value="Segoe UI" style={{ background: "#222" }}>Segoe UI</option>
              <option value="Inter" style={{ background: "#222" }}>Inter</option>
              <option value="system-ui" style={{ background: "#222" }}>System UI Default</option>
            </select>
          }
        />
      </SettingsCard>
    </div>
  );
}
