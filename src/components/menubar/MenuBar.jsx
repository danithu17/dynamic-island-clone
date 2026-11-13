import React, { useState, useEffect, useRef } from "react";
import {
  Sliders,
  Wifi,
  Bluetooth,
  Volume2,
  VolumeX,
  Volume1,
  Volume,
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
import OverflowMenu from "./OverflowMenu";

import AuraMenuDropdown from "./AuraMenuDropdown";
import ActiveAppDropdown from "./ActiveAppDropdown";
import LauncherDropdown from "./LauncherDropdown";
import ShelfDropdown from "./ShelfDropdown";
import NotesDropdown from "./NotesDropdown";
import ClipboardDropdown from "./ClipboardDropdown";
import WifiDropdown from "./WifiDropdown";
import BluetoothDropdown from "./BluetoothDropdown";
import VolumeDropdown from "./VolumeDropdown";
import ControlCenter from "./ControlCenter";
import ClockPanel from "./ClockPanel";
import BatteryDropdown from "./BatteryDropdown";
import AppMenus, { AppMenuDropdownContent } from "./AppMenus";
import designTokens, { snapToPhysicalPixels } from "../../styles/designTokens";

export default function MenuBar({
  stripHeight = 34,
  islandMode = "reserved", // "reserved" | "overlay" | "autohide"
  notchWidth = 140,
  isNotchHovered = false,
  isNotchExpanded = false,
  onOpenSettings,
  onOpenAbout,
  onStartTimer,
  onStopTimer,
  mediaTrack,
  timerRunning,
  timerSecondsLeft,
}) {
  const [activeApp, setActiveApp] = useState({ name: "Desktop", icon: "" });
  const [batteryInfo, setBatteryInfo] = useState({ percent: 100, charging: false });
  const [systemVolume, setSystemVolume] = useState({ volume: 100, isMuted: false });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenBehavior, setFullscreenBehavior] = useState("hide");
  const [autoHideVisible, setAutoHideVisible] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [menuConfig, setMenuConfig] = useState({
    menuBarBackground: "acrylic",
    items: {
      activeApp: true,
      launcher: true,
      shelf: true,
      notes: true,
      clipboard: true,
      statusChips: true,
      battery: true,
      volume: true,
      bluetooth: true,
      wifi: true,
      controlCenter: true,
      clock: true,
    },
  });

  // Active Menu state for macOS-style dropdown behavior
  const [activeMenu, setActiveMenu] = useState(null); // string id or null
  const [panelAnchor, setPanelAnchor] = useState({ left: undefined, right: undefined });
  const [currentAppMenuData, setCurrentAppMenuData] = useState({ menus: [], hwnd: 0, layer: "generic" });

  useEffect(() => {
    if (!window.electronAPI?.onAppMenusChanged) return;
    const unsub = window.electronAPI.onAppMenusChanged((data) => {
      if (data && Array.isArray(data.menus)) {
        setCurrentAppMenuData(data);
      }
    });

    if (window.electronAPI?.getCurrentAppMenus) {
      window.electronAPI.getCurrentAppMenus().then((data) => {
        if (data && Array.isArray(data.menus)) {
          setCurrentAppMenuData(data);
        }
      }).catch(() => {});
    }

    return () => unsub?.();
  }, []);

  const isMouseOverBarRef = useRef(false);
  const autoHideTimeoutRef = useRef(null);

  // Window resize sensor for responsive overflow handling
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Menu bar config (background & items visibility)
  useEffect(() => {
    if (window.electronAPI?.getMenuBarConfig) {
      window.electronAPI.getMenuBarConfig().then((cfg) => {
        if (cfg) {
          setMenuConfig((prev) => ({
            ...prev,
            menuBarBackground: cfg.menuBarBackground || prev.menuBarBackground,
            items: { ...prev.items, ...(cfg.items || {}) },
          }));
        }
      });
    }
    if (window.electronAPI?.onMenuBarConfigChanged) {
      const unsub = window.electronAPI.onMenuBarConfigChanged((cfg) => {
        if (cfg) {
          setMenuConfig((prev) => ({
            ...prev,
            menuBarBackground: cfg.menuBarBackground || prev.menuBarBackground,
            items: { ...prev.items, ...(cfg.items || {}) },
          }));
        }
      });
      return unsub;
    }
  }, []);

  // Hardware media & volume keys watcher feedback
  useEffect(() => {
    const unsubVol = window.electronAPI?.onKeyboardVolumeChange?.(() => {});
    const unsubMedia = window.electronAPI?.onKeyboardMediaChange?.(() => {});
    return () => {
      unsubVol?.();
      unsubMedia?.();
    };
  }, []);

  // Active App subscription
  useEffect(() => {
    if (menuConfig.items?.activeApp === false) return;
    if (window.electronAPI?.getActiveApp) {
      window.electronAPI.getActiveApp().then((app) => app && setActiveApp(app));
    }
    if (window.electronAPI?.onActiveAppChanged) {
      const unsub = window.electronAPI.onActiveAppChanged((app) => {
        if (app) setActiveApp(app);
      });
      return unsub;
    }
  }, [menuConfig.items?.activeApp]);

  // Fullscreen state subscription
  useEffect(() => {
    if (!window.electronAPI?.onFullscreenChanged) return;
    const unsub = window.electronAPI.onFullscreenChanged((data) => {
      setIsFullscreen(Boolean(data?.isFullscreen));
      if (data?.behavior) setFullscreenBehavior(data.behavior);
    });
    return unsub;
  }, []);

  // Master Volume monitoring
  useEffect(() => {
    if (window.electronAPI?.getSystemVolume) {
      window.electronAPI.getSystemVolume().then((res) => {
        if (res && typeof res.volume === "number") {
          setSystemVolume({ volume: res.volume, isMuted: Boolean(res.isMuted) });
        }
      }).catch(() => {});
    }

    const unsubVol = window.electronAPI?.onVolumeChange?.((data) => {
      if (data && typeof data.volume === "number") {
        setSystemVolume({ volume: data.volume, isMuted: Boolean(data.isMuted) });
      }
    });

    return () => unsubVol?.();
  }, []);

  // Battery monitoring (hybrid: native system query + Web Battery API)
  useEffect(() => {
    if (menuConfig.items?.battery === false) return;
    let mounted = true;

    const queryNativeBattery = () => {
      if (window.electronAPI?.getSystemBattery) {
        window.electronAPI.getSystemBattery().then((info) => {
          if (!mounted || !info) return;
          if (typeof info.percent === "number") {
            setBatteryInfo({
              percent: info.percent,
              charging: Boolean(info.charging),
            });
          }
        }).catch(() => {});
      }
    };

    queryNativeBattery();
    const pollInterval = setInterval(queryNativeBattery, 10000);

    let batteryInstance = null;
    if (navigator.getBattery) {
      const updateBattery = () => {
        if (!batteryInstance || !mounted) return;
        setBatteryInfo({
          percent: Math.round(batteryInstance.level * 100),
          charging: batteryInstance.charging,
        });
      };

      navigator.getBattery().then((battery) => {
        if (!mounted) return;
        batteryInstance = battery;
        updateBattery();
        battery.addEventListener("levelchange", updateBattery);
        battery.addEventListener("chargingchange", updateBattery);
      }).catch(() => {});
    }

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      if (batteryInstance) {
        batteryInstance.removeEventListener("levelchange", updateBattery);
        batteryInstance.removeEventListener("chargingchange", updateBattery);
      }
    };
  }, [menuConfig.items?.battery]);

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
    } else {
      // Default fallback positioning when invoked from overflow menu
      if (align === "right") {
        setPanelAnchor({ left: undefined, right: 80 });
      } else {
        setPanelAnchor({ left: 160, right: undefined });
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

  // Background styling
  const getBackgroundStyle = () => {
    switch (menuConfig.menuBarBackground) {
      case "black":
        return {
          background: "#0d0e11",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        };
      case "darkgray":
        return {
          background: "#18191e",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
        };
      case "acrylic":
      default:
        return {
          background: "rgba(18, 19, 23, 0.94)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.09)",
        };
    }
  };

  // Safe gap calculation (ensures items never overlap the notch)
  const safeGapWidth = Math.max(notchWidth + 64, 220);

  // Left side responsive overflow partitioning
  const allLeftItems = [
    { id: "launcher", label: "Launcher", icon: <Rocket size={13} opacity={0.8} /> },
    { id: "shelf", label: "Shelf", icon: <FolderPlus size={13} opacity={0.8} /> },
    { id: "notes", label: "Notes", icon: <FileEdit size={13} opacity={0.8} /> },
    { id: "clipboard", label: "Clipboard", icon: <Clipboard size={13} opacity={0.8} /> },
  ].filter((item) => menuConfig.items?.[item.id] !== false);

  const hasAppMenus = Boolean(currentAppMenuData?.menus?.length > 0);

  let visibleLeftItems = allLeftItems;
  let overflowLeftItems = [];

  if (hasAppMenus) {
    // When per-app menus are active, keep left bar clean like macOS:
    // Extra utility items move into the overflow menu to prevent notch crowding/clipping
    visibleLeftItems = [];
    overflowLeftItems = allLeftItems;
  } else if (windowWidth < 900) {
    visibleLeftItems = [];
    overflowLeftItems = allLeftItems;
  } else if (windowWidth < 1080) {
    visibleLeftItems = allLeftItems.slice(0, 2);
    overflowLeftItems = allLeftItems.slice(2);
  }

  // Right side responsive overflow partitioning
  const allRightToggleables = [
    { id: "volume", label: "Sound Volume", icon: <Volume2 size={13} opacity={0.8} /> },
    { id: "bluetooth", label: "Bluetooth", icon: <Bluetooth size={13} opacity={0.8} /> },
    { id: "wifi", label: "Wi-Fi", icon: <Wifi size={13} opacity={0.8} /> },
  ].filter((item) => menuConfig.items?.[item.id] !== false);

  let visibleRightToggleables = allRightToggleables;
  let overflowRightItems = [];

  if (windowWidth < 950) {
    visibleRightToggleables = [];
    overflowRightItems = allRightToggleables;
  } else if (windowWidth < 1120) {
    visibleRightToggleables = allRightToggleables.filter((i) => i.id === "volume");
    overflowRightItems = allRightToggleables.filter((i) => i.id !== "volume");
  }

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
          zIndex: 999995,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          color: "#ffffff",
          fontFamily: designTokens.typography.fontFamily,
          WebkitFontSmoothing: "antialiased",
          textRendering: "optimizeLegibility",
          transform: isHiddenByAutoHide ? `translateY(-${stripHeight}px)` : "translateY(0)",
          transition: "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, background 0.2s ease",
          opacity: isHiddenByAutoHide ? 0 : 1,
          pointerEvents: "auto",
          userSelect: "none",
          ...getBackgroundStyle(),
        }}
      >
        {/* LEFT ZONE: Aura Logo, Active App Name, Per-App Menus, System Items / Overflow */}
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

          {menuConfig.items?.activeApp !== false && (
            <div
              id="menu-item-active-app"
              onClick={(e) => openMenu("active-app", e, "left")}
              onMouseEnter={(e) => handleItemHoverSwitch("active-app", e, "left")}
            >
              <ActiveAppName appData={activeApp} />
            </div>
          )}

          {/* Per-App Menus (Part A) */}
          <AppMenus
            activeMenu={activeMenu}
            onOpenMenu={(id, anchor) => {
              setPanelAnchor(anchor);
              setActiveMenu(id);
            }}
            onHoverMenu={(id, anchor) => {
              setPanelAnchor(anchor);
              setActiveMenu(id);
            }}
            onCloseMenu={() => setActiveMenu(null)}
          />

          {visibleLeftItems.map((item) => (
            <MenuItem
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              isOpen={activeMenu === item.id}
              onClick={(e) => openMenu(item.id, e, "left")}
              onMouseEnter={(e) => handleItemHoverSwitch(item.id, e, "left")}
            />
          ))}

          {overflowLeftItems.length > 0 && (
            <OverflowMenu
              items={overflowLeftItems}
              onSelectItem={(itemId) => openMenu(itemId, null, "left")}
              direction="left"
            />
          )}
        </div>

        {/* CENTER SAFE GAP (strictly reserved for Island Notch) */}
        <div
          style={{
            width: `${safeGapWidth}px`,
            height: "100%",
            flexShrink: 0,
            pointerEvents: "none",
          }}
        />

        {/* RIGHT ZONE: Live Status Chips, Battery, Volume, Bluetooth, Wi-Fi, Control Center, Clock */}
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
          {menuConfig.items?.statusChips !== false && (
            <StatusChips
              mediaTrack={mediaTrack}
              timerRunning={timerRunning}
              timerSecondsLeft={timerSecondsLeft}
              onChipClick={(chipType) => {
                if (chipType === "media") onOpenSettings?.("media");
                if (chipType === "timer") onOpenSettings?.("timer");
              }}
            />
          )}

          {/* Battery */}
          {menuConfig.items?.battery !== false && (
            <div
              id="menu-item-battery"
              onClick={(e) => openMenu("battery", e, "right")}
              onMouseEnter={(e) => handleItemHoverSwitch("battery", e, "right")}
            >
              <MenuBarBattery batteryInfo={batteryInfo} />
            </div>
          )}

          {/* Overflow Menu for Right Zone if constrained */}
          {overflowRightItems.length > 0 && (
            <OverflowMenu
              items={overflowRightItems}
              onSelectItem={(itemId) => openMenu(itemId, null, "right")}
              direction="right"
            />
          )}

          {/* Volume */}
          {visibleRightToggleables.some((i) => i.id === "volume") && (
            <MenuItem
              id="volume"
              icon={
                systemVolume.isMuted || systemVolume.volume === 0 ? (
                  <VolumeX size={14} color="#ff453a" />
                ) : systemVolume.volume < 35 ? (
                  <Volume size={14} />
                ) : systemVolume.volume < 70 ? (
                  <Volume1 size={14} />
                ) : (
                  <Volume2 size={14} />
                )
              }
              isOpen={activeMenu === "volume"}
              onClick={(e) => openMenu("volume", e, "right")}
              onMouseEnter={(e) => handleItemHoverSwitch("volume", e, "right")}
              title={`Sound Volume: ${systemVolume.isMuted ? "Muted" : `${systemVolume.volume}%`}`}
            />
          )}

          {/* Bluetooth */}
          {visibleRightToggleables.some((i) => i.id === "bluetooth") && (
            <MenuItem
              id="bluetooth"
              icon={<Bluetooth size={14} />}
              isOpen={activeMenu === "bluetooth"}
              onClick={(e) => openMenu("bluetooth", e, "right")}
              onMouseEnter={(e) => handleItemHoverSwitch("bluetooth", e, "right")}
              title="Bluetooth"
            />
          )}

          {/* Wi-Fi */}
          {visibleRightToggleables.some((i) => i.id === "wifi") && (
            <MenuItem
              id="wifi"
              icon={<Wifi size={14} />}
              isOpen={activeMenu === "wifi"}
              onClick={(e) => openMenu("wifi", e, "right")}
              onMouseEnter={(e) => handleItemHoverSwitch("wifi", e, "right")}
              title="Wi-Fi"
            />
          )}

          {/* Control Center */}
          {menuConfig.items?.controlCenter !== false && (
            <MenuItem
              id="control-center"
              icon={<Sliders size={14} />}
              isOpen={activeMenu === "control-center"}
              onClick={(e) => openMenu("control-center", e, "right")}
              onMouseEnter={(e) => handleItemHoverSwitch("control-center", e, "right")}
              title="Control Center"
            />
          )}

          {/* Clock */}
          {menuConfig.items?.clock !== false && (
            <div
              id="menu-item-clock"
              onClick={(e) => openMenu("clock", e, "right")}
              onMouseEnter={(e) => handleItemHoverSwitch("clock", e, "right")}
            >
              <MenuBarClock />
            </div>
          )}
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

      {/* 3. System Launcher Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "launcher"}
        onClose={() => setActiveMenu(null)}
        anchorLeft={panelAnchor.left}
        top={stripHeight + 4}
        width={250}
      >
        <LauncherDropdown onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 4. Drop Shelf Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "shelf"}
        onClose={() => setActiveMenu(null)}
        anchorLeft={panelAnchor.left}
        top={stripHeight + 4}
        width={260}
      >
        <ShelfDropdown onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 5. Scratchpad Notes Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "notes"}
        onClose={() => setActiveMenu(null)}
        anchorLeft={panelAnchor.left}
        top={stripHeight + 4}
        width={280}
      >
        <NotesDropdown onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 6. Clipboard History Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "clipboard"}
        onClose={() => setActiveMenu(null)}
        anchorLeft={panelAnchor.left}
        top={stripHeight + 4}
        width={300}
      >
        <ClipboardDropdown onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 7. Sound Volume Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "volume"}
        onClose={() => setActiveMenu(null)}
        anchorRight={panelAnchor.right}
        top={stripHeight + 4}
        width={270}
      >
        <VolumeDropdown onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 8. Bluetooth Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "bluetooth"}
        onClose={() => setActiveMenu(null)}
        anchorRight={panelAnchor.right}
        top={stripHeight + 4}
        width={270}
      >
        <BluetoothDropdown onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 9. Wi-Fi Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "wifi"}
        onClose={() => setActiveMenu(null)}
        anchorRight={panelAnchor.right}
        top={stripHeight + 4}
        width={270}
      >
        <WifiDropdown onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 10. Control Center Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "control-center"}
        onClose={() => setActiveMenu(null)}
        anchorRight={panelAnchor.right}
        top={stripHeight + 4}
        width={320}
      >
        <ControlCenter onClose={() => setActiveMenu(null)} onOpenSettings={onOpenSettings} />
      </DropdownPanel>

      {/* 11. Battery Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "battery"}
        onClose={() => setActiveMenu(null)}
        anchorRight={panelAnchor.right}
        top={stripHeight + 4}
        width={260}
      >
        <BatteryDropdown batteryInfo={batteryInfo} onClose={() => setActiveMenu(null)} />
      </DropdownPanel>

      {/* 12. Clock & Calendar Dropdown */}
      <DropdownPanel
        isOpen={activeMenu === "clock"}
        onClose={() => setActiveMenu(null)}
        anchorRight={panelAnchor.right}
        top={stripHeight + 4}
        width={310}
      >
        <ClockPanel
          onClose={() => setActiveMenu(null)}
          onStartTimer={onStartTimer}
          onStopTimer={onStopTimer}
          timerRunning={timerRunning}
          timerSecondsLeft={timerSecondsLeft}
        />
      </DropdownPanel>

      {/* 13. Dynamic Per-App Menu Dropdown (Part A) */}
      {activeMenu?.startsWith("app-menu-") && (
        <DropdownPanel
          isOpen={true}
          onClose={() => setActiveMenu(null)}
          anchorLeft={panelAnchor.left}
          top={stripHeight + 4}
          width={240}
        >
          <AppMenuDropdownContent
            menuIndex={parseInt(activeMenu.replace("app-menu-", ""), 10)}
            menus={currentAppMenuData.menus}
            onExecute={(item) => {
              if (window.electronAPI?.executeAppMenuItem) {
                window.electronAPI.executeAppMenuItem({
                  hwnd: currentAppMenuData.hwnd,
                  path: item.path,
                  cmdId: item.cmdId,
                  action: item.action,
                  layer: currentAppMenuData.layer,
                });
              }
            }}
            onClose={() => setActiveMenu(null)}
          />
        </DropdownPanel>
      )}
    </>
  );
}
