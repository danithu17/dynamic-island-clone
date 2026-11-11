import React from "react";
import designTokens from "../../styles/designTokens";

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
        padding: "3px 8.5px",
        borderRadius: designTokens.radii.menuItem,
        cursor: "pointer",
        transition: "background 0.1s ease, color 0.1s ease",
        userSelect: "none",
        fontFamily: designTokens.typography.fontFamily,
        fontSize: designTokens.typography.sizeBarItem,
        fontWeight: isOpen ? designTokens.typography.weightSemibold : designTokens.typography.weightMedium,
        background: isOpen ? designTokens.colors.itemActive : "transparent",
        color: isOpen ? "#ffffff" : designTokens.colors.textSecondary,
        letterSpacing: designTokens.typography.letterSpacing,
        whiteSpace: "nowrap",
      }}
      onMouseOver={(e) => {
        if (!isOpen) {
          e.currentTarget.style.background = designTokens.colors.itemHover;
          e.currentTarget.style.color = "#ffffff";
        }
      }}
      onMouseOut={(e) => {
        if (!isOpen) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = designTokens.colors.textSecondary;
        }
      }}
    >
      {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>}
      {label && <span>{label}</span>}
    </div>
  );
}
