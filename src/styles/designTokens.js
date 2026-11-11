/**
 * Aura Island Design Tokens
 * Windows 11 Native Island & Menu Bar System
 * Crisp Segoe UI Variable typography, hairline borders, consistent radii & colors
 */

export const designTokens = {
  colors: {
    barBg: "#0d0e11", // Solid dark bar background for full ClearType subpixel text rendering
    barBorder: "rgba(255, 255, 255, 0.08)",
    panelBg: "#16171b",
    panelBgGlass: "rgba(22, 23, 27, 0.94)",
    panelBorder: "rgba(255, 255, 255, 0.09)",
    islandBg: "#000000",
    itemHover: "rgba(255, 255, 255, 0.09)",
    itemActive: "rgba(255, 255, 255, 0.14)",
    textPrimary: "#ffffff",
    textSecondary: "rgba(255, 255, 255, 0.82)",
    textMuted: "rgba(255, 255, 255, 0.52)",
    textDisabled: "rgba(255, 255, 255, 0.28)",
    accentBlue: "#0a84ff",
    accentGreen: "#30d158",
    accentOrange: "#ff9f0a",
    accentRed: "#ff453a",
    separator: "rgba(255, 255, 255, 0.07)",
  },
  typography: {
    fontFamily: '"Segoe UI Variable Text", "Segoe UI Variable", "Segoe UI", Inter, -apple-system, system-ui, sans-serif',
    fontSmoothing: "antialiased",
    sizeBarItem: "13px",
    sizeSmall: "11px",
    sizeNormal: "12.5px",
    sizeTitle: "14px",
    weightRegular: 400,
    weightMedium: 500,
    weightSemibold: 600,
    weightBold: 700,
    letterSpacing: "-0.01em",
  },
  spacing: {
    barHeight: 34,
    barPaddingX: 8,
    menuItemPaddingX: 9,
    menuItemPaddingY: 4,
    panelPadding: 6,
    iconSize: 16,
    iconSmall: 14,
  },
  radii: {
    menuItem: 6,
    panel: 11,
    pill: 20,
    notchIdle: 14,
    notchExpanded: 24,
  },
  shadows: {
    panel: "0 18px 42px rgba(0, 0, 0, 0.55), 0 4px 14px rgba(0, 0, 0, 0.35)",
    notch: "0 4px 18px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.08)",
  },
};

/**
 * Pixel snap helper ensuring coordinates land on exact device physical pixels
 */
export const snapToPhysicalPixels = (dipValue, scaleFactor = window.devicePixelRatio || 1) => {
  return Math.round(dipValue * scaleFactor) / scaleFactor;
};

export default designTokens;
