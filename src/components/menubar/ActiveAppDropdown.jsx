import React, { useState } from "react";
import { FolderOpen, Copy, Check, AppWindow } from "lucide-react";

export default function ActiveAppDropdown({ appData, onClose }) {
  const [copied, setCopied] = useState(false);
  const name = appData?.name || "Desktop";
  const icon = appData?.icon || "";
  const exePath = appData?.exePath || "";

  const handleCopyPath = () => {
    if (exePath && window.electronAPI?.writeClipboardText) {
      window.electronAPI.writeClipboardText(exePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShowInFolder = () => {
    if (exePath && window.electronAPI?.showItemInFolder) {
      window.electronAPI.showItemInFolder(exePath);
      onClose?.();
    }
  };

  const itemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.92)",
    cursor: "pointer",
    transition: "background 0.12s ease",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 240 }}>
      {/* Header with App Info */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
        {icon ? (
          <img
            src={icon}
            alt=""
            style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 6, flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppWindow size={18} />
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name}
          </span>
          <span style={{ fontSize: 10, opacity: 0.55, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 190 }} title={exePath}>
            {exePath ? exePath.split("\\").slice(-2).join("\\") : "Active Window"}
          </span>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 4px" }} />

      {/* Actions */}
      {exePath && (
        <>
          <div
            style={itemStyle}
            onClick={handleShowInFolder}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0a84ff")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <FolderOpen size={13} opacity={0.8} />
            <span>Show in File Explorer</span>
          </div>

          <div
            style={itemStyle}
            onClick={handleCopyPath}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0a84ff")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {copied ? <Check size={13} color="#30d158" /> : <Copy size={13} opacity={0.8} />}
            <span>{copied ? "Path Copied!" : "Copy Executable Path"}</span>
          </div>
        </>
      )}
    </div>
  );
}
