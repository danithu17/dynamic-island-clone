import React from "react";
import {
  SettingsCard,
  SettingsRow,
  ToggleSwitch,
  SliderWithValue,
  Stepper,
  TextField,
} from "../components/SettingsUI";
import {
  Bell,
  Volume2,
  VolumeX,
  BatteryCharging,
  Camera,
  Download,
  Timer,
  Mail,
  Bot,
  Usb,
  Sliders,
  Moon,
} from "lucide-react";
import { getTranslation } from "../../locales/translations";

export default function AlertsSection({ settings = {}, onUpdate, highlightedRow }) {
  const al = settings.alerts || {};
  const types = al.types || {};
  const dnd = al.dndSchedule || { enabled: false, startTime: "22:00", endTime: "07:00" };
  const currentLang = settings.general?.language || "en";
  const t = getTranslation(currentLang).alerts;

  const updateTypeProperty = (typeKey, prop, val) => {
    const curr = typeof types[typeKey] === "object" ? types[typeKey] : { enabled: Boolean(types[typeKey]) };
    const updated = { ...curr, [prop]: val };
    onUpdate(`alerts.types.${typeKey}`, updated);

    // Also update legacy flat boolean keys for backwards-compatibility
    if (prop === "enabled") {
      if (typeKey === "charging" || typeKey === "battery") onUpdate("alerts.types.battery", val);
      if (typeKey === "timer") onUpdate("alerts.types.timers", val);
      if (typeKey === "downloads") onUpdate("alerts.types.downloads", val);
      if (typeKey === "volumeHud") onUpdate("alerts.types.volume", val);
    }
  };

  const alertDefinitions = [
    {
      key: "charging",
      label: t.types.charging,
      desc: t.types.chargingDesc,
      icon: <BatteryCharging size={16} />,
      defaultDuration: 4,
    },
    {
      key: "screenshots",
      label: t.types.screenshots,
      desc: t.types.screenshotsDesc,
      icon: <Camera size={16} />,
      defaultDuration: 4,
    },
    {
      key: "downloads",
      label: t.types.downloads,
      desc: t.types.downloadsDesc,
      icon: <Download size={16} />,
      defaultDuration: 4,
    },
    {
      key: "timer",
      label: t.types.timer,
      desc: t.types.timerDesc,
      icon: <Timer size={16} />,
      defaultDuration: 5,
    },
    {
      key: "gmail",
      label: t.types.gmail,
      desc: t.types.gmailDesc,
      icon: <Mail size={16} />,
      defaultDuration: 4,
    },
    {
      key: "aiAgent",
      label: t.types.aiAgent,
      desc: t.types.aiAgentDesc,
      icon: <Bot size={16} />,
      defaultDuration: 4,
    },
    {
      key: "usbDevices",
      label: t.types.usbDevices,
      desc: t.types.usbDevicesDesc,
      icon: <Usb size={16} />,
      defaultDuration: 4,
    },
    {
      key: "volumeHud",
      label: t.types.volumeHud,
      desc: t.types.volumeHudDesc,
      icon: <Sliders size={16} />,
      defaultDuration: 2,
    },
  ];

  return (
    <div>
      {/* Master Control */}
      <SettingsCard title="Smart Alerts Master Control" description="Live expanding notifications for system events and background tasks">
        <SettingsRow
          id="alertsMaster"
          highlight={highlightedRow === "alertsMaster"}
          icon={<Bell size={16} />}
          label={t.master}
          description={t.masterDesc}
          control={
            <ToggleSwitch
              checked={al.enabled !== false}
              onChange={(val) => onUpdate("alerts.enabled", val)}
            />
          }
        />
        <SettingsRow
          id="alertsDuration"
          highlight={highlightedRow === "alertsDuration"}
          label="Default Alert Duration"
          description="Default seconds alerts stay on-screen before smooth collapse"
          control={
            <SliderWithValue
              min={1}
              max={15}
              step={1}
              unit="s"
              value={typeof al.duration === "number" ? al.duration : 4}
              onChange={(val) => onUpdate("alerts.duration", val)}
            />
          }
        />
        <SettingsRow
          id="alertsSounds"
          highlight={highlightedRow === "alertsSounds"}
          icon={<Volume2 size={16} />}
          label="Global Sound Effects"
          description="Play a calm audio tone when alerts appear"
          isLast
          control={
            <ToggleSwitch
              checked={Boolean(al.sounds)}
              onChange={(val) => onUpdate("alerts.sounds", val)}
            />
          }
        />
      </SettingsCard>

      {/* Do Not Disturb Schedule */}
      <SettingsCard title="Do Not Disturb Schedule" description="Automatically silence notifications during your focused hours">
        <SettingsRow
          id="dndEnabled"
          highlight={highlightedRow === "dndEnabled"}
          icon={<Moon size={16} />}
          label={t.dndSchedule}
          description={t.dndScheduleDesc}
          control={
            <ToggleSwitch
              checked={Boolean(dnd.enabled)}
              onChange={(val) => onUpdate("alerts.dndSchedule.enabled", val)}
            />
          }
        />
        {dnd.enabled && (
          <>
            <SettingsRow
              id="dndStartTime"
              label={t.startTime}
              description="When Do Not Disturb turns on automatically"
              control={
                <TextField
                  value={dnd.startTime || "22:00"}
                  width={100}
                  onChange={(val) => onUpdate("alerts.dndSchedule.startTime", val)}
                />
              }
            />
            <SettingsRow
              id="dndEndTime"
              label={t.endTime}
              description="When Do Not Disturb turns off in the morning"
              isLast
              control={
                <TextField
                  value={dnd.endTime || "07:00"}
                  width={100}
                  onChange={(val) => onUpdate("alerts.dndSchedule.endTime", val)}
                />
              }
            />
          </>
        )}
      </SettingsCard>

      {/* Individual Alert Types */}
      <SettingsCard title="Alert Channels & Per-Type Tuning" description="Configure duration, chime sound, and visibility for each alert type">
        {alertDefinitions.map((def, idx) => {
          const raw = types[def.key];
          const isEnabled = typeof raw === "object" ? raw.enabled !== false : raw !== false;
          const duration = typeof raw === "object" && typeof raw.duration === "number" ? raw.duration : def.defaultDuration;
          const hasSound = typeof raw === "object" ? Boolean(raw.sound) : false;

          return (
            <SettingsRow
              key={def.key}
              id={def.key}
              highlight={highlightedRow === def.key}
              icon={def.icon}
              label={def.label}
              description={def.desc}
              isLast={idx === alertDefinitions.length - 1}
              control={
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Sound icon toggle button */}
                  <button
                    type="button"
                    title={hasSound ? "Sound chime enabled" : "Muted (silent)"}
                    aria-label={`Toggle sound for ${def.label}`}
                    onClick={() => updateTypeProperty(def.key, "sound", !hasSound)}
                    style={{
                      background: hasSound ? "rgba(10, 132, 255, 0.2)" : "rgba(255, 255, 255, 0.08)",
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 8px",
                      color: hasSound ? "#64d2ff" : "rgba(255, 255, 255, 0.4)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {hasSound ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </button>

                  {/* Duration stepper */}
                  <Stepper
                    min={1}
                    max={12}
                    unit="s"
                    value={duration}
                    onChange={(val) => updateTypeProperty(def.key, "duration", val)}
                  />

                  {/* Toggle switch (51x31) */}
                  <ToggleSwitch
                    checked={isEnabled}
                    onChange={(val) => updateTypeProperty(def.key, "enabled", val)}
                  />
                </div>
              }
            />
          );
        })}
      </SettingsCard>
    </div>
  );
}
