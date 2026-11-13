/**
 * Aura Island Design Tokens
 * Windows 11 Native Island & Menu Bar System
 * Razor sharp Segoe UI Variable typography, solid ClearType surfaces, consistent 8px grid & radii
 */

export const designTokens = {
  colors: {
    barBg: "#0d0e11", // Solid dark bar background for full ClearType subpixel text rendering
    barBorder: "rgba(255, 255, 255, 0.08)",
    panelBg: "#16171b", // Solid opaque surface behind all panel text
    panelBgGlass: "#16171b", // Solid fallback surface
    panelBorder: "rgba(255, 255, 255, 0.09)",
    islandBg: "#000000", // Deep opaque black shell to guarantee subpixel font antialiasing
    itemHover: "rgba(255, 255, 255, 0.09)",
    itemActive: "rgba(255, 255, 255, 0.14)",
    textPrimary: "#ffffff",
    textSecondary: "rgba(255, 255, 255, 0.82)",
    textMuted: "rgba(255, 255, 255, 0.58)",
    textDisabled: "rgba(255, 255, 255, 0.32)",
    accentBlue: "#0a84ff",
    accentGreen: "#30d158",
    accentOrange: "#ff9f0a",
    accentRed: "#ff453a",
    separator: "rgba(255, 255, 255, 0.07)",
  },
  typography: {
    fontFamily: '"Segoe UI Variable Text", "Segoe UI Variable", "Segoe UI", Inter, -apple-system, system-ui, sans-serif',
    fontSmoothing: "antialiased",
    sizeSmall: "11px",
    sizeBarItem: "13px",
    sizeNormal: "13px",
    sizeMedium: "15px",
    sizeTitle: "15px",
    sizeHeader: "28px",
    weightRegular: 400,
    weightMedium: 500, // Minimum weight for small text to avoid blur on high-DPI displays
    weightSemibold: 600,
    weightBold: 700,
    letterSpacing: "-0.01em",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    barHeight: 34,
    barPaddingX: 8,
    menuItemPaddingX: 9,
    menuItemPaddingY: 4,
    panelPadding: 8,
    iconSize: 20,
    iconSmall: 16,
    iconMini: 14,
    minHitTarget: 32, // Minimum 32px hit target
  },
  radii: {
    menuItem: 6,
    panel: 14,
    notchIdle: 14,
    pill: 20,
    medium: 20,
    notchExpanded: 28,
    large: 28,
    extraLarge: 34,
  },
  motion: {
    springExpand: {
      type: "spring",
      stiffness: 350,
      damping: 28,
      mass: 0.65,
    },
    springCollapse: {
      type: "spring",
      stiffness: 420,
      damping: 34,
      mass: 0.65,
    },
    springTab: {
      type: "spring",
      stiffness: 400,
      damping: 32,
      mass: 0.6,
    },
    springAlert: {
      type: "spring",
      stiffness: 450,
      damping: 30,
      mass: 0.75,
    },
    springPress: {
      type: "spring",
      stiffness: 500,
      damping: 25,
      mass: 0.5,
    },
    reduced: {
      duration: 0.001,
    },
    durations: {
      fast: 0.12,
      normal: 0.22,
      slow: 0.35,
    },
    easings: {
      default: [0.16, 1, 0.3, 1],
      outExpo: [0.19, 1, 0.22, 1],
    },
  },
  shadows: {
    panel: "0 18px 42px rgba(0, 0, 0, 0.55), 0 4px 14px rgba(0, 0, 0, 0.35)",
    notch: "none", // No shadows on resting shell per design audit
    expanded: "0 24px 60px rgba(0, 0, 0, 0.8), 0 4px 16px rgba(0, 0, 0, 0.4)",
  },
};

/**
 * Pixel snap helper ensuring coordinates land on exact device physical pixels.
 * Computes in device pixels, rounds, and converts back.
 */
export const snapToPhysicalPixels = (dipValue, scaleFactor = (typeof window !== "undefined" && window.devicePixelRatio) || 1) => {
  if (typeof dipValue !== "number" || isNaN(dipValue)) return dipValue;
  return Math.round(dipValue * scaleFactor) / scaleFactor;
};

/**
 * Snap a rectangular bounding box to whole device pixels.
 */
export const snapBoundsToDevicePixels = (bounds, scaleFactor = (typeof window !== "undefined" && window.devicePixelRatio) || 1) => {
  if (!bounds) return bounds;
  return {
    x: Math.round(bounds.x * scaleFactor) / scaleFactor,
    y: Math.round(bounds.y * scaleFactor) / scaleFactor,
    width: Math.round(bounds.width * scaleFactor) / scaleFactor,
    height: Math.round(bounds.height * scaleFactor) / scaleFactor,
  };
};

export default designTokens;
