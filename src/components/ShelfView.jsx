import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Link2,
  Trash2,
  ExternalLink,
  FolderOpen,
  Search,
  CheckCircle2,
} from "lucide-react";
import { shelfStorage } from "../services/shelfStorage";

export default function ShelfView({ onClose }) {
  const [items, setItems] = useState(() => shelfStorage.getItems());
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    return shelfStorage.subscribe((updated) => setItems(updated));
  }, []);

  const handleOpenItem = async (item) => {
    if (item.isUrl) {
      window.electronAPI?.openExternal?.(item.path);
    } else if (item.path) {
      window.electronAPI?.openPath?.(item.path);
    }
  };

  const handleRevealItem = (e, item) => {
    e.stopPropagation();
    if (item.path && !item.isUrl) {
      window.electronAPI?.showItemInFolder?.(item.path);
    }
  };

  const handleRemoveItem = (e, id) => {
    e.stopPropagation();
    shelfStorage.removeItem(id);
  };

  const handleClearAll = () => {
    shelfStorage.clearShelf();
  };

  const getItemIcon = (item) => {
    if (item.isUrl) return <Link2 size={15} color="#0a84ff" />;
    const ext = item.name.split(".").pop().toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) {
      return <ImageIcon size={15} color="#bf5af2" />;
    }
    if (["js", "jsx", "ts", "tsx", "py", "html", "css", "json", "c", "cpp"].includes(ext)) {
      return <FileCode size={15} color="#ff9f0a" />;
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
      return <FileArchive size={15} color="#ff453a" />;
    }
    return <FileText size={15} color="#30d158" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.name?.toLowerCase().includes(q) || item.path?.toLowerCase().includes(q);
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        padding: "4px 14px 10px 14px",
        boxSizing: "border-box",
        userSelect: "none",
        fontFamily: 'OpenRunde, -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      }}
    >
      {/* Subheader Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 8,
          flexShrink: 0,
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 8,
            padding: "3px 8px",
            flex: 1,
          }}
        >
          <Search size={12} color="rgba(255, 255, 255, 0.5)" />
          <input
            type="text"
            placeholder="Search shelf items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              fontSize: 10.5,
              outline: "none",
              width: "100%",
            }}
          />
        </div>

        {/* Clear All Button */}
        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            title="Clear All Shelf Items"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(255, 69, 58, 0.12)",
              border: "1px solid rgba(255, 69, 58, 0.25)",
              color: "#ff453a",
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 600,
              padding: "3px 8px",
              cursor: "pointer",
            }}
          >
            <Trash2 size={11} /> Clear
          </button>
        )}
      </div>

      {/* Item List Container */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          paddingRight: 2,
        }}
      >
        {filteredItems.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              opacity: 0.5,
              gap: 4,
              textAlign: "center",
              padding: "16px 0",
            }}
          >
            <FolderOpen size={22} />
            <span style={{ fontSize: 11, fontWeight: 600 }}>Shelf is empty</span>
            <span style={{ fontSize: 9.5 }}>Drag files or links toward the island notch to drop here</span>
          </div>
        ) : (
          filteredItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
              onClick={() => handleOpenItem(item)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRemoveItem(e, item.id);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              title="Click to open • Right-click to remove"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, flex: 1 }}>
                <div style={{ flexShrink: 0 }}>{getItemIcon(item)}</div>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#ffffff",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.5, fontSize: 9 }}>
                    {item.size ? <span>{formatFileSize(item.size)}</span> : null}
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 260,
                      }}
                    >
                      {item.path}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 8 }}>
                {!item.isUrl && item.path && (
                  <button
                    onClick={(e) => handleRevealItem(e, item)}
                    title="Show in Explorer"
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(255, 255, 255, 0.6)",
                      cursor: "pointer",
                      padding: 3,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <FolderOpen size={12} />
                  </button>
                )}
                <button
                  onClick={(e) => handleRemoveItem(e, item.id)}
                  title="Remove from Shelf"
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.4)",
                    cursor: "pointer",
                    padding: 3,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
