import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Plus, Minus, GripVertical, AlertCircle, X } from "lucide-react";

/**
 * SettingsCard: Grouped card container (#1C1C1E, radius 14)
 */
export function SettingsCard({ title, description, children, style = {} }) {
  return (
    <div
      style={{
        background: "#1C1C1E",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 14,
        padding: "8px 18px",
        marginBottom: 18,
        boxSizing: "border-box",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
        ...style,
      }}
    >
      {(title || description) && (
        <div style={{ padding: "10px 0 6px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", marginBottom: 4 }}>
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
      <div style={{ display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

/**
 * SettingsRow: 44-52px height, hairline separators, label left, control right
 */
export function SettingsRow({
  id,
  label,
  description,
  icon,
  control,
  action,
  isDanger = false,
  isLast = false,
  highlight = false,
}) {
  return (
    <div
      id={id ? `row-${id}` : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 48,
        padding: "8px 0",
        borderBottom: isLast ? "none" : "1px solid rgba(255, 255, 255, 0.07)",
        backgroundColor: highlight ? "rgba(10, 132, 255, 0.22)" : "transparent",
        transition: "background-color 0.4s ease",
        borderRadius: highlight ? 8 : 0,
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        {icon && (
          <div
            style={{
              color: isDanger ? "#ff453a" : "rgba(255, 255, 255, 0.75)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: isDanger ? "#ff453a" : "#f5f5f7" }}>
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

/**
 * ToggleSwitch: Exact 51x31 dimensions, 27px circular knob, accent color when active
 */
export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  ariaLabel = "Toggle",
  accentColor = "#0a84ff",
}) {
  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      tabIndex={0}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
      style={{
        width: 51,
        height: 31,
        borderRadius: 15.5,
        backgroundColor: checked ? accentColor : "rgba(255, 255, 255, 0.18)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        padding: 0,
        outline: "none",
        transition: "background-color 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: disabled ? 0.45 : 1,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: 27,
          height: 27,
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.4)",
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          transition: "left 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </button>
  );
}

/**
 * SegmentedControl: iOS/macOS pill style
 */
export function SegmentedControl({ options, value, onChange, accentColor = "#0a84ff" }) {
  return (
    <div
      role="radiogroup"
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
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            style={{
              background: isSelected ? "rgba(255, 255, 255, 0.2)" : "transparent",
              color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.65)",
              border: "none",
              borderRadius: 6,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: isSelected ? 600 : 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
              outline: "none",
              boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * SliderWithValue: Slider with precise fill track and formatted value display pill
 */
export function SliderWithValue({
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  onChange,
  disabled = false,
  accentColor = "#0a84ff",
}) {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative", width: 140, display: "flex", alignItems: "center" }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            width: "100%",
            height: 6,
            borderRadius: 3,
            outline: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${percentage}%, rgba(255,255,255,0.18) ${percentage}%, rgba(255,255,255,0.18) 100%)`,
            WebkitAppearance: "none",
            margin: 0,
          }}
        />
      </div>
      <span
        style={{
          minWidth: 54,
          textAlign: "right",
          fontSize: 12,
          fontWeight: 600,
          color: "rgba(255, 255, 255, 0.85)",
          fontVariantNumeric: "tabular-nums",
          background: "rgba(255, 255, 255, 0.08)",
          padding: "3px 8px",
          borderRadius: 6,
        }}
      >
        {value} {unit}
      </span>
    </div>
  );
}

/**
 * Stepper: [-] [value] [+] controls
 */
export function Stepper({
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  onChange,
  disabled = false,
}) {
  const handleDec = () => {
    if (disabled || value <= min) return;
    onChange(Math.max(min, value - step));
  };

  const handleInc = () => {
    if (disabled || value >= max) return;
    onChange(Math.min(max, value + step));
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.08)",
        borderRadius: 8,
        border: "1px solid rgba(255, 255, 255, 0.12)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        aria-label="Decrease"
        disabled={disabled || value <= min}
        onClick={handleDec}
        style={{
          background: "transparent",
          border: "none",
          color: value <= min || disabled ? "rgba(255, 255, 255, 0.25)" : "#ffffff",
          padding: "5px 9px",
          cursor: value <= min || disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Minus size={13} />
      </button>
      <div
        style={{
          minWidth: 44,
          textAlign: "center",
          fontSize: 12,
          fontWeight: 600,
          color: "#ffffff",
          padding: "0 6px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value} {unit}
      </div>
      <button
        type="button"
        aria-label="Increase"
        disabled={disabled || value >= max}
        onClick={handleInc}
        style={{
          background: "transparent",
          border: "none",
          color: value >= max || disabled ? "rgba(255, 255, 255, 0.25)" : "#ffffff",
          padding: "5px 9px",
          cursor: value >= max || disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

/**
 * TextField: Sleek dark input with focus ring
 */
export function TextField({
  value,
  onChange,
  placeholder = "",
  disabled = false,
  width = 180,
  accentColor = "#0a84ff",
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input
      type="text"
      value={value || ""}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        width,
        background: "rgba(255, 255, 255, 0.08)",
        border: isFocused ? `1px solid ${accentColor}` : "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: 7,
        padding: "6px 10px",
        fontSize: 12.5,
        color: "#ffffff",
        outline: "none",
        boxShadow: isFocused ? `0 0 0 2px ${accentColor}33` : "none",
        transition: "border 0.15s ease, box-shadow 0.15s ease",
      }}
    />
  );
}

/**
 * Dropdown: Popover floating menu with checkmark
 */
export function Dropdown({
  options = [],
  value,
  onChange,
  disabled = false,
  width = 160,
  accentColor = "#0a84ff",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value) || options[0] || { label: "Select", value: "" };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: "relative", width }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: 7,
          padding: "6px 10px",
          color: "#ffffff",
          fontSize: 12,
          fontWeight: 500,
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedOption.label}
        </span>
        <ChevronDown size={14} style={{ opacity: 0.6, flexShrink: 0, marginLeft: 6 }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            minWidth: width,
            background: "#252528",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: 8,
            padding: "4px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: isSelected ? "rgba(255, 255, 255, 0.1)" : "transparent",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 8px",
                  color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.8)",
                  fontSize: 12,
                  fontWeight: isSelected ? 600 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={13} style={{ color: accentColor }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * ColorDots: Palette of color swatches with active ring
 */
export function ColorDots({
  colors = ["#0a84ff", "#30d158", "#ff9f0a", "#ff375f", "#bf5af2", "#64d2ff", "#ffd60a", "#ffffff"],
  value,
  onChange,
}) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {colors.map((c) => {
        const isSelected = value?.toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            aria-label={`Color ${c}`}
            onClick={() => onChange(c)}
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: c,
              border: isSelected ? "2px solid #ffffff" : "1px solid rgba(0, 0, 0, 0.2)",
              boxShadow: isSelected ? "0 0 0 2px #0a84ff, 0 2px 4px rgba(0,0,0,0.3)" : "none",
              cursor: "pointer",
              padding: 0,
              outline: "none",
              transition: "transform 0.15s ease",
              transform: isSelected ? "scale(1.1)" : "scale(1)",
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * HotkeyRecorder: Click to record, press combination, Esc cancels, shows conflicts
 */
export function HotkeyRecorder({
  value = "Ctrl+Alt+,",
  onChange,
  conflicts = [],
  placeholder = "Click to record...",
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setIsRecording(false);
        return;
      }

      // Ignore single modifier presses
      if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
        return;
      }

      const parts = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      if (e.metaKey) parts.push("Win");

      let keyName = e.key;
      if (keyName === " ") keyName = "Space";
      else if (keyName.length === 1) keyName = keyName.toUpperCase();

      parts.push(keyName);
      const combo = parts.join("+");

      // Check conflict
      if (conflicts.includes(combo) && combo !== value) {
        setHasConflict(true);
      } else {
        setHasConflict(false);
      }

      onChange(combo);
      setIsRecording(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRecording, conflicts, value, onChange]);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={() => {
          setIsRecording(!isRecording);
          setHasConflict(false);
        }}
        style={{
          background: isRecording ? "rgba(10, 132, 255, 0.25)" : "rgba(255, 255, 255, 0.08)",
          border: isRecording
            ? "1px solid #0a84ff"
            : hasConflict
            ? "1px solid #ff453a"
            : "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: 7,
          padding: "5px 12px",
          color: isRecording ? "#64d2ff" : "#ffffff",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          outline: "none",
          fontFamily: "monospace",
          letterSpacing: "0.5px",
        }}
      >
        {isRecording ? "Press shortcut (Esc to cancel)..." : value || placeholder}
      </button>
      {hasConflict && (
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#ff453a", fontSize: 11 }}>
          <AlertCircle size={13} />
          <span>In use</span>
        </span>
      )}
    </div>
  );
}

/**
 * ListPicker: List with selectable items
 */
export function ListPicker({ items = [], selectedValue, onSelect, accentColor = "#0a84ff" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      {items.map((item) => {
        const isSelected = item.value === selectedValue;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect(item.value)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              background: isSelected ? "rgba(255, 255, 255, 0.08)" : "transparent",
              border: "1px solid",
              borderColor: isSelected ? "rgba(255, 255, 255, 0.16)" : "transparent",
              borderRadius: 8,
              color: "#ffffff",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 500 }}>{item.label}</div>
              {item.description && (
                <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)", marginTop: 2 }}>
                  {item.description}
                </div>
              )}
            </div>
            {isSelected && <Check size={15} style={{ color: accentColor }} />}
          </button>
        );
      })}
    </div>
  );
}

/**
 * ReorderableList: List of items with drag handles and up/down movement
 */
export function ReorderableList({ items = [], onReorder }) {
  const move = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const copy = [...items];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    onReorder(copy);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {items.map((item, idx) => (
        <div
          key={item.id || idx}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.09)",
            borderRadius: 8,
            padding: "6px 10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <GripVertical size={14} style={{ color: "rgba(255, 255, 255, 0.4)", cursor: "grab" }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#ffffff" }}>{item.name || item.label || item}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              type="button"
              disabled={idx === 0}
              onClick={() => move(idx, -1)}
              style={{
                background: "transparent",
                border: "none",
                color: idx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
                cursor: idx === 0 ? "default" : "pointer",
                padding: "2px 6px",
                fontSize: 12,
              }}
            >
              ▲
            </button>
            <button
              type="button"
              disabled={idx === items.length - 1}
              onClick={() => move(idx, 1)}
              style={{
                background: "transparent",
                border: "none",
                color: idx === items.length - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
                cursor: idx === items.length - 1 ? "default" : "pointer",
                padding: "2px 6px",
                fontSize: 12,
              }}
            >
              ▼
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * SettingsButton: primary pill, secondary, destructive
 */
export function SettingsButton({
  label,
  onClick,
  variant = "default",
  icon,
  disabled = false,
  accentColor = "#0a84ff",
}) {
  const isDanger = variant === "danger" || variant === "destructive";
  const isPrimary = variant === "primary";

  let bg = "rgba(255, 255, 255, 0.08)";
  let color = "#ffffff";
  let border = "1px solid rgba(255, 255, 255, 0.12)";

  if (isPrimary) {
    bg = accentColor;
    color = "#ffffff";
    border = "none";
  } else if (isDanger) {
    bg = "rgba(255, 69, 58, 0.16)";
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
        justifyContent: "center",
        gap: 6,
        padding: isPrimary ? "7px 18px" : "6px 14px",
        borderRadius: isPrimary ? 20 : 8,
        background: bg,
        color,
        border,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "all 0.15s ease",
        outline: "none",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/**
 * InlineConfirmSheet: Slides up inside the window instead of native message box
 */
export function InlineConfirmSheet({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter") onConfirm?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 9999,
        paddingBottom: 24,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          maxWidth: 440,
          background: "#252528",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          borderRadius: 16,
          padding: 22,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          animation: "slideUpSheet 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff" }}>{title}</div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.5)",
              cursor: "pointer",
              padding: 2,
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.45 }}>
          {message}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
          <SettingsButton label={cancelLabel} onClick={onCancel} />
          <SettingsButton
            label={confirmLabel}
            variant={isDanger ? "danger" : "primary"}
            onClick={onConfirm}
          />
        </div>
      </div>
      <style>{`
        @keyframes slideUpSheet {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
