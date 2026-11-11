import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
        const isMenuItemClick = e.target.closest?.("[id^='menu-item-']");
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ type: "spring", stiffness: 460, damping: 30 }}
          tabIndex={-1}
          style={{
            position: "fixed",
            top: `${top}px`,
            left: anchorLeft !== undefined ? `${anchorLeft}px` : "auto",
            right: anchorRight !== undefined ? `${anchorRight}px` : "auto",
            width: typeof width === "number" ? `${width}px` : width,
            maxHeight: `${maxHeight}px`,
            borderRadius: 12,
            background: "rgba(22, 22, 26, 0.92)",
            backdropFilter: "blur(32px) saturate(190%)",
            WebkitBackdropFilter: "blur(32px) saturate(190%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 18px 40px rgba(0, 0, 0, 0.55), 0 4px 14px rgba(0, 0, 0, 0.3)",
            color: "#ffffff",
            padding: "8px 6px",
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
