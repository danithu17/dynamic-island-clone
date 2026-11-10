import React, { useState, useEffect, useRef } from "react";
import AuraLogo from "./AuraLogo";
import ActiveAppName from "./ActiveAppName";
import MenuBarBattery from "./MenuBarBattery";
import MenuBarClock from "./MenuBarClock";

export default function MenuBar({
  stripHeight = 34,
  islandMode = "reserved", // "reserved" | "overlay" | "autohide"
  notchWidth = 140,
  isNotchHovered = false,
  isNotchExpanded = false,
  onOpenSettings,
}) {
  const [activeApp, setActiveApp] = useState({ name: "Desktop", icon: "" });
  const [batteryInfo, setBatteryInfo] = useState({ percent: 100, charging: false });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenBehavior, setFullscreenBehavior] = useState("hide");
  const [autoHideVisible, setAutoHideVisible] = useState(false);

  const isMouseOverBarRef = useRef(false);
  const autoHideTimeoutRef = useRef(null);

  // Active App subscription
  useEffect(() => {
    if (window.electronAPI?.getActiveApp) {
      window.electronAPI.getActiveApp().then((app) => app && setActiveApp(app));
    }
    if (window.electronAPI?.onActiveAppChanged) {
      const unsub = window.electronAPI.onActiveAppChanged((app) => {
        if (app) setActiveApp(app);
      });
      return unsub;
    }
  }, []);

  // Fullscreen state subscription
  useEffect(() => {
    if (!window.electronAPI?.onFullscreenChanged) return;
    const unsub = window.electronAPI.onFullscreenChanged((data) => {
      setIsFullscreen(Boolean(data?.isFullscreen));
      if (data?.behavior) setFullscreenBehavior(data.behavior);
    });
    return unsub;
  }, []);

  // Battery monitoring
  useEffect(() => {
    if (!navigator.getBattery) return;
    navigator.getBattery().then((battery) => {
      const updateBattery = () => {
        setBatteryInfo({
          percent: Math.round(battery.level * 100),
          charging: battery.charging,
        });
      };
      updateBattery();
      battery.addEventListener("levelchange", updateBattery);
      battery.addEventListener("chargingchange", updateBattery);
    }).catch(() => {});
  }, []);

  // Top edge mouse sensor for Auto-hide mode
  useEffect(() => {
    if (islandMode !== "autohide") return;

    const handleMouseMove = (e) => {
      if (e.clientY <= 3) {
        setAutoHideVisible(true);
        if (autoHideTimeoutRef.current) clearTimeout(autoHideTimeoutRef.current);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [islandMode]);

  const handleMouseEnter = () => {
    isMouseOverBarRef.current = true;
    if (islandMode === "autohide") {
      setAutoHideVisible(true);
      if (autoHideTimeoutRef.current) clearTimeout(autoHideTimeoutRef.current);
    }
    window.electronAPI?.setIgnoreMouseEvents?.(false);
  };

  const handleMouseLeave = () => {
    isMouseOverBarRef.current = false;
    if (islandMode === "autohide") {
      autoHideTimeoutRef.current = setTimeout(() => {
        if (!isMouseOverBarRef.current && !isNotchHovered && !isNotchExpanded) {
          setAutoHideVisible(false);
        }
      }, 350);
    }

    if (!isNotchHovered && !isNotchExpanded) {
      window.electronAPI?.setIgnoreMouseEvents?.(true, true);
    }
  };

  if (isFullscreen && fullscreenBehavior === "hide") {
    return null;
  }

  const isHiddenByAutoHide = islandMode === "autohide" && !autoHideVisible && !isNotchHovered && !isNotchExpanded;

  return (
    <div
      id="AuraMenuBar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: `${stripHeight}px`,
        boxSizing: "border-box",
        zIndex: 999990,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px",
        background: "rgba(18, 18, 20, 0.72)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        color: "#ffffff",
        fontFamily: 'OpenRunde, -apple-system, BlinkMacSystemFont, "Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
        transform: isHiddenByAutoHide ? `translateY(-${stripHeight}px)` : "translateY(0)",
        transition: "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease",
        opacity: isHiddenByAutoHide ? 0 : 1,
        pointerEvents: "auto",
        userSelect: "none",
      }}
    >
      {/* Left side items */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <AuraLogo size={16} onClick={onOpenSettings} />
        <ActiveAppName appData={activeApp} />
      </div>

      {/* Center Safe Gap reserved for Notch */}
      <div
        style={{
          width: `${Math.max(notchWidth + 24, 160)}px`,
          height: "100%",
          flexShrink: 0,
          pointerEvents: "none",
        }}
      />

      {/* Right side items */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 6,
          flex: 1,
          minWidth: 0,
        }}
      >
        <MenuBarBattery batteryInfo={batteryInfo} />
        <MenuBarClock />
      </div>
    </div>
  );
}
