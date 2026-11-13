const fs = require("fs");
const path = require("path");
const os = require("os");
const { app, BrowserWindow } = require("electron");

const CURRENT_SCHEMA_VERSION = 1;

const DEFAULT_SETTINGS = {
  version: CURRENT_SCHEMA_VERSION,
  schemaVersion: CURRENT_SCHEMA_VERSION,
  general: {
    displayName: "User",
    language: "en",
    startWithWindows: false,
    checkHotkey: "Ctrl+Alt+,",
    targetDisplay: "primary",
    checkUpdates: true,
  },
  island: {
    style: "notch", // "notch" | "floating"
    idleSize: "compact", // "compact" | "minimal" | "hidden"
    hoverDelay: 180, // 120-400ms
    collapseDelay: 350, // 200-800ms
    animationSpeed: "normal", // "gentle" | "normal" | "fast"
    reduceMotion: false,
    autoHideFullscreen: true,
    mascotEyes: true,
    hoverExpand: true,
    hoverDelayMs: 180,
    animations: true,
  },
  appearance: {
    theme: "dark", // "dark" | "match-system" | "light" | "auto"
    accentColor: "#0a84ff",
    textSize: "medium", // "small" | "medium" | "large"
    largeClock: false,
    font: "Segoe UI Variable",
  },
  alerts: {
    enabled: true,
    duration: 4,
    sounds: false,
    dndSchedule: {
      enabled: false,
      startTime: "22:00",
      endTime: "07:00",
    },
    types: {
      charging: { enabled: true, sound: false, duration: 4 },
      battery: { enabled: true, sound: true, duration: 4 },
      screenshots: { enabled: true, sound: true, duration: 4 },
      downloads: { enabled: true, sound: true, duration: 4 },
      timer: { enabled: true, sound: true, duration: 5 },
      gmail: { enabled: true, sound: true, duration: 4 },
      aiAgent: { enabled: true, sound: false, duration: 4 },
      usbDevices: { enabled: true, sound: true, duration: 4 },
      volumeHud: { enabled: true, sound: false, duration: 2 },
      // Legacy boolean flags for backwards-compatibility
      wifi: true,
      bluetooth: true,
      volume: true,
      timers: true,
    },
  },
  homeDock: {
    homeChips: ["weather", "media", "calendar", "battery"],
    dockTabs: ["apps", "media", "calendar", "stats", "notes"],
    quickLauncher: [
      { id: "chrome", name: "Chrome", type: "app", target: "chrome.exe", icon: "globe" },
      { id: "code", name: "VS Code", type: "app", target: "code.exe", icon: "code" },
      { id: "terminal", name: "Terminal", type: "app", target: "wt.exe", icon: "terminal" },
      { id: "explorer", name: "Files", type: "app", target: "explorer.exe", icon: "folder" },
    ],
  },
  clipboard: {
    enabled: true,
    historySize: 50,
    appsToIgnore: ["1Password.exe", "KeePass.exe", "Bitwarden.exe"],
    secretFilter: true,
  },
  trayStorage: {
    folder: "",
    dropMode: "copy", // "copy" | "move" | "link"
    autoCleanDays: 0,
  },
  notesSnippets: {
    folder: "",
    defaultVariables: { author: "User", date_format: "YYYY-MM-DD" },
  },
  accounts: {
    google: { connected: false, email: "", scopes: ["Gmail read", "Drafts", "Calendar read"] },
    aiProvider: "gemini", // "gemini" | "openai" | "anthropic" | "local"
    gmail: { connected: false, email: "" },
    googleCalendar: { connected: false, email: "" },
    github: { connected: false, username: "" },
  },
  focusTimer: {
    pomodoroLength: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStartBreaks: false,
    silenceNotifications: true,
  },
  shortcuts: {
    openSettings: "Ctrl+,",
    toggleIsland: "Ctrl+Shift+Space",
    firstMenu: "Alt+F",
    quickNote: "Ctrl+Alt+N",
    clipboardHistory: "Ctrl+Alt+V",
    takeScreenshot: "Ctrl+Shift+S",
  },
  privacy: {
    telemetry: false,
    readClipboard: true,
    readMedia: true,
    readBattery: true,
    readDownloads: true,
    readScreenshots: true,
  },
  updates: {
    autoCheck: true,
    channel: "stable", // "stable" | "beta"
    lastChecked: null,
    skipVersion: null,
  },
  firstRun: {
    completed: true,
    step: 1,
  },
  menuBar: {
    islandPosition: "reserved", // "reserved" | "overlay" | "autohide"
    stripHeight: 34,
    stripMargin: 0,
    menuBarBackground: "acrylic", // "acrylic" | "black" | "darkgray"
    fullscreenBehavior: "hide", // "hide" | "collapse"
    displayScope: "primary", // "primary" | "all"
    items: {
      activeApp: true,
      perAppMenus: true,
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
  },
  features: {
    perAppMenus: true,
    shelf: true,
    clipboard: true,
    notes: true,
    focusTimer: true,
    mediaControls: true,
    gitStatus: false,
    phoneLink: false,
  },
  windowState: {
    width: 880,
    height: 620,
    x: null,
    y: null,
    lastSection: "general",
  },
};

class SettingsStore {
  constructor() {
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    this.filePath = this.getStorePath();
    this.saveTimeout = null;
    this.listeners = new Set();
    this.hasRecoveredFromCorrupt = false;
    this.load();
  }

  getStorePath() {
    try {
      const appData =
        process.env.APPDATA ||
        (app && typeof app.getPath === "function" ? app.getPath("appData") : path.join(os.homedir(), "AppData", "Roaming"));
      return path.join(appData, "AuraIsland", "settings.json");
    } catch (_) {
      return path.join(process.cwd(), "settings.json");
    }
  }

  getLegacyPaths() {
    const list = [];
    try {
      const userData = app && typeof app.getPath === "function" ? app.getPath("userData") : process.cwd();
      list.push(path.join(userData, "aura-settings.json"));
      list.push(path.join(userData, "settings.json"));
      list.push(path.join(userData, "menubar-settings.json"));
    } catch (_) {}
    list.push(path.join(process.cwd(), "aura-settings.json"));
    list.push(path.join(process.cwd(), "settings.json"));
    return list;
  }

  load() {
    let data = null;
    let isCorrupted = false;

    // 1. Try reading existing %APPDATA%\AuraIsland\settings.json
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, "utf8");
        data = JSON.parse(raw);
      } catch (err) {
        console.error("SettingsStore: Error reading settings.json, corrupted:", err);
        isCorrupted = true;
      }
    }

    // 2. Corrupt-file fallback
    if (isCorrupted) {
      const bakPath = this.filePath + ".bak";
      if (fs.existsSync(bakPath)) {
        try {
          const rawBak = fs.readFileSync(bakPath, "utf8");
          data = JSON.parse(rawBak);
          console.warn("SettingsStore: Successfully recovered from settings.json.bak");
        } catch (_) {}
      }
      if (!data) {
        try {
          fs.copyFileSync(this.filePath, `${this.filePath}.corrupt.${Date.now()}`);
        } catch (_) {}
        data = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      }
      this.hasRecoveredFromCorrupt = true;
      this.saveImmediate(data);
    }

    // 3. Migration from legacy config if first run or missing
    if (!data) {
      data = this.migrateFromLegacy();
    } else if ((data.schemaVersion || data.version || 0) < CURRENT_SCHEMA_VERSION) {
      data = this.migrateSchema(data);
    }

    // 4. Deep merge with defaults and validate
    this.settings = this.mergeWithDefaults(data);
    this.validate(this.settings);
  }

  migrateFromLegacy() {
    const migrated = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    const legacyPaths = this.getLegacyPaths();

    for (const legacyPath of legacyPaths) {
      if (fs.existsSync(legacyPath)) {
        try {
          const raw = fs.readFileSync(legacyPath, "utf8");
          const legacy = JSON.parse(raw);
          if (legacy && typeof legacy === "object") {
            if (legacy.general) Object.assign(migrated.general, legacy.general);
            if (legacy.appearance) Object.assign(migrated.appearance, legacy.appearance);
            if (legacy.island) Object.assign(migrated.island, legacy.island);
            if (legacy.menuBar) Object.assign(migrated.menuBar, legacy.menuBar);
            if (legacy.alerts) Object.assign(migrated.alerts, legacy.alerts);
            if (legacy.shortcuts) Object.assign(migrated.shortcuts, legacy.shortcuts);
            if (legacy.features) Object.assign(migrated.features, legacy.features);
            if (legacy.accounts) Object.assign(migrated.accounts, legacy.accounts);
            if (legacy.windowState) Object.assign(migrated.windowState, legacy.windowState);
            break;
          }
        } catch (_) {}
      }
    }

    this.saveImmediate(migrated);
    return migrated;
  }

  migrateSchema(data) {
    const upgraded = { ...data, schemaVersion: CURRENT_SCHEMA_VERSION, version: CURRENT_SCHEMA_VERSION };
    return upgraded;
  }

  mergeWithDefaults(data) {
    if (!data || typeof data !== "object") {
      return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }

    const merge = (target, source) => {
      const output = { ...target };
      for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
          output[key] = merge(target[key] || {}, source[key]);
        } else if (target[key] !== undefined) {
          output[key] = target[key];
        } else {
          output[key] = source[key];
        }
      }
      return output;
    };

    return merge(data, DEFAULT_SETTINGS);
  }

  validate(s) {
    if (s.island) {
      if (!["notch", "floating"].includes(s.island.style)) {
        s.island.style = "notch";
      }
      if (!["compact", "minimal", "hidden"].includes(s.island.idleSize)) {
        s.island.idleSize = "compact";
      }
      if (typeof s.island.hoverDelay !== "number" || isNaN(s.island.hoverDelay)) {
        s.island.hoverDelay = 180;
      } else {
        s.island.hoverDelay = Math.max(120, Math.min(400, Math.round(s.island.hoverDelay)));
      }
      if (typeof s.island.collapseDelay !== "number" || isNaN(s.island.collapseDelay)) {
        s.island.collapseDelay = 350;
      } else {
        s.island.collapseDelay = Math.max(200, Math.min(800, Math.round(s.island.collapseDelay)));
      }
    }

    if (s.menuBar) {
      if (!["reserved", "overlay", "autohide"].includes(s.menuBar.islandPosition)) {
        s.menuBar.islandPosition = "reserved";
      }
      if (typeof s.menuBar.stripHeight !== "number" || s.menuBar.stripHeight < 24 || s.menuBar.stripHeight > 80) {
        s.menuBar.stripHeight = 34;
      }
      if (typeof s.menuBar.stripMargin !== "number" || s.menuBar.stripMargin < 0 || s.menuBar.stripMargin > 40) {
        s.menuBar.stripMargin = 0;
      }
      if (!["acrylic", "black", "darkgray"].includes(s.menuBar.menuBarBackground)) {
        s.menuBar.menuBarBackground = "acrylic";
      }
    }

    if (s.alerts) {
      if (typeof s.alerts.duration !== "number" || s.alerts.duration < 1 || s.alerts.duration > 15) {
        s.alerts.duration = 4;
      }
    }

    if (s.clipboard) {
      if (typeof s.clipboard.historySize !== "number" || s.clipboard.historySize < 10 || s.clipboard.historySize > 200) {
        s.clipboard.historySize = 50;
      }
    }
  }

  get(keyPath) {
    if (!keyPath) return this.settings;
    const parts = keyPath.split(".");
    let curr = this.settings;
    for (const p of parts) {
      if (curr && typeof curr === "object" && p in curr) {
        curr = curr[p];
      } else {
        return undefined;
      }
    }
    return curr;
  }

  set(keyPath, value) {
    const parts = keyPath.split(".");
    let curr = this.settings;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!curr[p] || typeof curr[p] !== "object") {
        curr[p] = {};
      }
      curr = curr[p];
    }
    curr[parts[parts.length - 1]] = value;

    this.validate(this.settings);
    this.scheduleSave();
    this.broadcastChange(keyPath, value);
    return true;
  }

  setMultiple(obj) {
    if (!obj || typeof obj !== "object") return false;
    for (const [k, v] of Object.entries(obj)) {
      this.set(k, v);
    }
    return true;
  }

  resetSection(section) {
    if (!DEFAULT_SETTINGS[section]) return false;
    this.settings[section] = JSON.parse(JSON.stringify(DEFAULT_SETTINGS[section]));
    this.scheduleSave();
    this.broadcastChange(section, this.settings[section]);
    return true;
  }

  resetAll() {
    const preservedWindow = { ...this.settings.windowState };
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    this.settings.windowState = preservedWindow;
    this.scheduleSave();
    this.broadcastChange("*", this.settings);
    return true;
  }

  scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate(this.settings);
    }, 150);
  }

  saveImmediate(data) {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Atomic write: write to temp file then rename
      const tmpPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
      fs.renameSync(tmpPath, this.filePath);

      // Keep a backup copy
      const bakPath = `${this.filePath}.bak`;
      try {
        fs.copyFileSync(this.filePath, bakPath);
      } catch (_) {}
    } catch (err) {
      console.error("SettingsStore: Failed atomic write of settings.json:", err);
    }
  }

  broadcastChange(keyPath, value) {
    // 1. In-process subscribers
    for (const fn of this.listeners) {
      try {
        fn(keyPath, value, this.settings);
      } catch (_) {}
    }

    // 2. Broadcast via IPC to all open BrowserWindows
    try {
      if (BrowserWindow && typeof BrowserWindow.getAllWindows === "function") {
        for (const win of BrowserWindow.getAllWindows()) {
          if (!win.isDestroyed()) {
            win.webContents.send("settings:changed", {
              key: keyPath,
              value,
              settings: this.settings,
            });
          }
        }
      }
    } catch (_) {}
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

const settingsStore = new SettingsStore();
module.exports = {
  settingsStore,
  SettingsStore,
  DEFAULT_SETTINGS,
  CURRENT_SCHEMA_VERSION,
};