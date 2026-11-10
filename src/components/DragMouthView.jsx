import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderPlus, Mail, Smartphone } from "lucide-react";

export default function DragMouthView({ onDropItem, onCancel }) {
  const [hoveredTile, setHoveredTile] = useState(null);

  const tiles = [
    {
      id: "shelf",
      label: "Save to Shelf",
      sublabel: "Keep in island shelf",
      icon: <FolderPlus size={18} />,
      color: "#30d158",
    },
    {
      id: "mail",
      label: "Mail it (Gmail)",
      sublabel: "Queue email draft",
      icon: <Mail size={18} />,
      color: "#0a84ff",
    },
    {
      id: "phone",
      label: "To your phone",
      sublabel: "Beam to device",
      icon: <Smartphone size={18} />,
      color: "#bf5af2",
    },
  ];

  const handleDragOver = (e, tileId) => {
    e.preventDefault();
    e.stopPropagation();
    if (hoveredTile !== tileId) {
      setHoveredTile(tileId);
    }
  };

  const handleDragLeave = (e, tileId) => {
    e.preventDefault();
    e.stopPropagation();
    if (hoveredTile === tileId) {
      setHoveredTile(null);
    }
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredTile(null);

    const files = e.dataTransfer.files;
    const items = [];

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        items.push({
          name: file.name,
          path: file.path || file.name,
          size: file.size,
          type: file.type || "file",
          isUrl: false,
          target: targetId,
        });
      }
    } else {
      const text = e.dataTransfer.getData("text");
      if (text) {
        const isUrl = /^https?:\/\//i.test(text.trim());
        items.push({
          name: isUrl ? text.trim() : text.slice(0, 30),
          path: text.trim(),
          size: text.length,
          type: isUrl ? "url" : "text",
          isUrl,
          target: targetId,
        });
      }
    }

    if (items.length > 0) {
      for (const item of items) {
        onDropItem(item, targetId);
      }
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "6px 12px 10px 12px",
        boxSizing: "border-box",
        userSelect: "none",
        fontFamily: 'OpenRunde, -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Mouth Header Prompt */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "0 6px 6px 6px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: hoveredTile ? tiles.find((t) => t.id === hoveredTile)?.color : "#30d158",
              boxShadow: hoveredTile ? `0 0 8px ${tiles.find((t) => t.id === hoveredTile)?.color}` : "none",
              transition: "all 0.2s ease",
            }}
          />
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.2px", opacity: 0.85 }}>
            DROP INTO ISLAND
          </span>
        </div>
        <span style={{ fontSize: 9.5, opacity: 0.5, fontWeight: 500 }}>Choose action tile</span>
      </div>

      {/* 3 Selectable Drop Action Tiles */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          width: "100%",
          flex: 1,
        }}
      >
        {tiles.map((tile) => {
          const isHovered = hoveredTile === tile.id;
          return (
            <motion.div
              key={tile.id}
              animate={{
                scale: isHovered ? 1.05 : 1,
                borderColor: isHovered ? `${tile.color}90` : "rgba(255, 255, 255, 0.12)",
                backgroundColor: isHovered
                  ? `color-mix(in srgb, ${tile.color} 24%, rgba(0, 0, 0, 0.4))`
                  : "rgba(255, 255, 255, 0.05)",
                boxShadow: isHovered ? `0 0 16px ${tile.color}40` : "none",
              }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              onDragOver={(e) => handleDragOver(e, tile.id)}
              onDragLeave={(e) => handleDragLeave(e, tile.id)}
              onDrop={(e) => handleDrop(e, tile.id)}
              style={{
                flex: 1,
                height: "100%",
                borderRadius: 12,
                border: "1px solid rgba(255, 255, 255, 0.12)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                cursor: "pointer",
                padding: "4px 6px",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
            >
              <div
                style={{
                  color: isHovered ? tile.color : "rgba(255, 255, 255, 0.85)",
                  transition: "color 0.15s ease",
                }}
              >
                {tile.icon}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.85)",
                  textAlign: "center",
                  lineHeight: 1.1,
                }}
              >
                {tile.label}
              </span>
              <span
                style={{
                  fontSize: 8.5,
                  opacity: isHovered ? 0.9 : 0.45,
                  color: isHovered ? tile.color : "rgba(255, 255, 255, 0.6)",
                  textAlign: "center",
                }}
              >
                {tile.sublabel}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
