const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore, forward) => {
    return ipcRenderer.invoke('set-ignore-mouse-events', ignore, forward);
  },
  getSystemMedia: () => ipcRenderer.invoke('get-system-media'),
  controlSystemMedia: (command, ...args) => ipcRenderer.invoke('control-system-media', command, ...args),
  controlSystemVolume: (action) => ipcRenderer.invoke('control-system-volume', action),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
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
  logRendererError: (errorData) => ipcRenderer.invoke('log-renderer-error', errorData),
  // Menu Bar & AppBar APIs
  getMenuBarConfig: () => ipcRenderer.invoke("menubar:get-config"),
  setIslandMode: (mode) => ipcRenderer.invoke("menubar:set-mode", mode),
  setStripHeight: (height) => ipcRenderer.invoke("menubar:set-strip-height", height),
  setStripMargin: (margin) => ipcRenderer.invoke("menubar:set-strip-margin", margin),
  setFullscreenBehavior: (behavior) => ipcRenderer.invoke("menubar:set-fullscreen-behavior", behavior),
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
  platform: 'win32'
});
