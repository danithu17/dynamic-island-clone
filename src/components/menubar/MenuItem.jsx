import React from "react";

export default function MenuItem({
  id,
  label,
  icon,
  isOpen = false,
  onClick,
  onMouseEnter,
  title,
}) {
  return (
    <div
      id={`menu-item-${id}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      title={title || label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: 6,
        cursor: "pointer",
        transition: "all 0.12s ease",
        userSelect: "none",
        background: isOpen
          ? "rgba(255, 255, 255, 0.22)"
          : "transparent",
        color: isOpen ? "#ffffff" : "rgba(255, 255, 255, 0.88)",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "-0.15px",
        whiteSpace: "nowrap",
      }}
      onMouseOver={(e) => {
        if (!isOpen) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
          e.currentTarget.style.color = "#ffffff";
        }
      }}
      onMouseOut={(e) => {
        if (!isOpen) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "rgba(255, 255, 255, 0.88)";
        }
      }}
    >
      {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>}
      {label && <span>{label}</span>}
    </div>
  );
}
