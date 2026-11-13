import React from "react";
import { SettingsCard, SettingsRow, HotkeyRecorder } from "../components/SettingsUI";
import { Keyboard, AlertCircle } from "lucide-react";

export default function ShortcutsSection({ settings = {}, onUpdate, highlightedRow }) {
  const sc = settings.shortcuts || {};

  const hotkeyList = [
    { id: "openSettings", label: "Open Settings App", defaultVal: "Ctrl+Alt+,", desc: "Opens or focuses the macOS-style settings window" },
    { id: "toggleIsland", label: "Toggle Island & Dock", defaultVal: "Ctrl+Shift+Space", desc: "Wakes the island and expands the dashboard" },
    { id: "firstMenu", label: "Focus First Menu", defaultVal: "Alt+F", desc: "Triggers the active application menu bar dropdown" },
    { id: "quickNote", label: "Quick Scratchpad Note", defaultVal: "Ctrl+Alt+N", desc: "Opens scratchpad note editor inside the island" },
    { id: "clipboardHistory", label: "Clipboard Ring History", defaultVal: "Ctrl+Alt+V", desc: "Opens clipboard snippet picker drawer" },
    { id: "takeScreenshot", label: "Take Screenshot Snip", defaultVal: "Ctrl+Shift+S", desc: "Captures screen region and creates island alert" },
  ];

  // Collect all assigned values to pass conflicts to the recorder
  const assigned = Object.values(sc).filter(Boolean);

  return (
    <div>
      <SettingsCard
        title="Global Keyboard Hotkeys"
        description="Press keyboard combinations anywhere in Windows to trigger Aura Island actions"
      >
        {hotkeyList.map((item, idx) => {
          const val = sc[item.id] || item.defaultVal;
          return (
            <SettingsRow
              key={item.id}
              id={item.id}
              highlight={highlightedRow === item.id}
              icon={<Keyboard size={16} />}
              label={item.label}
              description={item.desc}
              isLast={idx === hotkeyList.length - 1}
              control={
                <HotkeyRecorder
                  value={val}
                  conflicts={assigned}
                  onChange={(newChord) => onUpdate(`shortcuts.${item.id}`, newChord)}
                />
              }
            />
          );
        })}
      </SettingsCard>
    </div>
  );
}
