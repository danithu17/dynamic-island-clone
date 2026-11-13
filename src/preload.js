const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore, forward) => {
    return ipcRenderer.invoke('set-ignore-mouse-events', ignore, forward);
  },
  getSystemMedia: () => ipcRenderer.invoke('get-system-media'),
  controlSystemMedia: (command, ...args) => ipcRenderer.invoke('control-system-media', command, ...args),
  controlSystemVolume: (action) => ipcRenderer.invoke('control-system-volume', action),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  restorePreviousFocus: () => ipcRenderer.invoke('restore-previous-focus'),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  setDisplay: (displayId) => ipcRenderer.invoke('set-display', displayId),
  updateWindowPosition: (xPerc, yPx) => ipcRenderer.invoke('update-window-position', xPerc, yPx),
  setAutoLaunch: (enable) => ipcRenderer.invoke('set-auto-launch', enable),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),
  setAlwaysOnTop: (enable) => ipcRenderer.invoke('set-always-on-top', enable),
  onAlwaysOnTopChange: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('always-on-top-changed', handler);
    return () => ipcRenderer.removeListener('always-on-top-changed', handler);
  },
  onIslandWake: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('island-wake', handler);
    return () => ipcRenderer.removeListener('island-wake', handler);
  },
  onIslandBlur: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('island:blur', handler);
    return () => ipcRenderer.removeListener('island:blur', handler);
  },
  onSystemResume: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('system-resume', handler);
    return () => ipcRenderer.removeListener('system-resume', handler);
  },
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  startUpdateDownload: () => ipcRenderer.invoke('start-update-download'),
  cancelUpdateDownload: () => ipcRenderer.invoke('cancel-update-download'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAutoDownloadInstall: () => ipcRenderer.invoke('get-auto-download-install'),
  setAutoDownloadInstall: (enable) => ipcRenderer.invoke('set-auto-download-install', enable),
  onUpdateEvent: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('update-event', handler);
    return () => ipcRenderer.removeListener('update-event', handler);
  },
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  openPath: (targetPath) => ipcRenderer.invoke('open-path', targetPath),
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  lockWorkstation: () => ipcRenderer.invoke('lock-workstation'),
  openWifiSettings: () => ipcRenderer.invoke('open-wifi-settings'),
  openBluetoothSettings: () => ipcRenderer.invoke('open-bluetooth-settings'),
  onNewDownload: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('alert:new-download', handler);
    return () => ipcRenderer.removeListener('alert:new-download', handler);
  },
  onVolumeChange: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('alert:volume-change', handler);
    return () => ipcRenderer.removeListener('alert:volume-change', handler);
  },
  getSystemBrightness: () => ipcRenderer.invoke('get-system-brightness'),
  setSystemBrightness: (val) => ipcRenderer.invoke('set-system-brightness', val),
  getSystemVolume: () => ipcRenderer.invoke('get-system-volume'),
  setSystemVolume: (val) => ipcRenderer.invoke('set-system-volume', val),
  getSystemBattery: () => ipcRenderer.invoke('system:get-battery'),
  powerAction: (action) => ipcRenderer.invoke('system:power-action', action),
  openPowerSettings: () => ipcRenderer.invoke('system:open-power-settings'),
  openSoundSettings: () => ipcRenderer.invoke('system:open-sound-settings'),
  getPowerScheme: () => ipcRenderer.invoke('system:get-power-scheme'),
  setPowerScheme: (schemeId) => ipcRenderer.invoke('system:set-power-scheme', schemeId),
  onBrightnessChange: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('alert:brightness-change', handler);
    return () => ipcRenderer.removeListener('alert:brightness-change', handler);
  },
  logRendererError: (errorData) => ipcRenderer.invoke('log-renderer-error', errorData),
  // Menu Bar & AppBar APIs
  getMenuBarConfig: () => ipcRenderer.invoke("menubar:get-config"),
  setIslandMode: (mode) => ipcRenderer.invoke("menubar:set-mode", mode),
  setStripHeight: (height) => ipcRenderer.invoke("menubar:set-strip-height", height),
  setStripMargin: (margin) => ipcRenderer.invoke("menubar:set-strip-margin", margin),
  setFullscreenBehavior: (behavior) => ipcRenderer.invoke("menubar:set-fullscreen-behavior", behavior),
  setMenuBarBackground: (bg) => ipcRenderer.invoke("menubar:set-background", bg),
  setMenuItemsVisibility: (items) => ipcRenderer.invoke("menubar:set-items-visibility", items),
  setMenuBarDisplayScope: (scope) => ipcRenderer.invoke("menubar:set-display-scope", scope),
  releaseReservedSpace: () => ipcRenderer.invoke("menubar:release-reserved-space"),
  getActiveApp: () => ipcRenderer.invoke("menubar:get-active-app"),
  onActiveAppChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on("menubar:active-app-changed", handler);
    return () => ipcRenderer.removeListener("menubar:active-app-changed", handler);
  },
  onFullscreenChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on("menubar:fullscreen-changed", handler);
    return () => ipcRenderer.removeListener("menubar:fullscreen-changed", handler);
  },
  onIslandModeChanged: (callback) => {
    const handler = (event, mode) => callback(mode);
    ipcRenderer.on("menubar:mode-changed", handler);
    return () => ipcRenderer.removeListener("menubar:mode-changed", handler);
  },
  onMenuBarConfigChanged: (callback) => {
    const handler = (event, config) => callback(config);
    ipcRenderer.on("menubar:config-changed", handler);
    return () => ipcRenderer.removeListener("menubar:config-changed", handler);
  },
  // Clipboard & System Launcher APIs
  getClipboardHistory: () => ipcRenderer.invoke("clipboard:get-history"),
  writeClipboardText: (text) => ipcRenderer.invoke("clipboard:write-text", text),
  clearClipboardHistory: () => ipcRenderer.invoke("clipboard:clear"),
  launchApp: (appKey) => ipcRenderer.invoke("system:launch-app", appKey),
  quitApp: () => ipcRenderer.invoke("app:quit"),
  relaunchApp: () => ipcRenderer.invoke("app:relaunch"),
  // Per-App Menu APIs (Part A)
  onAppMenusChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on("menubar:app-menus-changed", handler);
    return () => ipcRenderer.removeListener("menubar:app-menus-changed", handler);
  },
  getCurrentAppMenus: () => ipcRenderer.invoke("appmenu:get-current"),
  executeAppMenuItem: (itemData) => ipcRenderer.invoke("appmenu:execute-item", itemData),
  getAppMenuProfiles: () => ipcRenderer.invoke("appmenu:get-profiles"),
  saveAppMenuProfile: (profileData) => ipcRenderer.invoke("appmenu:save-profile", profileData),
  resetAppMenuProfiles: () => ipcRenderer.invoke("appmenu:reset-profiles"),
  setAppMenuEnabled: (enabled) => ipcRenderer.invoke("appmenu:set-enabled", enabled),
  onOpenFirstMenu: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("menubar:open-first-menu", handler);
    return () => ipcRenderer.removeListener("menubar:open-first-menu", handler);
  },
  onKeyboardVolumeChange: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('menubar:volume-change', handler);
    return () => ipcRenderer.removeListener('menubar:volume-change', handler);
  },
  onSystemResume: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("system-resume", handler);
    return () => ipcRenderer.removeListener("system-resume", handler);
  },
  onSystemSuspend: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("system-suspend", handler);
    return () => ipcRenderer.removeListener("system-suspend", handler);
  },
  onSystemLock: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("system-lock", handler);
    return () => ipcRenderer.removeListener("system-lock", handler);
  },
  onSystemUnlock: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("system-unlock", handler);
    return () => ipcRenderer.removeListener("system-unlock", handler);
  },
  onSystemThemeUpdated: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on("system-theme-updated", handler);
    return () => ipcRenderer.removeListener("system-theme-updated", handler);
  },
  onKeyboardMediaChange: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('menubar:media-change', handler);
    return () => ipcRenderer.removeListener('menubar:media-change', handler);
  },
  // Standalone Settings Window & Store APIs
  openSettingsWindow: (section) => ipcRenderer.invoke("settings:open-window", section),
  getSettings: () => ipcRenderer.invoke("settings:get-all"),
  getSetting: (key) => ipcRenderer.invoke("settings:get", key),
  setSetting: (key, value) => ipcRenderer.invoke("settings:set", key, value),
  setMultipleSettings: (obj) => ipcRenderer.invoke("settings:set-multiple", obj),
  resetSection: (section) => ipcRenderer.invoke("settings:reset-section", section),
  resetAllSettings: () => ipcRenderer.invoke("settings:reset-all"),
  onSettingsChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on("settings:changed", handler);
    return () => ipcRenderer.removeListener("settings:changed", handler);
  },
  onNavigateSection: (callback) => {
    const handler = (event, section) => callback(section);
    ipcRenderer.on("settings:navigate-section", handler);
    return () => ipcRenderer.removeListener("settings:navigate-section", handler);
  },
  clearShelf: () => ipcRenderer.invoke("shelf:clear"),
  clearNotes: () => ipcRenderer.invoke("notes:clear"),
  deleteAllUserData: () => ipcRenderer.invoke("app:delete-all-data"),
  runSetupAgain: () => ipcRenderer.invoke("setup:run-again"),
  onStartFirstRun: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("first-run:start", handler);
    return () => ipcRenderer.removeListener("first-run:start", handler);
  },
  onCorruptRecovered: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("settings:corrupt-recovered", handler);
    return () => ipcRenderer.removeListener("settings:corrupt-recovered", handler);
  },
  platform: 'win32'
});
