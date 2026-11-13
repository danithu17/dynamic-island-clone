import React, { useState, useEffect, useMemo, useRef } from "react";
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
  LayoutGrid,
  Clipboard,
  Folder,
  FileText,
  Timer,
  RefreshCw,
  Wrench,
  Check,
} from "lucide-react";

import { InlineConfirmSheet } from "./components/SettingsUI";
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

import HomeDockSection from "./sections/HomeDockSection";
import ClipboardSection from "./sections/ClipboardSection";
import TraySection from "./sections/TraySection";
import NotesSnippetsSection from "./sections/NotesSnippetsSection";
import FocusTimerSection from "./sections/FocusTimerSection";
import UpdatesSection from "./sections/UpdatesSection";
import AdvancedSection from "./sections/AdvancedSection";

import { getTranslation } from "../locales/translations";

const SECTIONS = [
  // Group 1: Core System
  { id: "general", label: "General", icon: Sliders, iconBg: "#0a84ff", group: "System", description: "System startup, display name, language, and monitors" },
  { id: "island", label: "Island", icon: Sparkles, iconBg: "#ff9f0a", group: "System", description: "Notch or floating style, idle size, hover and collapse delays, mascot eyes" },
  { id: "appearance", label: "Appearance", icon: Palette, iconBg: "#bf5af2", group: "System", description: "Theme modes, accent colors, text scaling, and typography" },

  // Group 2: Productivity & Widgets
  { id: "alerts", label: "Alerts", icon: Bell, iconBg: "#ff375f", group: "Widgets", description: "Per-type notification tuning, durations, sounds, and DND schedule" },
  { id: "homeDock", label: "Home & Dock", icon: LayoutGrid, iconBg: "#30d158", group: "Widgets", description: "Home status chips, dock tab order, and quick launcher apps" },
  { id: "focusTimer", label: "Focus & Timer", icon: Timer, iconBg: "#ff453a", group: "Widgets", description: "Pomodoro durations, breaks, and distraction muting" },
  { id: "clipboard", label: "Clipboard", icon: Clipboard, iconBg: "#64d2ff", group: "Widgets", description: "Clipboard history ring buffer, size limits, and password manager filters" },
  { id: "tray", label: "Tray Storage", icon: Folder, iconBg: "#ffd60a", group: "Widgets", description: "File staging shelf, drop modes, and auto-cleanup" },
  { id: "notesSnippets", label: "Notes & Snippets", icon: FileText, iconBg: "#32d74b", group: "Widgets", description: "Scratchpad storage, template variables, and markdown export" },

  // Group 3: App Integration & Privacy
  { id: "accounts", label: "Accounts", icon: UserCheck, iconBg: "#0a84ff", group: "Integration", description: "Google Gmail, Calendar, and AI assistant provider integration" },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard, iconBg: "#5e5ce6", group: "Integration", description: "Global hotkeys and conflict detection" },
  { id: "dataPrivacy", label: "Privacy", icon: Shield, iconBg: "#30d158", group: "Integration", description: "Permissions, local-only data statement, and data erasure" },

  // Group 4: Menu Bar & Profiles
  { id: "menuBar", label: "Menu Bar", icon: Layout, iconBg: "#5e5ce6", group: "Bar & Profiles", description: "AppBar work area mode, height, background, and items" },
  { id: "features", label: "Features", icon: Grid, iconBg: "#0a84ff", group: "Bar & Profiles", description: "Focus timer, clipboard history, quick notes, and shelf" },
  { id: "menuProfiles", label: "Menu Profiles", icon: FileCode, iconBg: "#ff9f0a", group: "Bar & Profiles", description: "Per-app menu profiles and keyboard actions" },

  // Group 5: Maintenance
  { id: "updates", label: "Updates", icon: RefreshCw, iconBg: "#0a84ff", group: "Maintenance", description: "Software release channels, check frequency, and release notes" },
  { id: "advanced", label: "Advanced", icon: Wrench, iconBg: "#8e8e93", group: "Maintenance", description: "Diagnostics export, local folder links, and factory reset" },
  { id: "about", label: "About", icon: Info, iconBg: "#8e8e93", group: "Maintenance", description: "Version information, open-source credits, and dependency licenses" },
];

