import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import designTokens, { snapToPhysicalPixels } from "../../styles/designTokens";

export default function DropdownPanel({
  isOpen = false,
  onClose,
  anchorLeft,
  anchorRight,
  top = 38,
  width = 260,
  maxHeight = 440,
  children,
}) {
  const panelRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    window.electronAPI?.setIgnoreMouseEvents?.(false);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    const handleMouseDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Also check if the click was on a menu item
        const isMenuItemClick = e.target.closest?.("[id^='menu-item-']") || e.target.closest?.("[id^='app-menu-']");
        if (!isMenuItemClick) {
          onClose?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isOpen, onClose]);

  const snapTop = snapToPhysicalPixels(top);
  const snapLeft = anchorLeft !== undefined ? snapToPhysicalPixels(anchorLeft) : undefined;
  const snapRight = anchorRight !== undefined ? snapToPhysicalPixels(anchorRight) : undefined;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={designTokens.motion.springTab}
          tabIndex={-1}
          style={{
            position: "fixed",
            top: `${snapTop}px`,
            left: snapLeft !== undefined ? `${snapLeft}px` : "auto",
            right: snapRight !== undefined ? `${snapRight}px` : "auto",
            width: typeof width === "number" ? `${snapToPhysicalPixels(width)}px` : width,
            maxHeight: `${maxHeight}px`,
            borderRadius: designTokens.radii.panel,
            background: designTokens.colors.panelBg,
            border: `1px solid ${designTokens.colors.panelBorder}`,
            boxShadow: designTokens.shadows.panel,
            color: designTokens.colors.textPrimary,
            fontFamily: designTokens.typography.fontFamily,
            WebkitFontSmoothing: "antialiased",
            textRendering: "optimizeLegibility",
            padding: "6px 4px",
            boxSizing: "border-box",
            zIndex: 999998,
            overflowY: "auto",
            scrollbarWidth: "none",
            pointerEvents: "auto",
            userSelect: "none",
            outline: "none",
          }}
          onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents?.(false)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
