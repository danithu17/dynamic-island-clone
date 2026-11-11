const fs = require("fs");
const path = require("path");
const { app, BrowserWindow } = require("electron");

const CURRENT_VERSION = 1;

const DEFAULT_SETTINGS = {
  version: CURRENT_VERSION,
  general: {
    startWithWindows: false,
    language: "en",
    checkUpdates: true,
  },
  appearance: {
    theme: "dark", // "dark" | "light" | "auto"
    accentColor: "#0a84ff",
    font: "Segoe UI Variable",
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
  island: {
    idleSize: "compact", // "compact" | "minimal" | "hidden"
    hoverExpand: true,
    hoverDelayMs: 250,
    animations: true,
  },
  alerts: {
    enabled: true,
    duration: 4,
    sounds: false,
    types: {
      battery: true,
      downloads: true,
      timers: true,
      wifi: true,
      bluetooth: true,
      volume: true,
    },
  },
  shortcuts: {
    openSettings: "Ctrl+,",
    firstMenu: "Alt+F",
    toggleIsland: "Ctrl+Shift+Space",
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
  accounts: {
    gmail: { connected: false, email: "" },
    googleCalendar: { connected: false, email: "" },
    github: { connected: false, username: "" },
  },
  windowState: {
    width: 960,
    height: 640,
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
    this.load();
  }

  getStorePath() {
    try {
      const userData = app && typeof app.getPath === "function" ? app.getPath("userData") : process.cwd();
      return path.join(userData, "aura-settings.json");
    } catch (_) {
      return path.join(process.cwd(), "aura-settings.json");
    }
  }

  getLegacyPath() {
    try {
      const userData = app && typeof app.getPath === "function" ? app.getPath("userData") : process.cwd();
      return path.join(userData, "menubar-settings.json");
    } catch (_) {
      return path.join(process.cwd(), "menubar-settings.json");
    }
  }

  load() {
    let data = null;

    // 1. Try reading existing aura-settings.json
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, "utf8");
        data = JSON.parse(raw);
      } catch (err) {
        console.error("SettingsStore: Error reading aura-settings.json:", err);
      }
    }

    // 2. Migration from legacy config if first run or missing
    if (!data) {
      data = this.migrateFromLegacy();
    } else if (data.version < CURRENT_VERSION) {
      data = this.migrateSchema(data);
    }

    // 3. Deep merge with defaults and validate
    this.settings = this.mergeWithDefaults(data);
    this.validate(this.settings);
  }

  migrateFromLegacy() {
    const legacyPath = this.getLegacyPath();
    const migrated = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

    if (fs.existsSync(legacyPath)) {
      try {
        const raw = fs.readFileSync(legacyPath, "utf8");
        const legacy = JSON.parse(raw);
        if (legacy.islandPosition) migrated.menuBar.islandPosition = legacy.islandPosition;
        if (typeof legacy.stripHeight === "number") migrated.menuBar.stripHeight = legacy.stripHeight;
        if (typeof legacy.stripMargin === "number") migrated.menuBar.stripMargin = legacy.stripMargin;
        if (legacy.fullscreenBehavior) migrated.menuBar.fullscreenBehavior = legacy.fullscreenBehavior;
        if (legacy.menuBarBackground) migrated.menuBar.menuBarBackground = legacy.menuBarBackground;
        if (legacy.displayScope) migrated.menuBar.displayScope = legacy.displayScope;
        if (legacy.items && typeof legacy.items === "object") {
          migrated.menuBar.items = { ...migrated.menuBar.items, ...legacy.items };
        }
      } catch (_) {}
    }

    this.saveImmediate(migrated);
    return migrated;
  }

  migrateSchema(data) {
    const upgraded = { ...data, version: CURRENT_VERSION };
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
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
      console.error("SettingsStore: Failed to save aura-settings.json:", err);
    }
  }

  broadcastChange(keyPath, value) {
    // 1. Notify in-process subscribers
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
};