const SEARCH_INDEX = [
  { section: "general", rowId: "displayName", label: "Display Name", desc: "The name Aura Island greets you with", keywords: "name greeting user display identity" },
  { section: "general", rowId: "language", label: "Language", desc: "Change application interface language (English, Sinhala, Tamil)", keywords: "language english sinhala tamil localization translation" },
  { section: "general", rowId: "startWithWindows", label: "Launch on Windows Startup", desc: "Auto-start Aura Island on boot", keywords: "start startup boot launch windows autostart" },
  { section: "general", rowId: "checkHotkey", label: "Settings Hotkey", desc: "Global hotkey to open settings window", keywords: "settings shortcut hotkey ctrl+alt+," },
  { section: "general", rowId: "monitor", label: "Display Monitor", desc: "Monitor where the island is displayed", keywords: "monitor display screen primary secondary" },

  { section: "island", rowId: "style", label: "Island Style", desc: "Choose between seamless bezel Notch and Floating pill", keywords: "style notch floating shape geometry" },
  { section: "island", rowId: "idleSize", label: "Idle Notch Size", desc: "Compact, minimal, or hidden resting dimensions", keywords: "notch idle size pill compact minimal hidden" },
  { section: "island", rowId: "hoverDelay", label: "Hover Expansion Delay", desc: "Delay in ms before expanding on hover", keywords: "hover expand delay mouse sensitivity" },
  { section: "island", rowId: "collapseDelay", label: "Collapse Delay", desc: "Delay before receding back to resting pill", keywords: "collapse delay mouse leave close" },
  { section: "island", rowId: "animationSpeed", label: "Animation Speed", desc: "Transition curves: Gentle, Normal, Fast", keywords: "speed animation motion fast gentle physics" },
  { section: "island", rowId: "reduceMotion", label: "Reduce Motion", desc: "Minimize bouncy physics and spring transitions", keywords: "reduce motion accessibility animations" },
  { section: "island", rowId: "autoHideFullscreen", label: "Auto-hide in Fullscreen", desc: "Conceal island during gaming and videos", keywords: "fullscreen hide conceal video game" },
  { section: "island", rowId: "mascotEyes", label: "Mascot Eyes", desc: "Interactive blinking eyes inside the idle pill", keywords: "mascot eyes cute face blink avatar" },

  { section: "appearance", rowId: "theme", label: "Interface Theme", desc: "Dark, match system, and light appearance", keywords: "theme dark light auto appearance" },
  { section: "appearance", rowId: "accentColor", label: "Accent Color", desc: "Highlight color for chips and active buttons", keywords: "color accent blue green red purple orange" },
  { section: "appearance", rowId: "textSize", label: "Text Size", desc: "Adjust typography scaling across the island", keywords: "text size scale font small medium large" },
  { section: "appearance", rowId: "largeClock", label: "Large Clock on Home", desc: "Expanded digital clock on the Home view", keywords: "clock large time digital home" },
  { section: "appearance", rowId: "font", label: "Typography Font", desc: "Segoe UI Variable, Inter, System UI", keywords: "font typography cleartype text" },

  { section: "alerts", rowId: "alertsMaster", label: "Smart Alerts Master Switch", desc: "Live notification pill animations", keywords: "alerts notifications smart enable disable" },
  { section: "alerts", rowId: "alertsDuration", label: "Notification Duration", desc: "Seconds alerts remain expanded", keywords: "duration seconds time alert" },
  { section: "alerts", rowId: "charging", label: "Battery & Charging Alerts", desc: "Charging plugged in and low battery warnings", keywords: "battery charging power 20% 10%" },
  { section: "alerts", rowId: "screenshots", label: "Screenshots Alerts", desc: "Preview thumbnail when a screenshot is captured", keywords: "screenshot snip capture thumbnail" },
  { section: "alerts", rowId: "downloads", label: "Downloads Completion", desc: "Browser downloads finished alert", keywords: "downloads files completed" },
  { section: "alerts", rowId: "timer", label: "Timer & Stopwatch Alerts", desc: "Countdown alerts and alarm chimes", keywords: "timer countdown alarm chime" },
  { section: "alerts", rowId: "dndEnabled", label: "Do Not Disturb Schedule", desc: "Silence non-critical alerts during scheduled hours", keywords: "dnd do not disturb silence sleep night hours" },

  { section: "homeDock", rowId: "homeChips", label: "Home Status Chips", desc: "Choose up to 4 quick chips on Home status row", keywords: "home chips weather media calendar battery" },
  { section: "homeDock", rowId: "dockTabs", label: "Dock Tabs Order", desc: "Reorder the 5 persistent feature tabs", keywords: "dock tabs reorder order icons" },

  { section: "clipboard", rowId: "clipboardEnabled", label: "Clipboard History", desc: "Saved text snippets tracker", keywords: "clipboard copy paste history buffer" },
  { section: "clipboard", rowId: "secretFilter", label: "Ignore Password Managers", desc: "Skip sensitive clips from 1Password, Bitwarden", keywords: "secret password filter 1password bitwarden" },

  { section: "tray", rowId: "trayDropMode", label: "Tray Storage Mode", desc: "Copy, move, or link files in the shelf", keywords: "tray shelf files drag drop copy move link" },
  { section: "tray", rowId: "clearUnpinned", label: "Clear Unpinned Files", desc: "Remove temporary staged files from shelf", keywords: "clear unpinned shelf clean" },

  { section: "dataPrivacy", rowId: "deleteData", label: "Delete All My Data", desc: "Erase clipboard, notes, shelf, and settings", keywords: "delete clear wipe erase privacy reset data" },

  { section: "updates", rowId: "autoCheck", label: "Automatic Update Checks", desc: "Check for new releases in background", keywords: "update auto release version upgrade" },
  { section: "updates", rowId: "channel", label: "Release Channel", desc: "Stable or Beta preview channel", keywords: "channel stable beta release" },

  { section: "advanced", rowId: "openDataFolder", label: "Open App Data Folder", desc: "View settings and logs in Explorer", keywords: "folder data appdata logs explorer" },
  { section: "advanced", rowId: "resetAll", label: "Reset All Settings", desc: "Restore factory default preferences", keywords: "reset factory defaults settings" },

  { section: "about", rowId: "about", label: "About Aura Island & Credits", desc: "License, version, and author acknowledgment", keywords: "about credits author abrar nabil mit license" },
];

