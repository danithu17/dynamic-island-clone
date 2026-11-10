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
  platform: 'win32'
});
