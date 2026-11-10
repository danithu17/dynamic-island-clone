import React from "react";
import { AppWindow } from "lucide-react";

export default function ActiveAppName({ appData, onClick }) {
  const name = appData?.name || "Desktop";
  const icon = appData?.icon || "";

  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        borderRadius: 6,
        cursor: "pointer",
        transition: "background 0.15s ease",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {icon ? (
        <img
          src={icon}
          alt=""
          style={{
            width: 15,
            height: 15,
            objectFit: "contain",
            borderRadius: 3,
            flexShrink: 0,
          }}
        />
      ) : (
        <AppWindow size={14} style={{ opacity: 0.85 }} />
      )}
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: "-0.2px",
          whiteSpace: "nowrap",
          maxWidth: 220,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </span>
    </div>
  );
}
