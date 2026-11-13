import React, { useState } from "react";
import { ChevronRight, ChevronsRight } from "lucide-react";

export default function OverflowMenu({
  items = [],
  onSelectItem,
  direction = "right",
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3px 6px",
          borderRadius: 6,
          cursor: "pointer",
          background: isOpen ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.08)",
          color: "#ffffff",
          fontSize: 12,
          fontWeight: 700,
          transition: "background 0.12s ease",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.background = "rgba(255, 255, 255, 0.16)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
        }}
        title="More menu items"
      >
        <ChevronsRight size={13} />
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: 36,
            left: direction === "left" ? 0 : "auto",
            right: direction === "right" ? 0 : "auto",
            minWidth: 160,
            borderRadius: 10,
            background: "rgba(22, 22, 26, 0.94)",
            backdropFilter: "blur(28px) saturate(190%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 14px 34px rgba(0, 0, 0, 0.5)",
            padding: "4px",
            zIndex: 999999,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
          onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents?.(false)}
        >
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setIsOpen(false);
                onSelectItem?.(item.id);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 8px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                color: "#ffffff",
                cursor: "pointer",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0a84ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {item.icon && <span style={{ display: "inline-flex" }}>{item.icon}</span>}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
