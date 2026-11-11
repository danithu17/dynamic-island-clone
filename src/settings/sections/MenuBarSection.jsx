import React, { useState, useEffect } from "react";
import { SettingsCard, SettingsRow, ToggleSwitch, SegmentedControl } from "../components/SettingsUI";
import { Layout, Maximize2, Monitor, Layers, Eye } from "lucide-react";

export default function MenuBarSection({ settings, onUpdate }) {
  const mb = settings.menuBar || {};
  const items = mb.items || {};

  const [displays, setDisplays] = useState([]);

  useEffect(() => {
    if (window.electronAPI?.getDisplays) {
      window.electronAPI.getDisplays().then((d) => {
        if (Array.isArray(d)) setDisplays(d);
      });
    }
  }, []);

  const handleItemToggle = (key, val) => {
    onUpdate(`menuBar.items.${key}`, val);
  };

  return (
    <div>
      <SettingsCard title="Positioning & Work Area" description="Control how the menu bar reserves desktop space for Windows applications">
        <SettingsRow
          icon={<Layout size={16} />}
          label="Display Mode"
          description="Reserved mode restricts maximized apps directly below the bar with zero overlap"
          control={
            <SegmentedControl
              options={[
                { label: "Reserved", value: "reserved" },
                { label: "Overlay", value: "overlay" },
                { label: "Auto-hide", value: "autohide" },
              ]}
              value={mb.islandPosition || "reserved"}
              onChange={(val) => onUpdate("menuBar.islandPosition", val)}
            />
          }
        />

        <SettingsRow
          label={`Strip Height: ${mb.stripHeight || 34}px`}
          description="Physical height reserved at the top edge of your monitor"
          control={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="range"
                min={26}
                max={50}
                step={2}
                value={mb.stripHeight || 34}
                onChange={(e) => onUpdate("menuBar.stripHeight", parseInt(e.target.value, 10))}
                style={{ width: 130, cursor: "pointer", accentColor: "#0a84ff" }}
              />
              <span style={{ fontSize: 12, minWidth: 32, opacity: 0.8 }}>{mb.stripHeight || 34}px</span>
            </div>
          }
        />

        <SettingsRow
          icon={<Layers size={16} />}
          label="Bar Background Style"
          description="Visual material for the top menu bar surface"
          control={
            <SegmentedControl
              options={[
                { label: "Acrylic", value: "acrylic" },
                { label: "Solid Black", value: "black" },
                { label: "Dark Gray", value: "darkgray" },
              ]}
              value={mb.menuBarBackground || "acrylic"}
              onChange={(val) => onUpdate("menuBar.menuBarBackground", val)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Display & Fullscreen Behavior" description="Multi-monitor preferences and fullscreen application handling">
        <SettingsRow
          icon={<Monitor size={16} />}
          label="Target Displays"
          description={displays.length > 1 ? `${displays.length} displays detected` : "Display where the menu bar is rendered"}
          control={
            <SegmentedControl
              options={[
                { label: "Primary Only", value: "primary" },
                { label: "All Displays", value: "all" },
              ]}
              value={mb.displayScope || "primary"}
              onChange={(val) => onUpdate("menuBar.displayScope", val)}
            />
          }
        />

        <SettingsRow
          icon={<Maximize2 size={16} />}
          label="When an App Enters Fullscreen"
          description="How the bar responds when games or videos enter borderless fullscreen"
          control={
            <SegmentedControl
              options={[
                { label: "Hide Bar", value: "hide" },
                { label: "Collapse", value: "collapse" },
              ]}
              value={mb.fullscreenBehavior || "hide"}
              onChange={(val) => onUpdate("menuBar.fullscreenBehavior", val)}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Menu Bar Items" description="Toggle visibility for elements in the left and right zones">
        <SettingsRow
          icon={<Eye size={16} />}
          label="Active Application Name"
          description="Show active app title in the left zone of the bar"
          control={
            <ToggleSwitch
              checked={items.activeApp !== false}
              onChange={(val) => handleItemToggle("activeApp", val)}
            />
          }
        />
        <SettingsRow
          label="Per-App Menus"
          description="Mirror File, Edit, View menus for the active application"
          control={
            <ToggleSwitch
              checked={items.perAppMenus !== false}
              onChange={(val) => handleItemToggle("perAppMenus", val)}
            />
          }
        />
        <SettingsRow
          label="App Launcher"
          description="Quick launch menu for Calculator, Terminal, Task Manager, etc."
          control={
            <ToggleSwitch
              checked={items.launcher !== false}
              onChange={(val) => handleItemToggle("launcher", val)}
            />
          }
        />
        <SettingsRow
          label="Shelf Tray"
          description="Staging area for files, drag & drop, and downloads"
          control={
            <ToggleSwitch
              checked={items.shelf !== false}
              onChange={(val) => handleItemToggle("shelf", val)}
            />
          }
        />
        <SettingsRow
          label="Quick Notes"
          description="Floating scratchpad and instant note drawer"
          control={
            <ToggleSwitch
              checked={items.notes !== false}
              onChange={(val) => handleItemToggle("notes", val)}
            />
          }
        />
        <SettingsRow
          label="Clipboard History"
          description="One-click clipboard history dropdown with search"
          control={
            <ToggleSwitch
              checked={items.clipboard !== false}
              onChange={(val) => handleItemToggle("clipboard", val)}
            />
          }
        />
        <SettingsRow
          label="Live Status Chips"
          description="Active media playback chip and focus timer countdown"
          control={
            <ToggleSwitch
              checked={items.statusChips !== false}
              onChange={(val) => handleItemToggle("statusChips", val)}
            />
          }
        />
        <SettingsRow
          label="Battery Level"
          description="Battery percentage indicator and power state"
          control={
            <ToggleSwitch
              checked={items.battery !== false}
              onChange={(val) => handleItemToggle("battery", val)}
            />
          }
        />
        <SettingsRow
          label="Audio Volume Control"
          description="Sound slider and output device indicator"
          control={
            <ToggleSwitch
              checked={items.volume !== false}
              onChange={(val) => handleItemToggle("volume", val)}
            />
          }
        />
        <SettingsRow
          label="Wi-Fi Status"
          description="Wireless network connection toggle and SSID dropdown"
          control={
            <ToggleSwitch
              checked={items.wifi !== false}
              onChange={(val) => handleItemToggle("wifi", val)}
            />
          }
        />
        <SettingsRow
          label="Bluetooth Devices"
          description="Connected Bluetooth peripherals status"
          control={
            <ToggleSwitch
              checked={items.bluetooth !== false}
              onChange={(val) => handleItemToggle("bluetooth", val)}
            />
          }
        />
        <SettingsRow
          label="Clock & Calendar"
          description="Menu bar time display and monthly calendar popup"
          control={
            <ToggleSwitch
              checked={items.clock !== false}
              onChange={(val) => handleItemToggle("clock", val)}
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
