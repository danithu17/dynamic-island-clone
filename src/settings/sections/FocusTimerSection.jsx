import React from "react";
import {
  SettingsCard,
  SettingsRow,
  SliderWithValue,
  ToggleSwitch,
} from "../components/SettingsUI";
import { Timer, BellOff, Play, VolumeX, Moon } from "lucide-react";

export default function FocusTimerSection({ settings = {}, onUpdate, highlightedRow }) {
  const ft = settings.focusTimer || {};

  return (
    <div>
      <SettingsCard title="Pomodoro Intervals" description="Custom work and break intervals for the Island focus timer">
        <SettingsRow
          id="pomodoroLength"
          highlight={highlightedRow === "pomodoroLength"}
          icon={<Timer size={16} />}
          label="Focus Work Duration"
          description="Length of standard focused sprint (10 - 60 minutes)"
          control={
            <SliderWithValue
              min={10}
              max={60}
              step={5}
              unit="min"
              value={ft.pomodoroLength || 25}
              onChange={(val) => onUpdate("focusTimer.pomodoroLength", val)}
            />
          }
        />
        <SettingsRow
          id="shortBreak"
          highlight={highlightedRow === "shortBreak"}
          label="Short Break Duration"
          description="Rest time after each standard interval (2 - 15 minutes)"
          control={
            <SliderWithValue
              min={2}
              max={15}
              step={1}
              unit="min"
              value={ft.shortBreak || 5}
              onChange={(val) => onUpdate("focusTimer.shortBreak", val)}
            />
          }
        />
        <SettingsRow
          id="longBreak"
          highlight={highlightedRow === "longBreak"}
          label="Long Break Duration"
          description="Extended rest time every 4 completed sprints"
          control={
            <SliderWithValue
              min={10}
              max={30}
              step={5}
              unit="min"
              value={ft.longBreak || 15}
              onChange={(val) => onUpdate("focusTimer.longBreak", val)}
            />
          }
        />
        <SettingsRow
          id="autoStartBreaks"
          highlight={highlightedRow === "autoStartBreaks"}
          icon={<Play size={16} />}
          label="Auto-Start Breaks"
          description="Start break countdowns automatically when sprint completes"
          isLast
          control={
            <ToggleSwitch
              checked={Boolean(ft.autoStartBreaks)}
              onChange={(val) => onUpdate("focusTimer.autoStartBreaks", val)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Focus Mode Silencing" description="Select which system distractions are suppressed during focus sessions">
        <SettingsRow
          id="silenceNotifications"
          highlight={highlightedRow === "silenceNotifications"}
          icon={<BellOff size={16} />}
          label="Silence Non-Critical Alerts"
          description="Mute system popups and alerts while focus timer is active"
          control={
            <ToggleSwitch
              checked={ft.silenceNotifications !== false}
              onChange={(val) => onUpdate("focusTimer.silenceNotifications", val)}
            />
          }
        />
        <SettingsRow
          id="muteAudioChimes"
          icon={<VolumeX size={16} />}
          label="Mute Audio Notification Chimes"
          description="Suppress sound effects until focus sprint finishes"
          control={
            <ToggleSwitch
              checked={ft.muteChimes !== false}
              onChange={(val) => onUpdate("focusTimer.muteChimes", val)}
            />
          }
        />
        <SettingsRow
          id="enableWindowsDnd"
          icon={<Moon size={16} />}
          label="Sync Windows Focus Assist"
          description="Trigger Windows native Do Not Disturb mode during focus sprints"
          isLast
          control={
            <ToggleSwitch
              checked={Boolean(ft.syncWindowsDnd)}
              onChange={(val) => onUpdate("focusTimer.syncWindowsDnd", val)}
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
