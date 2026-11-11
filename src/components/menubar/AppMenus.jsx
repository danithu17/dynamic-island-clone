import React, { useState, useEffect, useRef } from "react";
import DropdownPanel from "./DropdownPanel";
import designTokens, { snapToPhysicalPixels } from "../../styles/designTokens";

export default function AppMenus({
  activeMenu,
  onOpenMenu,
  onHoverMenu,
  onCloseMenu,
}) {
  const [menuData, setMenuData] = useState({
    appName: "Desktop",
    layer: "generic",
    menus: [],
    hwnd: 0,
    isElevated: false,
  });

  const menusRef = useRef(menuData.menus);
  menusRef.current = menuData.menus;

  // Subscribe to app menu updates from main process
  useEffect(() => {
    if (!window.electronAPI?.onAppMenusChanged) return;
    const unsub = window.electronAPI.onAppMenusChanged((data) => {
      if (data && Array.isArray(data.menus)) {
        setMenuData(data);
      }
    });

    // Initial fetch
    if (window.electronAPI?.getCurrentAppMenus) {
      window.electronAPI.getCurrentAppMenus().then((data) => {
        if (data && Array.isArray(data.menus)) {
          setMenuData(data);
        }
      }).catch(() => {});
    }

    return () => unsub?.();
  }, []);

  // Listen for Alt+F shortcut to open the first menu
  useEffect(() => {
    if (!window.electronAPI?.onOpenFirstMenu) return;
    const unsub = window.electronAPI.onOpenFirstMenu(() => {
      if (menusRef.current && menusRef.current.length > 0) {
        const firstMenuId = `app-menu-0`;
        const firstElem = document.getElementById(firstMenuId);
        if (firstElem) {
          const rect = firstElem.getBoundingClientRect();
          onOpenMenu?.(firstMenuId, { left: rect.left, right: undefined });
        } else {
          onOpenMenu?.(firstMenuId, { left: 140, right: undefined });
        }
      }
    });
    return () => unsub?.();
  }, [onOpenMenu]);

  // Global Esc key to close any active menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && activeMenu) {
        onCloseMenu?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMenu, onCloseMenu]);

  const handleItemClick = (menuId, index, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onOpenMenu?.(menuId, { left: Math.max(8, rect.left), right: undefined });
  };

  const handleItemHover = (menuId, index, event) => {
    if (activeMenu && activeMenu.startsWith("app-menu-") && activeMenu !== menuId) {
      const rect = event.currentTarget.getBoundingClientRect();
      onHoverMenu?.(menuId, { left: Math.max(8, rect.left), right: undefined });
    }
  };

  const handleExecuteAction = async (item) => {
    if (item.enabled === false) return;
    onCloseMenu?.();

    if (window.electronAPI?.executeAppMenuItem) {
      try {
        await window.electronAPI.executeAppMenuItem({
          hwnd: menuData.hwnd,
          path: item.path,
          cmdId: item.cmdId,
          action: item.action,
          layer: menuData.layer,
        });
      } catch (err) {
        console.error("Failed to execute menu item:", err);
      }
    }
  };

  const getLayerBadge = () => {
    let text = "Generic";
    let bg = "rgba(255, 255, 255, 0.08)";
    let color = "rgba(255, 255, 255, 0.45)";

    if (menuData.layer === "mirror") {
      text = "Mirror";
      bg = "rgba(48, 209, 88, 0.14)";
      color = "#30d158";
    } else if (menuData.layer === "profile") {
      text = "Profile";
      bg = "rgba(10, 132, 255, 0.14)";
      color = "#64b5f6";
    }

    return (
      <span
        title={`Per-App Menu Strategy: ${text}${menuData.isElevated ? " (Elevated Admin App)" : ""}`}
        style={{
          fontSize: 9.5,
          fontWeight: 600,
          padding: "1px 5px",
          borderRadius: 4,
          background: bg,
          color,
          letterSpacing: "0.2px",
          textTransform: "uppercase",
          fontFamily: 'Consolas, "Segoe UI Mono", monospace',
          marginLeft: 3,
          marginRight: 4,
          alignSelf: "center",
          userSelect: "none",
        }}
      >
        {text}
        {menuData.isElevated && " · ADMIN"}
      </span>
    );
  };

  const menus = menuData.menus || [];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "100%",
        fontFamily: designTokens.typography.fontFamily,
      }}
    >
      {/* Layer Debug Badge */}
      {menus.length > 0 && getLayerBadge()}

      {/* Top-level menu labels */}
      {menus.map((menu, idx) => {
        const menuId = `app-menu-${idx}`;
        const isOpen = activeMenu === menuId;

        return (
          <div
            key={menuId}
            id={menuId}
            onClick={(e) => handleItemClick(menuId, idx, e)}
            onMouseEnter={(e) => handleItemHover(menuId, idx, e)}
            style={{
              padding: "3px 8.5px",
              borderRadius: designTokens.radii.menuItem,
              cursor: "pointer",
              fontSize: designTokens.typography.sizeBarItem,
              fontWeight: isOpen ? designTokens.typography.weightSemibold : designTokens.typography.weightMedium,
              color: isOpen ? "#ffffff" : designTokens.colors.textSecondary,
              backgroundColor: isOpen ? designTokens.colors.itemActive : "transparent",
              transition: "background 0.12s ease, color 0.12s ease",
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            {menu.label}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Dropdown Menu content renderer for an active app menu
 */
export function AppMenuDropdownContent({ menuIndex, menus, onExecute, onClose }) {
  if (!menus || !menus[menuIndex]) return null;
  const menu = menus[menuIndex];
  const items = menu.items || [];

  return (
    <div
      style={{
        minWidth: 210,
        maxWidth: 290,
        padding: "4px 0",
        fontFamily: designTokens.typography.fontFamily,
        fontSize: designTokens.typography.sizeNormal,
        color: designTokens.colors.textPrimary,
        userSelect: "none",
      }}
    >
      {items.map((item, i) => {
        if (item.type === "separator") {
          return (
            <div
              key={`sep-${i}`}
              style={{
                height: 1,
                background: designTokens.colors.separator,
                margin: "4px 8px",
              }}
            />
          );
        }

        const isEnabled = item.enabled !== false;

        return (
          <div
            key={`item-${i}`}
            onClick={() => {
              if (isEnabled) {
                onExecute?.(item);
                onClose?.();
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4.5px 10px",
              margin: "1px 4px",
              borderRadius: designTokens.radii.menuItem,
              cursor: isEnabled ? "pointer" : "default",
              opacity: isEnabled ? 1 : 0.35,
              transition: "background 0.1s ease",
            }}
            onMouseEnter={(e) => {
              if (isEnabled) {
                e.currentTarget.style.backgroundColor = designTokens.colors.itemHover;
              }
            }}
            onMouseLeave={(e) => {
              if (isEnabled) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 450,
                color: isEnabled ? "#ffffff" : designTokens.colors.textDisabled,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginRight: 14,
              }}
            >
              {item.label}
            </span>

            {item.shortcut && (
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'Consolas, "Segoe UI Variable Text", system-ui, sans-serif',
                  color: isEnabled ? "rgba(255, 255, 255, 0.45)" : designTokens.colors.textDisabled,
                  letterSpacing: "0.2px",
                  flexShrink: 0,
                }}
              >
                {item.shortcut}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
