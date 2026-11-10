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
  Mail,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export function getAlertIcon(type, iconName, color = "#ffffff") {
  switch (iconName || type) {
    case "battery-low":
      return <Battery size={15} color={color} />;
    case "battery-charging":
      return <Zap size={15} color={color} />;
    case "battery-full":
      return <BatteryCharging size={15} color={color} />;
    case "download":
      return <Download size={15} color={color} />;
    case "timer":
      return <Timer size={15} color={color} />;
    case "wifi":
      return <Wifi size={15} color={color} />;
    case "wifi-off":
      return <WifiOff size={15} color={color} />;
    case "bluetooth":
      return <Bluetooth size={15} color={color} />;
    case "volume":
      return <Volume2 size={15} color={color} />;
    case "volume-mute":
      return <VolumeX size={15} color={color} />;
    case "mail":
      return <Mail size={15} color={color} />;
    default:
      return <CheckCircle size={15} color={color} />;
  }
}

export default function SmartAlertView({ alert, onClick }) {
  if (!alert) return null;

  const accentColor = alert.accentColor || "#0a84ff";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: -2 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -2 }}
      transition={{ type: "spring", stiffness: 450, damping: 30 }}
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
        padding: "0 12px",
        boxSizing: "border-box",
        cursor: alert.action ? "pointer" : "default",
        userSelect: "none",
        fontFamily: 'OpenRunde, -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      }}
    >
      {/* Left side: Icon badge + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: `color-mix(in srgb, ${accentColor} 28%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 0 10px ${accentColor}40`,
          }}
        >
          {getAlertIcon(alert.type, alert.icon, accentColor)}
        </div>

        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: "#ffffff",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            letterSpacing: "-0.1px",
          }}
        >
          {alert.title}
        </span>
      </div>

      {/* Right side: Subtitle or Progress Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {typeof alert.progress === "number" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 60,
                height: 5,
                borderRadius: 2.5,
                background: "rgba(255, 255, 255, 0.2)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, alert.progress * 100))}%`,
                  height: "100%",
                  background: accentColor,
                  borderRadius: 2.5,
                  transition: "width 0.15s ease",
                }}
              />
            </div>
            {alert.subtitle && (
              <span style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255, 255, 255, 0.85)" }}>
                {alert.subtitle}
              </span>
            )}
          </div>
        ) : (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
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
