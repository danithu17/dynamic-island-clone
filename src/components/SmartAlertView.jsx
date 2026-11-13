import React from "react";
import { motion } from "framer-motion";
import {
  Battery,
  BatteryCharging,
  Zap,
  Download,
  Timer,
  Wifi,
  WifiOff,
  Bluetooth,
  Volume2,
  VolumeX,
  Sun,
  Mail,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import designTokens from "../styles/designTokens";

export function getAlertIcon(type, iconName, color = "#ffffff") {
  const iconProps = { size: 14, strokeWidth: 1.75, color };
  switch (iconName || type) {
    case "battery-low":
      return <Battery {...iconProps} />;
    case "battery-charging":
      return <Zap {...iconProps} />;
    case "battery-full":
      return <BatteryCharging {...iconProps} />;
    case "download":
      return <Download {...iconProps} />;
    case "timer":
      return <Timer {...iconProps} />;
    case "wifi":
      return <Wifi {...iconProps} />;
    case "wifi-off":
      return <WifiOff {...iconProps} />;
    case "bluetooth":
      return <Bluetooth {...iconProps} />;
    case "volume":
      return <Volume2 {...iconProps} />;
    case "volume-mute":
      return <VolumeX {...iconProps} />;
    case "brightness":
    case "sun":
      return <Sun {...iconProps} />;
    case "mail":
      return <Mail {...iconProps} />;
    case "warning":
      return <AlertTriangle {...iconProps} />;
    default:
      return <CheckCircle {...iconProps} />;
  }
}

export default function SmartAlertView({ alert, onClick }) {
  if (!alert) return null;

  const accentColor = alert.accentColor || designTokens.colors.accentBlue;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -2 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -2 }}
      transition={designTokens.motion.springAlert}
      onClick={(e) => {
        if (alert.action) {
          e.stopPropagation();
          alert.action();
        }
        onClick?.();
      }}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px 0 8px",
        boxSizing: "border-box",
        cursor: alert.action ? "pointer" : "default",
        userSelect: "none",
        fontFamily: designTokens.typography.fontFamily,
        WebkitFontSmoothing: "antialiased",
        textRendering: "optimizeLegibility",
      }}
    >
      {/* Left side: Glowing orb badge + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${accentColor} 45%, transparent), color-mix(in srgb, ${accentColor} 18%, transparent))`,
            border: `1px solid color-mix(in srgb, ${accentColor} 55%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 0 12px color-mix(in srgb, ${accentColor} 45%, transparent)`,
          }}
        >
          {getAlertIcon(alert.type, alert.icon, "#ffffff")}
        </div>

        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.25 }}>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: designTokens.typography.weightSemibold,
              color: "#ffffff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "-0.2px",
            }}
          >
            {alert.title}
          </span>
          {alert.subtitle && !alert.buttons && typeof alert.progress !== "number" && (
            <span
              style={{
                fontSize: 10,
                fontWeight: designTokens.typography.weightMedium,
                color: designTokens.colors.textSecondary,
                whiteSpace: "nowrap",
                letterSpacing: "-0.1px",
              }}
            >
              {alert.subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right side: Modern Action Buttons, Progress Bar, or Subtitle */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {alert.buttons && alert.buttons.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {alert.buttons.map((btn, idx) => (
              <motion.button
                key={idx}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={(e) => {
                  e.stopPropagation();
                  btn.onClick?.();
                }}
                style={{
                  background: btn.primary
                    ? `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 90%, white) 0%, ${accentColor} 100%)`
                    : "rgba(255, 255, 255, 0.12)",
                  border: btn.primary
                    ? "1px solid rgba(255, 255, 255, 0.28)"
                    : "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 9999,
                  minHeight: 32,
                  padding: "4px 12px",
                  fontSize: 11,
                  fontWeight: designTokens.typography.weightSemibold,
                  color: "#ffffff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  outline: "none",
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.1px",
                  boxShadow: btn.primary
                    ? `0 2px 8px color-mix(in srgb, ${accentColor} 50%, transparent), inset 0 1px 0 rgba(255, 255, 255, 0.4)`
                    : "0 2px 6px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                }}
              >
                {btn.label}
              </motion.button>
            ))}
          </div>
        ) : typeof alert.progress === "number" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 64,
                height: 5,
                borderRadius: 999,
                background: "rgba(255, 255, 255, 0.16)",
                overflow: "hidden",
                boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.4)",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, alert.progress * 100))}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${accentColor}, color-mix(in srgb, ${accentColor} 80%, white))`,
                  borderRadius: 999,
                  boxShadow: `0 0 8px ${accentColor}`,
                  transition: "width 0.18s ease-out",
                }}
              />
            </div>
            {alert.subtitle && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: designTokens.typography.weightBold,
                  fontVariantNumeric: "tabular-nums",
                  color: "rgba(255, 255, 255, 0.9)",
                }}
              >
                {alert.subtitle}
              </span>
            )}
          </div>
        ) : (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: designTokens.typography.weightSemibold,
              color: accentColor,
              whiteSpace: "nowrap",
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {alert.subtitle}
          </span>
        )}
      </div>
    </motion.div>
  );
}
