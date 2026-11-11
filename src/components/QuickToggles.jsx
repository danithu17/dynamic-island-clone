import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wifi,
  WifiOff,
  Bluetooth,
  Moon,
  Volume2,
  VolumeX,
  Camera,
  Lock,
} from "lucide-react";
import { alertQueue } from "../services/alertQueue";

export default function QuickToggles({ textColor = "#ffffff" }) {
  const [wifiOn, setWifiOn] = useState(navigator.onLine);
  const [bluetoothOn, setBluetoothOn] = useState(true);
  const [dndOn, setDndOn] = useState(() => localStorage.getItem("aura_dnd") === "true");
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const handleOnline = () => setWifiOn(true);
    const handleOffline = () => setWifiOn(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleToggleWifi = () => {
    const next = !wifiOn;
    setWifiOn(next);
    window.electronAPI?.openWifiSettings?.();
    alertQueue.showAlert({
      type: "network",
      icon: next ? "wifi" : "wifi-off",
      title: next ? "Wi-Fi Enabled" : "Wi-Fi Disabled",
      subtitle: next ? "Searching networks..." : "Disconnected",
      accentColor: next ? "#30d158" : "#ff453a",
      priority: 4,
      duration: 3000,
    });
  };

  const handleToggleBluetooth = () => {
    const next = !bluetoothOn;
    setBluetoothOn(next);
    window.electronAPI?.openBluetoothSettings?.();
    alertQueue.showAlert({
      type: "network",
      icon: "bluetooth",
      title: next ? "Bluetooth On" : "Bluetooth Off",
      subtitle: next ? "Ready to connect" : "Disabled",
      accentColor: next ? "#0a84ff" : "#8e8e93",
      priority: 4,
      duration: 3000,
    });
  };

  const handleToggleDnd = () => {
    const next = !dndOn;
    setDndOn(next);
    localStorage.setItem("aura_dnd", next ? "true" : "false");
    alertQueue.showAlert({
      type: "network",
      icon: "network",
      title: next ? "Do Not Disturb On" : "Do Not Disturb Off",
      subtitle: next ? "Notifications silenced" : "Alerts active",
      accentColor: next ? "#5e5ce6" : "#30d158",
      priority: 5,
      duration: 3000,
    });
  };

  const handleToggleMute = async () => {
    const next = !isMuted;
    setIsMuted(next);
    await window.electronAPI?.controlSystemVolume?.("mute");
    alertQueue.showAlert({
      type: "volume",
      icon: next ? "volume-mute" : "volume",
      title: next ? "Muted" : "Unmuted",
      subtitle: next ? "Audio silenced" : "Sound active",
      accentColor: next ? "#ff453a" : "#30d158",
      priority: 5,
      duration: 2500,
    });
  };

  const handleScreenshot = () => {
    window.electronAPI?.takeScreenshot?.();
    alertQueue.showAlert({
      type: "download",
      icon: "download",
      title: "Screenshot Tool",
      subtitle: "Select area to capture",
      accentColor: "#bf5af2",
      priority: 6,
      duration: 3000,
    });
  };

  const handleLock = () => {
    alertQueue.showAlert({
      type: "network",
      icon: "lock",
      title: "Locking Windows",
      subtitle: "Securing workstation...",
      accentColor: "#ff9f0a",
      priority: 10,
      duration: 2000,
    });
    setTimeout(() => {
      window.electronAPI?.lockWorkstation?.();
    }, 400);
  };

  const toggles = [
    {
      id: "wifi",
      label: "Wi-Fi",
      active: wifiOn,
      icon: wifiOn ? <Wifi size={13} /> : <WifiOff size={13} />,
      onClick: handleToggleWifi,
      activeColor: "#30d158",
    },
    {
      id: "bluetooth",
      label: "Bluetooth",
      active: bluetoothOn,
      icon: <Bluetooth size={13} />,
      onClick: handleToggleBluetooth,
      activeColor: "#0a84ff",
    },
    {
      id: "dnd",
      label: "DND",
      active: dndOn,
      icon: <Moon size={13} />,
      onClick: handleToggleDnd,
      activeColor: "#5e5ce6",
    },
    {
      id: "mute",
      label: "Mute",
      active: isMuted,
      icon: isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />,
      onClick: handleToggleMute,
      activeColor: "#ff453a",
    },
    {
      id: "screenshot",
      label: "Snip",
      active: false,
      icon: <Camera size={13} />,
      onClick: handleScreenshot,
      activeColor: "#bf5af2",
    },
    {
      id: "lock",
      label: "Lock",
      active: false,
      icon: <Lock size={13} />,
      onClick: handleLock,
      activeColor: "#ff9f0a",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
        width: "100%",
        padding: "6px 14px 8px 14px",
        boxSizing: "border-box",
        background: "rgba(255, 255, 255, 0.03)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        userSelect: "none",
        fontFamily: '"Segoe UI Variable Text", "Segoe UI Variable", "Segoe UI", Inter, system-ui, sans-serif',
        WebkitFontSmoothing: "antialiased",
        textRendering: "optimizeLegibility",
      }}
    >
      {toggles.map((item) => {
        const isActive = item.active;
        const color = isActive ? item.activeColor : "rgba(255, 255, 255, 0.65)";

        return (
          <motion.button
            key={item.id}
            whileHover={{ y: -1, backgroundColor: isActive ? `color-mix(in srgb, ${item.activeColor} 30%, transparent)` : "rgba(255, 255, 255, 0.12)" }}
            whileTap={{ y: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
            }}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              height: 28,
              borderRadius: 8,
              border: isActive ? `1px solid ${item.activeColor}60` : "1px solid rgba(255, 255, 255, 0.08)",
              background: isActive ? `color-mix(in srgb, ${item.activeColor} 22%, transparent)` : "rgba(255, 255, 255, 0.06)",
              color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.75)",
              fontSize: 10.5,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: isActive ? `0 0 10px ${item.activeColor}30` : "none",
              transition: "border 0.2s ease, background 0.2s ease",
            }}
            title={item.label}
          >
            <span style={{ color }}>{item.icon}</span>
            <span>{item.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
