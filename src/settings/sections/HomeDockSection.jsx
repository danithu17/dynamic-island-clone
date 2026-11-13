import React, { useState } from "react";
import {
  SettingsCard,
  SettingsRow,
  ReorderableList,
  SettingsButton,
  TextField,
  SegmentedControl,
} from "../components/SettingsUI";
import {
  LayoutGrid,
  Grid,
  AppWindow,
  Plus,
  Trash2,
  Globe,
  Folder,
  Terminal,
  Check,
} from "lucide-react";

export default function HomeDockSection({ settings = {}, onUpdate, highlightedRow }) {
  const homeDock = settings.homeDock || {
    homeChips: ["weather", "media", "calendar", "battery"],
    dockTabs: ["apps", "media", "calendar", "stats", "notes"],
    quickLauncher: [
      { id: "chrome", name: "Chrome", type: "app", target: "chrome.exe" },
      { id: "code", name: "VS Code", type: "app", target: "code.exe" },
      { id: "terminal", name: "Terminal", type: "app", target: "wt.exe" },
      { id: "explorer", name: "Files", type: "app", target: "explorer.exe" },
    ],
  };

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("app");
  const [newTarget, setNewTarget] = useState("");

  const availableChips = [
    { id: "weather", label: "Weather" },
    { id: "media", label: "Now Playing" },
    { id: "calendar", label: "Calendar" },
    { id: "battery", label: "Battery" },
    { id: "stats", label: "System Hardware" },
    { id: "timer", label: "Focus Timer" },
  ];

  const handleChipsToggle = (chipId) => {
    const curr = homeDock.homeChips || [];
    let next;
    if (curr.includes(chipId)) {
      if (curr.length > 1) next = curr.filter((c) => c !== chipId);
      else return;
    } else {
      if (curr.length < 4) next = [...curr, chipId];
      else return;
    }
    onUpdate("homeDock.homeChips", next);
  };

  const handleDockReorder = (newTabs) => {
    onUpdate("homeDock.dockTabs", newTabs);
  };

  const handleAddLauncherItem = () => {
    if (!newName.trim() || !newTarget.trim()) return;
    const items = homeDock.quickLauncher || [];
    const item = {
      id: `custom_${Date.now()}`,
      name: newName.trim(),
      type: newType,
      target: newTarget.trim(),
    };
    onUpdate("homeDock.quickLauncher", [...items, item]);
    setNewName("");
    setNewTarget("");
  };

  const handleRemoveLauncherItem = (id) => {
    const items = (homeDock.quickLauncher || []).filter((item) => item.id !== id);
    onUpdate("homeDock.quickLauncher", items);
  };

  return (
    <div>
      {/* Home Status Row Chips */}
      <SettingsCard title="Home Status Chips" description="Choose up to 4 quick status chips to display on the idle and home status bar">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "8px 0" }}>
          {availableChips.map((chip) => {
            const isSelected = (homeDock.homeChips || []).includes(chip.id);
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChipsToggle(chip.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: isSelected ? "rgba(10, 132, 255, 0.22)" : "rgba(255, 255, 255, 0.05)",
                  border: isSelected ? "1px solid #0a84ff" : "1px solid rgba(255, 255, 255, 0.09)",
                  color: "#ffffff",
                  fontSize: 12.5,
                  fontWeight: isSelected ? 600 : 500,
                  cursor: "pointer",
                }}
              >
                <span>{chip.label}</span>
                {isSelected && <Check size={14} color="#0a84ff" />}
              </button>
            );
          })}
        </div>
      </SettingsCard>

      {/* Dock Tabs Order */}
      <SettingsCard title="Dock Navigation Tabs" description="Reorder the 5 persistent feature tabs inside the expanded island drawer">
        <div style={{ padding: "6px 0" }}>
          <ReorderableList
            items={(homeDock.dockTabs || ["apps", "media", "calendar", "stats", "notes"]).map((t) => ({
              id: t,
              name: t.charAt(0).toUpperCase() + t.slice(1),
            }))}
            onReorder={(items) => handleDockReorder(items.map((i) => i.id))}
          />
        </div>
      </SettingsCard>

      {/* Quick Launcher Manager */}
      <SettingsCard title="Quick Launcher" description="Add or remove applications, web sites, and folders launched from the island">
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "6px 0" }}>
          {(homeDock.quickLauncher || []).map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: 8,
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {item.type === "site" ? (
                  <Globe size={15} color="#0a84ff" />
                ) : item.type === "folder" ? (
                  <Folder size={15} color="#ffd60a" />
                ) : (
                  <AppWindow size={15} color="#30d158" />
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)" }}>{item.target}</div>
                </div>
              </div>
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                onClick={() => handleRemoveLauncherItem(item.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ff453a",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Add item row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <TextField
              value={newName}
              onChange={setNewName}
              placeholder="Name (e.g. GitHub)"
              width={120}
            />
            <SegmentedControl
              options={[
                { label: "App", value: "app" },
                { label: "Site", value: "site" },
                { label: "Folder", value: "folder" },
              ]}
              value={newType}
              onChange={setNewType}
            />
            <TextField
              value={newTarget}
              onChange={setNewTarget}
              placeholder={newType === "site" ? "https://..." : "path or exe"}
              width={160}
            />
            <SettingsButton
              variant="primary"
              icon={<Plus size={13} />}
              label="Add"
              onClick={handleAddLauncherItem}
            />
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
