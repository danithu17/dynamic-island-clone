import React, { useState, useEffect, useRef } from "react";
import {
  Sliders,
  Wifi,
  Bluetooth,
  Volume2,
  FolderPlus,
  FileEdit,
  Clipboard,
  Rocket,
} from "lucide-react";

import AuraLogo from "./AuraLogo";
import ActiveAppName from "./ActiveAppName";
import MenuItem from "./MenuItem";
import DropdownPanel from "./DropdownPanel";
import StatusChips from "./StatusChips";
import MenuBarBattery from "./MenuBarBattery";
import MenuBarClock from "./MenuBarClock";

import AuraMenuDropdown from "./AuraMenuDropdown";
import ActiveAppDropdown from "./ActiveAppDropdown";
import LauncherDropdown from "./LauncherDropdown";
import ShelfDropdown from "./ShelfDropdown";
import NotesDropdown from "./NotesDropdown";
import ClipboardDropdown from "./ClipboardDropdown";
import WifiDropdown from "./WifiDropdown";
import BluetoothDropdown from "./BluetoothDropdown";
import VolumeDropdown from "./VolumeDropdown";
import ControlCenterDropdown from "./ControlCenterDropdown";
import ClockDropdown from "./ClockDropdown";
import BatteryDropdown from "./BatteryDropdown";

