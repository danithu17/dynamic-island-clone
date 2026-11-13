import React, { useState, useEffect } from "react";
import { FolderPlus, Trash2, FolderOpen, FileText, Globe, Smartphone, Mail, X } from "lucide-react";
import { shelfStorage } from "../../services/shelfStorage";

export default function ShelfDropdown({ onClose }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = shelfStorage.subscribe((shelfItems) => {
      setItems(shelfItems || []);
    });
    return unsub;
  }, []);

  const handleOpenItem = (item) => {
    if (item.path && window.electronAPI?.showItemInFolder) {
      window.electronAPI.showItemInFolder(item.path);
    } else if (item.isUrl && window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(item.name);
    }
  };

  const handleRemove = (e, id) => {
    e.stopPropagation();
    shelfStorage.removeItem(id);
  };

  const handleClear = () => {
    shelfStorage.clearShelf();
  };

  const handleOpenDownloads = () => {
    window.electronAPI?.openFolder?.();
    onClose?.();
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 300 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FolderPlus size={14} color="#30d158" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Aura Shelf</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              background: "rgba(48, 209, 88, 0.2)",
              color: "#30d158",
              padding: "1px 5px",
              borderRadius: 6,
            }}
          >
            {items.length}
          </span>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleClear}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: "none",
              color: "rgba(255, 69, 58, 0.8)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Trash2 size={11} /> Clear
          </button>
        )}
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Item List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 240, overflowY: "auto", scrollbarWidth: "none" }}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleOpenItem(item)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 8px",
              borderRadius: 7,
              cursor: "pointer",
              transition: "background 0.12s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0a84ff")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  background: "rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.isUrl ? (
                  <Globe size={12} color="#0a84ff" />
                ) : item.target === "mail" ? (
                  <Mail size={12} color="#0a84ff" />
                ) : item.target === "phone" ? (
                  <Smartphone size={12} color="#bf5af2" />
                ) : (
                  <FileText size={12} color="#30d158" />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 195,
                  }}
                  title={item.name}
                >
                  {item.name}
                </span>
                {item.size > 0 && (
                  <span style={{ fontSize: 9.5, opacity: 0.55 }}>{formatSize(item.size)}</span>
                )}
              </div>
            </div>

            <button
              onClick={(e) => handleRemove(e, item.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255, 255, 255, 0.4)",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
              }}
              title="Remove from Shelf"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <div style={{ padding: "16px 8px", textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11.5, opacity: 0.7 }}>Shelf is empty</span>
            <span style={{ fontSize: 10, opacity: 0.4 }}>Drag and drop files onto the notch to save them here</span>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Open Downloads Shortcut */}
      <div
        onClick={handleOpenDownloads}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "6px 8px",
          borderRadius: 7,
          cursor: "pointer",
          fontSize: 11.5,
          color: "rgba(255, 255, 255, 0.8)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#0a84ff")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <FolderOpen size={13} opacity={0.8} />
        <span>Open Downloads Folder</span>
      </div>
    </div>
  );
}
