const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Settings Store APIs
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

  // Display & Launcher APIs
  getDisplays: () => ipcRenderer.invoke("get-displays"),
  setDisplay: (id) => ipcRenderer.invoke("set-display", id),
  setAutoLaunch: (enable) => ipcRenderer.invoke("set-auto-launch", enable),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  // Menu Profiles APIs
  getAppMenuProfiles: () => ipcRenderer.invoke("appmenu:get-profiles"),
  saveAppMenuProfile: (profileData) => ipcRenderer.invoke("appmenu:save-profile", profileData),
  resetAppMenuProfiles: () => ipcRenderer.invoke("appmenu:reset-profiles"),

  // Data & Privacy cleanup actions
  clearShelf: () => ipcRenderer.invoke("shelf:clear"),
  clearClipboardHistory: () => ipcRenderer.invoke("clipboard:clear"),
  clearNotes: () => ipcRenderer.invoke("notes:clear"),

  platform: "win32",
});