export default function MenuBar({
  stripHeight = 34,
  islandMode = "reserved", // "reserved" | "overlay" | "autohide"
  notchWidth = 140,
  isNotchHovered = false,
  isNotchExpanded = false,
  onOpenSettings,
  onOpenAbout,
  onStartTimer,
  mediaTrack,
  timerRunning,
  timerSecondsLeft,
}) {
  const [activeApp, setActiveApp] = useState({ name: "Desktop", icon: "" });
  const [batteryInfo, setBatteryInfo] = useState({ percent: 100, charging: false });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenBehavior, setFullscreenBehavior] = useState("hide");
  const [autoHideVisible, setAutoHideVisible] = useState(false);

  // Active Menu state for macOS-style dropdown behavior
  const [activeMenu, setActiveMenu] = useState(null); // string id or null
  const [panelAnchor, setPanelAnchor] = useState({ left: undefined, right: undefined });

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

  // Keep mouse events enabled while any menu dropdown is open
  useEffect(() => {
    if (activeMenu) {
      window.electronAPI?.setIgnoreMouseEvents?.(false);
    } else if (!isMouseOverBarRef.current && !isNotchHovered && !isNotchExpanded) {
      window.electronAPI?.setIgnoreMouseEvents?.(true, true);
    }
  }, [activeMenu, isNotchHovered, isNotchExpanded]);

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
        if (!isMouseOverBarRef.current && !isNotchHovered && !isNotchExpanded && !activeMenu) {
          setAutoHideVisible(false);
        }
      }, 350);
    }

    if (!isNotchHovered && !isNotchExpanded && !activeMenu) {
      window.electronAPI?.setIgnoreMouseEvents?.(true, true);
    }
  };

  // Toggle or switch menu item (macOS style: click to toggle, or hover if another menu is open)
  const openMenu = (menuId, event, align = "left") => {
    if (activeMenu === menuId) {
      setActiveMenu(null);
      return;
    }

    const rect = event?.currentTarget?.getBoundingClientRect();
    if (rect) {
      if (align === "right") {
        const rightOffset = window.innerWidth - rect.right;
        setPanelAnchor({ left: undefined, right: Math.max(8, rightOffset) });
      } else {
        setPanelAnchor({ left: Math.max(8, rect.left), right: undefined });
      }
    }
    setActiveMenu(menuId);
  };

  const handleItemHoverSwitch = (menuId, event, align = "left") => {
    if (activeMenu !== null && activeMenu !== menuId) {
      openMenu(menuId, event, align);
    }
  };

  const handleSelectMode = (mode) => {
    window.electronAPI?.setIslandMode?.(mode);
  };

  const handleReleaseSpace = () => {
    window.electronAPI?.releaseReservedSpace?.();
  };

  if (isFullscreen && fullscreenBehavior === "hide") {
    return null;
  }

  const isHiddenByAutoHide = islandMode === "autohide" && !autoHideVisible && !isNotchHovered && !isNotchExpanded && !activeMenu;

  return (
    <>
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
          padding: "0 8px",
          background: "rgba(18, 18, 20, 0.75)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
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
        {/* LEFT ZONE (in order): Aura Logo, Active App Name, Launcher, Shelf, Notes, Clipboard */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <div
            id="menu-item-aura"
            onClick={(e) => openMenu("aura", e, "left")}
            onMouseEnter={(e) => handleItemHoverSwitch("aura", e, "left")}
          >
            <AuraLogo size={15} />
          </div>

          <div
            id="menu-item-active-app"
            onClick={(e) => openMenu("active-app", e, "left")}
            onMouseEnter={(e) => handleItemHoverSwitch("active-app", e, "left")}
          >
            <ActiveAppName appData={activeApp} />
          </div>

          <MenuItem
            id="launcher"
            label="Launcher"
            icon={<Rocket size={13} opacity={0.8} />}
            isOpen={activeMenu === "launcher"}
            onClick={(e) => openMenu("launcher", e, "left")}
            onMouseEnter={(e) => handleItemHoverSwitch("launcher", e, "left")}
          />

          <MenuItem
            id="shelf"
            label="Shelf"
            icon={<FolderPlus size={13} opacity={0.8} />}
            isOpen={activeMenu === "shelf"}
            onClick={(e) => openMenu("shelf", e, "left")}
            onMouseEnter={(e) => handleItemHoverSwitch("shelf", e, "left")}
          />

          <MenuItem
            id="notes"
            label="Notes"
            icon={<FileEdit size={13} opacity={0.8} />}
            isOpen={activeMenu === "notes"}
            onClick={(e) => openMenu("notes", e, "left")}
            onMouseEnter={(e) => handleItemHoverSwitch("notes", e, "left")}
          />

          <MenuItem
            id="clipboard"
            label="Clipboard"
            icon={<Clipboard size={13} opacity={0.8} />}
            isOpen={activeMenu === "clipboard"}
            onClick={(e) => openMenu("clipboard", e, "left")}
            onMouseEnter={(e) => handleItemHoverSwitch("clipboard", e, "left")}
          />
        </div>

        {/* CENTER SAFE GAP (reserved for Island Notch) */}
        <div
          style={{
            width: `${Math.max(notchWidth + 24, 160)}px`,
            height: "100%",
            flexShrink: 0,
            pointerEvents: "none",
          }}
        />

        {/* RIGHT ZONE (right to left): Clock, Control Center, Wi-Fi, Bluetooth, Volume, Battery, Live Status Chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 2,
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Live Status Chips (Timer, Now Playing) */}
          <StatusChips
            mediaTrack={mediaTrack}
            timerRunning={timerRunning}
            timerSecondsLeft={timerSecondsLeft}
            onChipClick={(chipType) => {
              if (chipType === "media") onOpenSettings?.("media");
              if (chipType === "timer") onOpenSettings?.("timer");
            }}
          />

          {/* Battery */}
          <div
            id="menu-item-battery"
            onClick={(e) => openMenu("battery", e, "right")}
            onMouseEnter={(e) => handleItemHoverSwitch("battery", e, "right")}
          >
            <MenuBarBattery batteryInfo={batteryInfo} />
          </div>

          {/* Volume */}
          <MenuItem
            id="volume"
            icon={<Volume2 size={14} />}
            isOpen={activeMenu === "volume"}
            onClick={(e) => openMenu("volume", e, "right")}
            onMouseEnter={(e) => handleItemHoverSwitch("volume", e, "right")}
            title="Sound Volume"
          />

          {/* Bluetooth */}
          <MenuItem
            id="bluetooth"
            icon={<Bluetooth size={14} />}
            isOpen={activeMenu === "bluetooth"}
            onClick={(e) => openMenu("bluetooth", e, "right")}
            onMouseEnter={(e) => handleItemHoverSwitch("bluetooth", e, "right")}
            title="Bluetooth"
          />

          {/* Wi-Fi */}
          <MenuItem
            id="wifi"
            icon={<Wifi size={14} />}
            isOpen={activeMenu === "wifi"}
            onClick={(e) => openMenu("wifi", e, "right")}
            onMouseEnter={(e) => handleItemHoverSwitch("wifi", e, "right")}
            title="Wi-Fi"
          />

          {/* Control Center */}
          <MenuItem
            id="control-center"
            icon={<Sliders size={14} />}
            isOpen={activeMenu === "control-center"}
            onClick={(e) => openMenu("control-center", e, "right")}
            onMouseEnter={(e) => handleItemHoverSwitch("control-center", e, "right")}
            title="Control Center"
          />

          {/* Clock */}
          <div
            id="menu-item-clock"
            onClick={(e) => openMenu("clock", e, "right")}
            onMouseEnter={(e) => handleItemHoverSwitch("clock", e, "right")}
          >
            <MenuBarClock />
          </div>
        </div>
      </div>

      {/* DROPDOWN PANELS */}
      {/* 1. Aura System Menu Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "aura"}
        onClose={() => setActiveMenu(null)}
        anchorLeft={panelAnchor.left}
        top={stripHeight + 4}
        width={240}
      >
        <AuraMenuDropdown
          currentMode={islandMode}
          onOpenSettings={onOpenSettings}
          onOpenAbout={onOpenAbout}
          onSelectMode={handleSelectMode}
          onReleaseSpace={handleReleaseSpace}
          onClose={() => setActiveMenu(null)}
        />
      </DropdownPanel>

      {/* 2. Active App Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "active-app"}
        onClose={() => setActiveMenu(null)}
        anchorLeft={panelAnchor.left}
        top={stripHeight + 4}
        width={260}
      >
        <ActiveAppDropdown appData={activeApp} onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 3. Launcher Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "launcher"}
        onClose={() => setActiveMenu(null)}
        anchorLeft={panelAnchor.left}
        top={stripHeight + 4}
        width={280}
      >
        <LauncherDropdown onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 4. Shelf Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "shelf"}
        onClose={() => setActiveMenu(null)}
        anchorLeft={panelAnchor.left}
        top={stripHeight + 4}
        width={300}
      >
        <ShelfDropdown onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 5. Notes Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "notes"}
        onClose={() => setActiveMenu(null)}
        anchorLeft={panelAnchor.left}
        top={stripHeight + 4}
        width={290}
      >
        <NotesDropdown onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 6. Clipboard Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "clipboard"}
        onClose={() => setActiveMenu(null)}
        anchorLeft={panelAnchor.left}
        top={stripHeight + 4}
        width={310}
      >
        <ClipboardDropdown onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 7. Battery Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "battery"}
        onClose={() => setActiveMenu(null)}
        anchorRight={panelAnchor.right}
        top={stripHeight + 4}
        width={260}
      >
        <BatteryDropdown batteryInfo={batteryInfo} />
      </DropdownPanel>

      {/* 8. Volume Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "volume"}
        onClose={() => setActiveMenu(null)}
        anchorRight={panelAnchor.right}
        top={stripHeight + 4}
        width={230}
      >
        <VolumeDropdown />
      </DropdownPanel>

      {/* 9. Bluetooth Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "bluetooth"}
        onClose={() => setActiveMenu(null)}
        anchorRight={panelAnchor.right}
        top={stripHeight + 4}
        width={250}
      >
        <BluetoothDropdown onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 10. Wi-Fi Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "wifi"}
        onClose={() => setActiveMenu(null)}
        anchorRight={panelAnchor.right}
        top={stripHeight + 4}
        width={250}
      >
        <WifiDropdown onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 11. Control Center Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "control-center"}
        onClose={() => setActiveMenu(null)}
        anchorRight={panelAnchor.right}
        top={stripHeight + 4}
        width={310}
      >
        <ControlCenterDropdown mediaTrack={mediaTrack} onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 12. Clock / Calendar Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "clock"}
        onClose={() => setActiveMenu(null)}
        anchorRight={panelAnchor.right}
        top={stripHeight + 4}
        width={270}
      >
        <ClockDropdown onStartTimer={onStartTimer} onClose={() => setActiveMenu(null)} />
      </DropdownPanel>
    </>
  );
}