export default function SettingsApp() {
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    // Initial fetch of settings
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
    // Deep link navigation
    if (window.electronAPI?.onNavigateSection) {
      const unsub = window.electronAPI.onNavigateSection((sec) => {
        if (sec && SECTIONS.some((s) => s.id === sec)) {
          setActiveSection(sec);
        }
      });
      return () => unsub?.();
    }
  }, []);

  // Live update handler (instant apply over IPC, clamped ranges, no save button)
  const handleUpdate = (keyPath, value) => {
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

  const handleResetSection = (sectionId = activeSection) => {
    if (window.electronAPI?.resetSection) {
      window.electronAPI.resetSection(sectionId).then(() => {
        if (window.electronAPI?.getSettings) {
          window.electronAPI.getSettings().then((s) => {
            if (s) setSettings(s);
          });
        }
      });
    }
    setIsResetConfirmOpen(false);
  };

  const handleResetAll = () => {
    if (window.electronAPI?.resetAllSettings) {
      window.electronAPI.resetAllSettings().then(() => {
        if (window.electronAPI?.getSettings) {
          window.electronAPI.getSettings().then((s) => {
            if (s) setSettings(s);
          });
        }
      });
    }
    setIsResetConfirmOpen(false);
  };

  // Filtered search results
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

  const handleSelectSearchResult = (res) => {
    setActiveSection(res.section);
    setSearchQuery("");
    setHighlightedRow(res.rowId);

    setTimeout(() => {
      const el = document.getElementById(`row-${res.rowId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);

    setTimeout(() => {
      setHighlightedRow(null);
    }, 1800);
  };

  const currentSectionMeta = SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];

  // Group sections for sidebar
  const groupedSections = useMemo(() => {
    const groups = {};
    for (const sec of SECTIONS) {
      const g = sec.group || "Other";
      if (!groups[g]) groups[g] = [];
      groups[g].push(sec);
    }
    return groups;
  }, []);

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#16171b",
        color: "#ffffff",
        fontFamily: designTokens.typography.fontFamily,
        userSelect: "none",
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* 240px Left Sidebar */}
      <aside
        style={{
          width: 240,
          minWidth: 240,
          maxWidth: 240,
          height: "100%",
          backgroundColor: "#1c1c1f",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* Search Field at top */}
        <div style={{ padding: "14px 12px 10px 12px", position: "relative" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: 8,
              padding: "6px 8px 6px 10px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <Search size={14} style={{ color: "rgba(255, 255, 255, 0.45)", flexShrink: 0, marginRight: 8 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search Settings"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#ffffff",
                fontSize: 12.5,
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchQuery && (
            <div
              style={{
                position: "absolute",
                top: 48,
                left: 12,
                right: 12,
                backgroundColor: "#252528",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                borderRadius: 10,
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.6)",
                zIndex: 1000,
                maxHeight: 280,
                overflowY: "auto",
                padding: 4,
              }}
            >
              {searchResults.length === 0 ? (
                <div style={{ padding: "12px", fontSize: 12, color: "rgba(255, 255, 255, 0.45)", textAlign: "center" }}>
                  No matching settings found
                </div>
              ) : (
                searchResults.map((res, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      padding: "8px 10px",
                      borderRadius: 6,
                      color: "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{res.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)" }}>{res.desc}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Grouped Pages List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 16px 8px" }}>
          {Object.entries(groupedSections).map(([groupName, items]) => (
            <div key={groupName} style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "rgba(255, 255, 255, 0.38)",
                  padding: "4px 10px 6px 10px",
                }}
              >
                {groupName}
              </div>

              {items.map((sec) => {
                const isSelected = sec.id === activeSection;
                const IconComponent = sec.icon;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "none",
                      background: isSelected ? "rgba(10, 132, 255, 0.28)" : "transparent",
                      color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.8)",
                      cursor: "pointer",
                      textAlign: "left",
                      outline: "none",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {/* Colored rounded-square icon */}
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        backgroundColor: sec.iconBg || "#0a84ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.3)",
                        flexShrink: 0,
                      }}
                    >
                      <IconComponent size={15} />
                    </div>
                    {/* 15px title */}
                    <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 500 }}>
                      {sec.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Right Content Pane */}
      <main
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#16171b",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Header: 28px/700 font title + Reset Page button */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 32px 14px 32px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.4px",
              }}
            >
              {currentSectionMeta.label}
            </h1>
            <div style={{ fontSize: 12.5, color: "rgba(255, 255, 255, 0.5)", marginTop: 4 }}>
              {currentSectionMeta.description}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 20,
              padding: "6px 14px",
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)")}
          >
            <RotateCcw size={13} />
            <span>Reset this page</span>
          </button>
        </header>

        {/* Page Content scroll container */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px 40px 32px" }}>
          {activeSection === "general" && (
            <GeneralSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "island" && (
            <IslandSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "appearance" && (
            <AppearanceSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "alerts" && (
            <AlertsSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "homeDock" && (
            <HomeDockSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "clipboard" && (
            <ClipboardSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "tray" && (
            <TraySection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "notesSnippets" && (
            <NotesSnippetsSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "accounts" && (
            <AccountsSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "focusTimer" && (
            <FocusTimerSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "shortcuts" && (
            <ShortcutsSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "dataPrivacy" && (
            <DataPrivacySection settings={settings} onResetAll={handleResetAll} highlightedRow={highlightedRow} />
          )}
          {activeSection === "menuBar" && (
            <MenuBarSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "features" && (
            <FeaturesSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "menuProfiles" && (
            <MenuProfilesSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "updates" && (
            <UpdatesSection settings={settings} onUpdate={handleUpdate} highlightedRow={highlightedRow} />
          )}
          {activeSection === "advanced" && (
            <AdvancedSection settings={settings} onResetAll={handleResetAll} highlightedRow={highlightedRow} />
          )}
          {activeSection === "about" && (
            <AboutSection settings={settings} highlightedRow={highlightedRow} />
          )}
        </div>
      </main>

      {/* Slide-Up Confirm Sheet for Reset this page */}
      <InlineConfirmSheet
        isOpen={isResetConfirmOpen}
        title={`Reset ${currentSectionMeta.label} Settings?`}
        message={`Are you sure you want to restore all settings on the "${currentSectionMeta.label}" page to their factory defaults?`}
        confirmLabel="Reset to Defaults"
        cancelLabel="Cancel"
        isDanger
        onConfirm={() => handleResetSection(activeSection)}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}
