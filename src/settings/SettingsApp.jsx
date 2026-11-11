import React, { useState, useEffect, useMemo } from "react";
import designTokens from "../styles/designTokens";
import {
  Sliders,
  Palette,
  Layout,
  Sparkles,
  Bell,
  Keyboard,
  Grid,
  FileCode,
  UserCheck,
  Shield,
  Info,
  Search,
  X,
  RotateCcw,
} from "lucide-react";

import GeneralSection from "./sections/GeneralSection";
import AppearanceSection from "./sections/AppearanceSection";
import MenuBarSection from "./sections/MenuBarSection";
import IslandSection from "./sections/IslandSection";
import AlertsSection from "./sections/AlertsSection";
import ShortcutsSection from "./sections/ShortcutsSection";
import FeaturesSection from "./sections/FeaturesSection";
import MenuProfilesSection from "./sections/MenuProfilesSection";
import AccountsSection from "./sections/AccountsSection";
import DataPrivacySection from "./sections/DataPrivacySection";
import AboutSection from "./sections/AboutSection";

const SECTIONS = [
  { id: "general", label: "General", icon: Sliders, description: "System startup, language, and software updates" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme modes, accent colors, and typography" },
  { id: "menuBar", label: "Menu Bar", icon: Layout, description: "AppBar work area mode, height, background, and items" },
  { id: "island", label: "Island", icon: Sparkles, description: "Idle notch dimensions, hover sensitivity, and animations" },
  { id: "alerts", label: "Alerts", icon: Bell, description: "Smart alerts, duration, sounds, and event filters" },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard, description: "Global hotkeys and conflict detection" },
  { id: "features", label: "Features", icon: Grid, description: "Focus timer, clipboard history, quick notes, and shelf" },
  { id: "menuProfiles", label: "Menu Profiles", icon: FileCode, description: "Per-app menu profiles and keyboard actions" },
  { id: "accounts", label: "Accounts", icon: UserCheck, description: "Gmail, Google Calendar, and GitHub integrations" },
  { id: "dataPrivacy", label: "Data & Privacy", icon: Shield, description: "Cache clearance, settings backup, and reset" },
  { id: "about", label: "About & Credits", icon: Info, description: "Software license, open-source credits, and author notice" },
];

