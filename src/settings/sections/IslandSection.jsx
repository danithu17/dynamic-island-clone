import React from "react";
import { SettingsCard, SettingsRow, ToggleSwitch, SegmentedControl } from "../components/SettingsUI";
import { Sparkles, MousePointer, Activity } from "lucide-react";

export default function IslandSection({ settings, onUpdate }) {
  const island = settings.island || {};

  return (
    <div>
      <SettingsCard title="Notch Idle Appearance" description="Configure how the center Dynamic Island looks when idle">
        <SettingsRow
          icon={<Sparkles size={16} />}
          label="Idle Notch Size"
          description="In reserved mode, minimal sensor mode leaves the bar clean and distraction-free"
          control={
            <SegmentedControl
              options={[
                { label: "Compact", value: "compact" },
                { label: "Minimal", value: "minimal" },
                { label: "Hidden", value: "hidden" },
              ]}
              value={island.idleSize || "compact"}
              onChange={(val) => onUpdate("island.idleSize", val)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Interaction & Hover Behavior" description="Mouse triggers and expansion sensitivity">
        <SettingsRow
          icon={<MousePointer size={16} />}
          label="Expand on Mouse Hover"
          description="Expand the island automatically when hovering the notch"
          control={
            <ToggleSwitch
              checked={island.hoverExpand !== false}
              onChange={(val) => onUpdate("island.hoverExpand", val)}
            />
          }
        />

        <SettingsRow
          label={`Hover Delay: ${island.hoverDelayMs || 250}ms`}
          description="Delay before the island expands to avoid accidental triggers"
          control={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="range"
                min={100}
                max={500}
                step={50}
                value={island.hoverDelayMs || 250}
                onChange={(e) => onUpdate("island.hoverDelayMs", parseInt(e.target.value, 10))}
                style={{ width: 130, cursor: "pointer", accentColor: "#0a84ff" }}
              />
              <span style={{ fontSize: 12, minWidth: 40, opacity: 0.8 }}>{island.hoverDelayMs || 250}ms</span>
            </div>
          }
        />
      </SettingsCard>

      <SettingsCard title="Motion & Physics" description="Animation fluidity and system performance">
        <SettingsRow
          icon={<Activity size={16} />}
          label="Spring Animations"
          description="Fluid physics-based morphing for media, notifications, and alerts"
          control={
            <ToggleSwitch
              checked={island.animations !== false}
              onChange={(val) => onUpdate("island.animations", val)}
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
