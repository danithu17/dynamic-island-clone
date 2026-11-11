import React from "react";
import { SettingsCard, SettingsRow, ToggleSwitch } from "../components/SettingsUI";
import { Bell, Volume2, Battery, Download, Timer, Wifi, Bluetooth } from "lucide-react";

export default function AlertsSection({ settings, onUpdate }) {
  const al = settings.alerts || {};
  const types = al.types || {};

  const handleTypeToggle = (key, val) => {
    onUpdate(`alerts.types.${key}`, val);
  };

  return (
    <div>
      <SettingsCard title="Smart Alerts Master Control" description="Live Island notifications for system events and hardware actions">
        <SettingsRow
          icon={<Bell size={16} />}
          label="Enable Smart Alerts"
          description="Display live pill animations when system events occur"
          control={
            <ToggleSwitch
              checked={al.enabled !== false}
              onChange={(val) => onUpdate("alerts.enabled", val)}
            />
          }
        />

        <SettingsRow
          label={`Alert Display Duration: ${al.duration || 4} seconds`}
          description="How long notification pills remain expanded before receding"
          control={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="range"
                min={2}
                max={12}
                step={1}
                value={al.duration || 4}
                onChange={(e) => onUpdate("alerts.duration", parseInt(e.target.value, 10))}
                style={{ width: 130, cursor: "pointer", accentColor: "#0a84ff" }}
              />
              <span style={{ fontSize: 12, minWidth: 32, opacity: 0.8 }}>{al.duration || 4}s</span>
            </div>
          }
        />

        <SettingsRow
          icon={<Volume2 size={16} />}
          label="Notification Sound Effects"
          description="Play a subtle audio chime when critical alerts trigger"
          control={
            <ToggleSwitch
              checked={Boolean(al.sounds)}
              onChange={(val) => onUpdate("alerts.sounds", val)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Per-Type Notification Filters" description="Choose which system events trigger Dynamic Island animations">
        <SettingsRow
          icon={<Battery size={16} />}
          label="Battery & Power State"
          description="Charging plugged/unplugged, low battery warnings (20% and 10%)"
          control={
            <ToggleSwitch
              checked={types.battery !== false}
              onChange={(val) => handleTypeToggle("battery", val)}
            />
          }
        />

        <SettingsRow
          icon={<Download size={16} />}
          label="Download Completions"
          description="Browser downloads finished in your Downloads folder"
          control={
            <ToggleSwitch
              checked={types.downloads !== false}
              onChange={(val) => handleTypeToggle("downloads", val)}
            />
          }
        />

        <SettingsRow
          icon={<Timer size={16} />}
          label="Focus Timers & Alarms"
          description="Timer countdown completion and interval alerts"
          control={
            <ToggleSwitch
              checked={types.timers !== false}
              onChange={(val) => handleTypeToggle("timers", val)}
            />
          }
        />

        <SettingsRow
          icon={<Wifi size={16} />}
          label="Wi-Fi Network Events"
          description="Network connected, disconnected, and roaming changes"
          control={
            <ToggleSwitch
              checked={types.wifi !== false}
              onChange={(val) => handleTypeToggle("wifi", val)}
            />
          }
        />

        <SettingsRow
          icon={<Bluetooth size={16} />}
          label="Bluetooth Peripherals"
          description="Headphones, mouse, and keyboard connection alerts"
          control={
            <ToggleSwitch
              checked={types.bluetooth !== false}
              onChange={(val) => handleTypeToggle("bluetooth", val)}
            />
          }
        />

        <SettingsRow
          icon={<Volume2 size={16} />}
          label="Hardware Volume Keys"
          description="Show pill HUD when hardware volume keys are pressed"
          control={
            <ToggleSwitch
              checked={types.volume !== false}
              onChange={(val) => handleTypeToggle("volume", val)}
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