const SEARCH_INDEX = [
  { section: "general", label: "Launch on Windows Startup", desc: "Auto-start Aura Island on boot", keywords: "start startup boot launch windows" },
  { section: "general", label: "Language", desc: "Change application interface language", keywords: "language english spanish german french" },
  { section: "general", label: "Check for Updates", desc: "Software version and updater checks", keywords: "update upgrade version release" },
  { section: "appearance", label: "Interface Theme", desc: "Dark, light, and automatic system theme", keywords: "theme dark light auto appearance" },
  { section: "appearance", label: "Accent Color", desc: "Highlight color for chips and active buttons", keywords: "color accent blue green red purple" },
  { section: "appearance", label: "Typography Font", desc: "Segoe UI Variable, Inter, System UI", keywords: "font typography cleartype text" },
  { section: "menuBar", label: "Display Mode (Reserved Strip)", desc: "Constrain maximized applications below the bar", keywords: "reserved overlay autohide mode position workarea" },
  { section: "menuBar", label: "Strip Height", desc: "Height in pixels reserved at the top of the monitor", keywords: "height strip thickness size pixels" },
  { section: "menuBar", label: "Bar Background Style", desc: "Acrylic blur, solid black, or dark gray", keywords: "background acrylic blur black dark mica" },
  { section: "menuBar", label: "Menu Bar Items", desc: "Active app, launcher, shelf, notes, clipboard, battery, volume", keywords: "items icons activeapp launcher shelf notes clipboard battery volume wifi bluetooth clock" },
  { section: "island", label: "Idle Notch Size", desc: "Compact, minimal, or hidden notch dimensions", keywords: "notch idle size pill compact minimal hidden" },
  { section: "island", label: "Hover Expansion", desc: "Expand island on mouse hover sensitivity", keywords: "hover expand delay mouse" },
  { section: "island", label: "Spring Animations", desc: "Fluid motion physics for alerts and media", keywords: "animations spring motion physics smooth" },
  { section: "alerts", label: "Smart Alerts Master Switch", desc: "Live notification pill animations", keywords: "alerts notifications smart enable disable" },
  { section: "alerts", label: "Notification Duration", desc: "Seconds alerts remain expanded", keywords: "duration seconds time alert" },
  { section: "alerts", label: "Battery & Power Alerts", desc: "Charging and low battery warnings", keywords: "battery charging power 20% 10%" },
  { section: "alerts", label: "Downloads Completion", desc: "Browser downloads finished alert", keywords: "downloads files completed" },
  { section: "shortcuts", label: "Open Settings Hotkey", desc: "Global hotkey to open settings window", keywords: "settings shortcut hotkey ctrl+," },
  { section: "shortcuts", label: "Focus First Menu Hotkey", desc: "Hotkey to focus the left app menu", keywords: "menu hotkey alt+f first menu" },
  { section: "features", label: "Focus Timer", desc: "Pomodoro countdown presets", keywords: "timer pomodoro focus countdown" },
  { section: "features", label: "Clipboard History", desc: "Saved text snippets tracker", keywords: "clipboard copy paste history" },
  { section: "features", label: "Shelf File Staging", desc: "Drag-drop staging tray", keywords: "shelf files drag drop staging" },
  { section: "features", label: "Quick Notes", desc: "Instant scratchpad text editor", keywords: "notes scratchpad text editor" },
  { section: "features", label: "Per-App Menus", desc: "Foreground app menu bar mirror", keywords: "per-app menus uia profile file edit" },
  { section: "menuProfiles", label: "Per-App Menu Profiles JSON Editor", desc: "Customize shortcut actions for Chrome, VS Code, etc.", keywords: "profiles json editor chrome vs code notepad explorer" },
  { section: "accounts", label: "Gmail Integration", desc: "Connect Google Mail for live updates", keywords: "gmail google email account" },
  { section: "accounts", label: "Google Calendar", desc: "Connect Google Calendar for meeting alerts", keywords: "calendar google meetings events schedule" },
  { section: "accounts", label: "GitHub Integration", desc: "Connect GitHub for PR and mention notifications", keywords: "github pr issues pull requests" },
  { section: "dataPrivacy", label: "Clear Local Storage", desc: "Erase shelf files, clipboard history, or notes", keywords: "clear erase reset shelf clipboard notes data" },
  { section: "dataPrivacy", label: "Export & Import Settings", desc: "Backup or restore configuration JSON", keywords: "export import backup restore settings json" },
  { section: "about", label: "About Aura Island & Credits", desc: "License and author acknowledgment", keywords: "about credits author abrar nabil mit license" },
];

