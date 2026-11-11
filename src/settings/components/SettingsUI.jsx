import React from "react";
import designTokens from "../../styles/designTokens";

export function SettingsCard({ title, description, children, style = {} }) {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 12,
        padding: "16px 18px",
        marginBottom: 16,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {(title || description) && (
        <div style={{ marginBottom: 12 }}>
          {title && (
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.1px" }}>
              {title}
            </div>
          )}
          {description && (
            <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.55)", marginTop: 2, lineHeight: 1.4 }}>
              {description}
            </div>
          )}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

export function SettingsRow({ label, description, icon, control, action, isDanger = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "4px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
        {icon && (
          <div style={{ marginTop: 2, color: isDanger ? "#ff453a" : "rgba(255, 255, 255, 0.75)", flexShrink: 0 }}>
            {icon}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: isDanger ? "#ff453a" : "#f0f2f5" }}>
            {label}
          </div>
          {description && (
            <div style={{ fontSize: 11.5, color: "rgba(255, 255, 255, 0.5)", lineHeight: 1.35 }}>
              {description}
            </div>
          )}
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {control || action}
      </div>
    </div>
  );
}

export function ToggleSwitch({ checked, onChange, disabled = false, ariaLabel = "Toggle" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 12,
        background: checked ? "#0a84ff" : "rgba(255, 255, 255, 0.16)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        padding: 0,
        outline: "none",
        transition: "background 0.2s ease",
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: 9,
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.35)",
          position: "absolute",
          top: 2,
          left: checked ? 20 : 2,
          transition: "left 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </button>
  );
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "rgba(255, 255, 255, 0.08)",
        borderRadius: 8,
        padding: 2,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              background: isSelected ? "rgba(255, 255, 255, 0.18)" : "transparent",
              color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.6)",
              border: "none",
              borderRadius: 6,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: isSelected ? 600 : 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
              outline: "none",
              boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsButton({ label, onClick, variant = "default", icon, disabled = false }) {
  const isDanger = variant === "danger";
  const isPrimary = variant === "primary";

  let bg = "rgba(255, 255, 255, 0.08)";
  let color = "#ffffff";
  let border = "1px solid rgba(255, 255, 255, 0.12)";

  if (isPrimary) {
    bg = "#0a84ff";
    color = "#ffffff";
    border = "none";
  } else if (isDanger) {
    bg = "rgba(255, 69, 58, 0.15)";
    color = "#ff453a";
    border = "1px solid rgba(255, 69, 58, 0.35)";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 7,
        background: bg,
        color,
        border,
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s ease",
        outline: "none",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
