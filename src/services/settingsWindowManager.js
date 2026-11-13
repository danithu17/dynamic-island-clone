const { BrowserWindow, screen, app } = require("electron");
const path = require("path");
const fs = require("fs");
const { settingsStore } = require("./settingsStore");

let settingsWindow = null;
let saveStateTimer = null;

function getIconPath() {
  const candidates = [
    path.join(__dirname, "../assets/icons/icon.ico"),
    path.join(__dirname, "assets/icons/icon.ico"),
    path.join(process.resourcesPath || "", "src/assets/icons/icon.ico"),
    path.join(app ? app.getAppPath() : process.cwd(), "src/assets/icons/icon.ico"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function getPreloadPath() {
  const candidates = [
    path.join(__dirname, "preload.js"),
    path.join(__dirname, "../src/preload.js"),
    path.join(app ? app.getAppPath() : process.cwd(), "src/preload.js"),
    path.join(app ? app.getAppPath() : process.cwd(), ".vite/build/preload.js"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, "preload.js");
}

function resolveSettingsUrl() {
  // 1. Electron Forge Vite dev server variable
  if (typeof SETTINGS_WINDOW_VITE_DEV_SERVER_URL !== "undefined" && SETTINGS_WINDOW_VITE_DEV_SERVER_URL) {
    return { type: "url", target: SETTINGS_WINDOW_VITE_DEV_SERVER_URL };
  }

  // 2. Production build file
  if (typeof SETTINGS_WINDOW_VITE_NAME !== "undefined" && SETTINGS_WINDOW_VITE_NAME) {
    const prodPath = path.join(__dirname, `../renderer/${SETTINGS_WINDOW_VITE_NAME}/index.html`);
    if (fs.existsSync(prodPath)) {
      return { type: "file", target: prodPath };
    }
  }

  const fileCandidates = [
    path.join(__dirname, "../renderer/settings_window/index.html"),
    path.join(app ? app.getAppPath() : process.cwd(), ".vite/renderer/settings_window/index.html"),
    path.join(__dirname, "../settings.html"),
    path.join(app ? app.getAppPath() : process.cwd(), "settings.html"),
  ];

  for (const p of fileCandidates) {
    if (fs.existsSync(p)) {
      return { type: "file", target: p };
    }
  }

  return { type: "file", target: path.join(__dirname, "../settings.html") };
}

function saveWindowState() {
  if (!settingsWindow || settingsWindow.isDestroyed()) return;
  try {
    const bounds = settingsWindow.getBounds();
    const curr = settingsStore.get("windowState") || {};
    settingsStore.set("windowState", {
      ...curr,
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
    });
  } catch (_) {}
}

function scheduleSaveWindowState() {
  if (saveStateTimer) clearTimeout(saveStateTimer);
  saveStateTimer = setTimeout(saveWindowState, 300);
}

function openSettingsWindow(section = "general") {
  // If already open, bring to front, focus, and navigate
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (settingsWindow.isMinimized()) settingsWindow.restore();
    settingsWindow.show();
    settingsWindow.focus();
    if (section) {
      settingsWindow.webContents.send("settings:navigate-section", section);
    }
    return settingsWindow;
  }

  const windowState = settingsStore.get("windowState") || {};
  const width = Math.max(760, windowState.width || 880);
  const height = Math.max(520, windowState.height || 620);

  let x = windowState.x;
  let y = windowState.y;

  // Validate coordinates against connected displays
  if (Number.isFinite(x) && Number.isFinite(y)) {
    try {
      const match = screen.getDisplayMatching({ x, y, width, height });
      if (!match) {
        x = undefined;
        y = undefined;
      }
    } catch (_) {
      x = undefined;
      y = undefined;
    }
  } else {
    x = undefined;
    y = undefined;
  }

  settingsWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 760,
    minHeight: 520,
    title: "Aura Island Settings",
    backgroundColor: "#16171b",
    backgroundMaterial: "mica", // Windows 11 mica/acrylic effect
    darkTheme: true,
    autoHideMenuBar: true,
    skipTaskbar: false,
    focusable: true,
    resizable: true,
    show: false,
    icon: getIconPath(),
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: !app.isPackaged,
      backgroundThrottling: false,
    },
  });

  const target = resolveSettingsUrl();
  if (target.type === "url") {
    settingsWindow.loadURL(target.target);
  } else {
    settingsWindow.loadFile(target.target);
  }

  settingsWindow.once("ready-to-show", () => {
    if (!settingsWindow || settingsWindow.isDestroyed()) return;
    settingsWindow.show();
    settingsWindow.focus();
    const targetSection = section || windowState.lastSection || "general";
    settingsWindow.webContents.send("settings:navigate-section", targetSection);
  });

  settingsWindow.on("resize", scheduleSaveWindowState);
  settingsWindow.on("move", scheduleSaveWindowState);

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });

  return settingsWindow;
}

function getSettingsWindow() {
  return settingsWindow;
}

function closeSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
    settingsWindow = null;
  }
}

module.exports = {
  openSettingsWindow,
  getSettingsWindow,
  closeSettingsWindow,
};