export default function SettingsApp() {
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Initial fetch of full settings schema
    if (window.electronAPI?.getSettings) {
      window.electronAPI.getSettings().then((s) => {
        if (s) setSettings(s);
      });
    }

    // Subscribe to live settings changes
    if (window.electronAPI?.onSettingsChanged) {
      const unsub = window.electronAPI.onSettingsChanged((data) => {
        if (data?.settings) setSettings(data.settings);
      });
      return () => unsub?.();
    }
  }, []);

  useEffect(() => {
    // Listen for deep link section navigation
    if (window.electronAPI?.onNavigateSection) {
      const unsub = window.electronAPI.onNavigateSection((sec) => {
        if (sec && SECTIONS.some((s) => s.id === sec)) {
          setActiveSection(sec);
        }
      });
      return () => unsub?.();
    }
  }, []);

  // Update setting live via IPC (no save button required)
  const handleUpdate = (keyPath, value) => {
    // Optimistic local state update
    setSettings((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = keyPath.split(".");
      let curr = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]]) curr[parts[i]] = {};
        curr = curr[parts[i]];
      }
      curr[parts[parts.length - 1]] = value;
      return copy;
    });

    if (window.electronAPI?.setSetting) {
      window.electronAPI.setSetting(keyPath, value);
    }
  };

  const handleResetSection = () => {
    if (window.confirm(`Reset all settings in "${currentSectionMeta.label}" to defaults?`)) {
      if (window.electronAPI?.resetSection) {
        window.electronAPI.resetSection(activeSection).then(() => {
          if (window.electronAPI?.getSettings) {
            window.electronAPI.getSettings().then((s) => {
              if (s) setSettings(s);
            });
          }
        });
      }
    }
  };

  const handleResetAll = () => {
    if (window.confirm("Are you sure you want to reset ALL settings to factory defaults?")) {
      if (window.electronAPI?.resetAllSettings) {
        window.electronAPI.resetAllSettings().then(() => {
          if (window.electronAPI?.getSettings) {
            window.electronAPI.getSettings().then((s) => {
              if (s) setSettings(s);
            });
          }
        });
      }
    }
  };

  // Search filtering logic
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_INDEX.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const currentSectionMeta = useMemo(() => {
    return SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];
  }, [activeSection]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSection settings={settings} onUpdate={handleUpdate} />;
      case "appearance":
        return <AppearanceSection settings={settings} onUpdate={handleUpdate} />;
      case "menuBar":
        return <MenuBarSection settings={settings} onUpdate={handleUpdate} />;
      case "island":
        return <IslandSection settings={settings} onUpdate={handleUpdate} />;
      case "alerts":
        return <AlertsSection settings={settings} onUpdate={handleUpdate} />;
      case "shortcuts":
        return <ShortcutsSection settings={settings} onUpdate={handleUpdate} />;
      case "features":
        return <FeaturesSection settings={settings} onUpdate={handleUpdate} />;
      case "menuProfiles":
        return <MenuProfilesSection />;
      case "accounts":
        return <AccountsSection settings={settings} onUpdate={handleUpdate} />;
      case "dataPrivacy":
        return <DataPrivacySection settings={settings} onResetAll={handleResetAll} />;
      case "about":
        return <AboutSection />;
      default:
        return <GeneralSection settings={settings} onUpdate={handleUpdate} />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background: "#16171b",
        color: "#f1f3f5",
        fontFamily: designTokens.typography.fontFamily,
        boxSizing: "border-box",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* LEFT NAVIGATION SIDEBAR */}
      <div
        style={{
          width: 250,
          background: "rgba(22, 23, 27, 0.95)",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          boxSizing: "border-box",
        }}
      >
        {/* App Title Header */}
        <div
          style={{
            padding: "16px 18px 12px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: "linear-gradient(135deg, #0a84ff 0%, #5e5ce6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={14} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px" }}>Aura Island</div>
            <div style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.45)" }}>System Settings</div>
          </div>
        </div>

        {/* Search Input Box */}
        <div style={{ padding: "12px 14px 8px 14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 8,
              padding: "6px 10px",
              boxSizing: "border-box",
            }}
          >
            <Search size={14} color="rgba(255, 255, 255, 0.45)" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: 12,
                width: "100%",
                fontFamily: "inherit",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255, 255, 255, 0.5)",
                  padding: 0,
                  display: "flex",
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Section List / Search Results */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "6px 8px",
            scrollbarWidth: "none",
          }}
        >
          {searchQuery ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255, 255, 255, 0.4)", padding: "4px 8px" }}>
                SEARCH RESULTS ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div style={{ padding: "12px 8px", fontSize: 12, color: "rgba(255, 255, 255, 0.4)" }}>
                  No settings found matching "{searchQuery}"
                </div>
              ) : (
                searchResults.map((res, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setActiveSection(res.section);
                      setSearchQuery("");
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.04)",
                      marginBottom: 4,
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(10, 132, 255, 0.18)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)")}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>{res.label}</div>
                    <div style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.45)" }}>{res.desc}</div>
                  </div>
                ))
              )}
            </div>
          ) : (
            SECTIONS.map((sec) => {
              const IconComponent = sec.icon;
              const isSelected = activeSection === sec.id;
              return (
                <div
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: 8,
                    marginBottom: 2,
                    cursor: "pointer",
                    background: isSelected ? "rgba(10, 132, 255, 0.20)" : "transparent",
                    color: isSelected ? "#0a84ff" : "rgba(255, 255, 255, 0.75)",
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: 12.5,
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <IconComponent size={15} color={isSelected ? "#0a84ff" : "rgba(255, 255, 255, 0.6)"} />
                  <span>{sec.label}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT CONTENT PANE */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "#16171b",
          boxSizing: "border-box",
        }}
      >
        {/* Content Header Banner */}
        <div
          style={{
            padding: "20px 28px 16px 28px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.3px" }}>
              {currentSectionMeta.label}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.5)", marginTop: 2 }}>
              {currentSectionMeta.description}
            </div>
          </div>

          {activeSection !== "about" && (
            <button
              type="button"
              onClick={handleResetSection}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.10)",
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)")}
            >
              <RotateCcw size={12} />
              <span>Reset section</span>
            </button>
          )}
        </div>

        {/* Section View Container */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 28px 40px 28px",
            boxSizing: "border-box",
          }}
        >
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
}
