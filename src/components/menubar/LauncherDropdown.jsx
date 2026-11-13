import React, { useState } from "react";
import {
  Search,
  Calculator,
  Terminal,
  Folder,
  Activity,
  FileText,
  Settings,
  Globe,
  Camera,
  Lock,
} from "lucide-react";

export default function LauncherDropdown({ onClose }) {
  const [query, setQuery] = useState("");

  const apps = [
    { id: "calc", name: "Calculator", icon: <Calculator size={14} color="#ff9f0a" />, sub: "Standard Calculator" },
    { id: "terminal", name: "Terminal", icon: <Terminal size={14} color="#30d158" />, sub: "Windows Terminal / Command Prompt" },
    { id: "explorer", name: "File Explorer", icon: <Folder size={14} color="#0a84ff" />, sub: "Browse files & folders" },
    { id: "taskmgr", name: "Task Manager", icon: <Activity size={14} color="#ff453a" />, sub: "Processes & Performance" },
    { id: "notepad", name: "Notepad", icon: <FileText size={14} color="#64d2ff" />, sub: "Quick text editor" },
    { id: "settings", name: "Settings", icon: <Settings size={14} color="#bf5af2" />, sub: "Windows System Settings" },
    { id: "browser", name: "Web Browser", icon: <Globe size={14} color="#32d74b" />, sub: "Launch default browser" },
    { id: "screenshot", name: "Take Screenshot", icon: <Camera size={14} color="#ffd60a" />, sub: "Windows Snipping Tool", action: () => window.electronAPI?.takeScreenshot?.() },
    { id: "lock", name: "Lock Screen", icon: <Lock size={14} color="#ff3b30" />, sub: "Lock this computer", action: () => window.electronAPI?.lockWorkstation?.() },
  ];

  const filtered = apps.filter((app) =>
    app.name.toLowerCase().includes(query.toLowerCase()) ||
    app.sub.toLowerCase().includes(query.toLowerCase())
  );

  const handleLaunch = (app) => {
    if (app.action) {
      app.action();
    } else {
      window.electronAPI?.launchApp?.(app.id);
    }
    onClose?.();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 280 }}>
      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "5px 9px",
          borderRadius: 8,
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <Search size={13} opacity={0.6} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search apps and tools..."
          autoFocus
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#ffffff",
            fontSize: 12,
            width: "100%",
          }}
        />
      </div>

      {/* App List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 310, overflowY: "auto", scrollbarWidth: "none" }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => handleLaunch(item)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "6px 8px",
              borderRadius: 7,
              cursor: "pointer",
              transition: "background 0.12s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0a84ff")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#ffffff" }}>{item.name}</span>
              <span style={{ fontSize: 10, opacity: 0.55, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.sub}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: "12px", textAlign: "center", fontSize: 11, opacity: 0.5 }}>
            No matching apps found
          </div>
        )}
      </div>
    </div>
  );
}
