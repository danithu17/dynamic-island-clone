"use strict";

const path = require("node:path");
const fs = require("fs");
const { app, screen, nativeImage } = require("electron");

let koffi = null;
try {
  koffi = require("koffi");
} catch (e) {
  console.error("Failed to load koffi:", e);
}

// Win32 Constants
const ABE_LEFT = 0;
const ABE_TOP = 1;
const ABE_RIGHT = 2;
const ABE_BOTTOM = 3;

const ABM_NEW = 0x00000000;
const ABM_REMOVE = 0x00000001;
const ABM_QUERYPOS = 0x00000002;
const ABM_SETPOS = 0x00000003;
const ABM_GETSTATE = 0x00000004;
const ABM_GETTASKBARPOS = 0x00000005;
const ABM_ACTIVATE = 0x00000006;
const ABM_GETAUTOHIDEBAR = 0x00000007;
const ABM_SETAUTOHIDEBAR = 0x00000008;
const ABM_WINDOWPOSCHANGED = 0x00000009;
const ABM_SETSTATE = 0x0000000A;

const ABN_STATECHANGE = 0x00000000;
const ABN_POSCHANGED = 0x00000001;
const ABN_FULLSCREENAPP = 0x00000002;
const ABN_WINDOWARRANGE = 0x00000003;

const WM_USER = 0x0400;
const WM_APPBAR_CALLBACK = WM_USER + 101;

// QUNS (Query User Notification State)
const QUNS_NOT_PRESENT = 1;
const QUNS_BUSY = 2;
const QUNS_RUNNING_D3D_FULL_SCREEN = 3;
const QUNS_PRESENTATION_MODE = 4;
const QUNS_ACCEPTS_NOTIFICATIONS = 5;
const QUNS_QUIET_TIME = 6;
const QUNS_APP = 7;

let shell32 = null;
let user32 = null;
let kernel32 = null;

let RECT = null;
let APPBARDATA = null;
let MONITORINFO = null;
let SHAppBarMessage = null;
let SHQueryUserNotificationState = null;
let GetForegroundWindow = null;
let GetWindowThreadProcessId = null;
let GetWindowRect = null;
let MonitorFromWindow = null;
let GetMonitorInfoW = null;
let OpenProcess = null;
let CloseHandle = null;
let QueryFullProcessImageNameW = null;
let SetWinEventHook = null;
let UnhookWinEvent = null;
let WinEventProc = null;

if (koffi && process.platform === "win32") {
  try {
    shell32 = koffi.load("shell32.dll");
    user32 = koffi.load("user32.dll");
    kernel32 = koffi.load("kernel32.dll");

    RECT = koffi.struct("APPBAR_RECT", {
      left: "long",
      top: "long",
      right: "long",
      bottom: "long",
    });

    APPBARDATA = koffi.struct("APPBARDATA", {
      cbSize: "uint32",
      hWnd: "uintptr_t",
      uCallbackMessage: "uint32",
      uEdge: "uint32",
      rc: RECT,
      lParam: "intptr_t",
    });

    MONITORINFO = koffi.struct("APPBAR_MONITORINFO", {
      cbSize: "uint32",
      rcMonitor: RECT,
      rcWork: RECT,
      dwFlags: "uint32",
    });

    SHAppBarMessage = shell32.func("uintptr_t __stdcall SHAppBarMessage(uint32 dwMessage, _Inout_ APPBARDATA *pData)");
    SHQueryUserNotificationState = shell32.func("int __stdcall SHQueryUserNotificationState(_Out_ int *pquns)");

    GetForegroundWindow = user32.func("uintptr_t __stdcall GetForegroundWindow()");
    GetWindowThreadProcessId = user32.func("uint32 __stdcall GetWindowThreadProcessId(uintptr_t hWnd, _Out_ uint32 *lpdwProcessId)");
    GetWindowRect = user32.func("int __stdcall GetWindowRect(uintptr_t hWnd, _Out_ APPBAR_RECT *lpRect)");
    MonitorFromWindow = user32.func("uintptr_t __stdcall MonitorFromWindow(uintptr_t hwnd, uint32 dwFlags)");
    GetMonitorInfoW = user32.func("int __stdcall GetMonitorInfoW(uintptr_t hMonitor, _Inout_ APPBAR_MONITORINFO *lpmi)");

    OpenProcess = kernel32.func("uintptr_t __stdcall OpenProcess(uint32 dwDesiredAccess, int bInheritHandle, uint32 dwProcessId)");
    CloseHandle = kernel32.func("int __stdcall CloseHandle(uintptr_t hObject)");
    QueryFullProcessImageNameW = kernel32.func("int __stdcall QueryFullProcessImageNameW(uintptr_t hProcess, uint32 dwFlags, _Out_ uint16 *lpExeName, _Inout_ uint32 *lpdwSize)");

    WinEventProc = koffi.proto("void __stdcall WinEventProc(uintptr_t hWinEventHook, uint32 event, uintptr_t hwnd, int32 idObject, int32 idChild, uint32 idEventThread, uint32 dwmsEventTime)");
    SetWinEventHook = user32.func("uintptr_t __stdcall SetWinEventHook(uint32 eventMin, uint32 eventMax, uintptr_t hmodWinEventProc, WinEventProc *pfnWinEventProc, uint32 idProcess, uint32 idThread, uint32 dwFlags)");
    UnhookWinEvent = user32.func("int __stdcall UnhookWinEvent(uintptr_t hWinEventHook)");
  } catch (err) {
    console.error("Error setting up Win32 bindings with koffi:", err);
  }
}

class AppBarService {
  constructor() {
    this.mainWindow = null;
    this.hwnd = 0;
    this.isRegistered = false;
    this.mode = "reserved"; // "reserved" | "overlay" | "autohide"
    this.stripHeight = 34; // default height in px
    this.stripMargin = 0; // margin in px
    this.fullscreenBehavior = "hide"; // "hide" | "collapse"
    this.targetDisplayId = null;
    this.isFullscreenActive = false;
    this.logger = console.log;

    // Active App State
    this.activeApp = {
      name: "Desktop",
      icon: "",
      exePath: "",
    };
    this.lastForegroundHwnd = 0;
    this.appInfoCache = new Map();

    // Hook references
    this.winEventHook = 0;
    this.winEventCallback = null;
    this.foregroundPollInterval = null;
    this.fullscreenWatchdogInterval = null;

    // Debounce pos updates
    this.posUpdateTimeout = null;

    // Known app name overrides
    this.knownAppNames = {
      chrome: "Google Chrome",
      msedge: "Microsoft Edge",
      firefox: "Firefox",
      brave: "Brave Browser",
      code: "Visual Studio Code",
      devenv: "Visual Studio",
      explorer: "Explorer",
      windowsterminal: "Terminal",
      powershell: "PowerShell",
      pwsh: "PowerShell",
      cmd: "Command Prompt",
      slack: "Slack",
      discord: "Discord",
      spotify: "Spotify",
      notion: "Notion",
      obsidian: "Obsidian",
      steam: "Steam",
      taskmgr: "Task Manager",
      notepad: "Notepad",
      aura: "Aura Island",
      "aura-island": "Aura Island",
      electron: "Aura Island",
    };
  }

  init(win, config = {}, logger = console.log) {
    this.mainWindow = win;
    this.logger = logger;

    if (config.islandPosition) this.mode = config.islandPosition;
    if (typeof config.stripHeight === "number") this.stripHeight = config.stripHeight;
    if (typeof config.stripMargin === "number") this.stripMargin = config.stripMargin;
    if (config.fullscreenBehavior) this.fullscreenBehavior = config.fullscreenBehavior;

    if (!win || win.isDestroyed()) return;

    try {
      const hwndBuf = win.getNativeWindowHandle();
      this.hwnd = Number(hwndBuf.readBigUInt64LE(0));
    } catch (e) {
      this.logger("Failed to extract HWND from window handle:", e);
      return;
    }

    // Hook custom window callback message for system AppBar messages
    try {
      win.hookWindowMessage(WM_APPBAR_CALLBACK, (wParam, lParam) => {
        const msgCode = Number(wParam);
        if (msgCode === ABN_FULLSCREENAPP) {
          const isFs = Boolean(lParam);
          this.handleFullscreenState(isFs);
        } else if (msgCode === ABN_POSCHANGED) {
          this.debouncedUpdatePos();
        }
      });
    } catch (e) {
      this.logger("Failed to hook window callback message:", e);
    }

    // Register AppBar if in reserved mode
    if (this.mode === "reserved") {
      this.registerAppBar();
    }

    // Start Foreground App watcher
    this.startForegroundWatcher();

    // Start Fullscreen Watchdog (catches F11 browser fullscreen, games, and video)
    this.startFullscreenWatchdog();

    // Register exit/crash cleanup handlers
    this.registerCleanupHandlers();
  }

  getEffectiveStripHeight() {
    return Math.max(24, Math.min(80, this.stripHeight + this.stripMargin));
  }

  getMonitorBounds() {
    if (!GetMonitorInfoW || !this.hwnd) {
      const display = screen.getPrimaryDisplay();
      return {
        left: display.bounds.x,
        top: display.bounds.y,
        right: display.bounds.x + display.bounds.width,
        bottom: display.bounds.y + display.bounds.height,
        scaleFactor: display.scaleFactor || 1,
      };
    }

    try {
      const hMon = MonitorFromWindow(this.hwnd, 1 /* MONITOR_DEFAULTTOPRIMARY */);
      const mi = { cbSize: koffi.sizeof(MONITORINFO) };
      const ok = GetMonitorInfoW(hMon, mi);
      if (ok && mi.rcMonitor.right > mi.rcMonitor.left) {
        return {
          left: mi.rcMonitor.left,
          top: mi.rcMonitor.top,
          right: mi.rcMonitor.right,
          bottom: mi.rcMonitor.bottom,
          scaleFactor: 1, // Monitor info coordinates are in native virtual desktop pixels
        };
      }
    } catch (e) {
      this.logger("Error reading monitor info:", e);
    }

    const display = screen.getPrimaryDisplay();
    return {
      left: display.bounds.x,
      top: display.bounds.y,
      right: display.bounds.x + display.bounds.width,
      bottom: display.bounds.y + display.bounds.height,
      scaleFactor: display.scaleFactor || 1,
    };
  }

  registerAppBar() {
    if (!SHAppBarMessage || !this.hwnd || this.isRegistered) return;

    try {
      const abd = {
        cbSize: koffi.sizeof(APPBARDATA),
        hWnd: this.hwnd,
        uCallbackMessage: WM_APPBAR_CALLBACK,
        uEdge: ABE_TOP,
        rc: { left: 0, top: 0, right: 0, bottom: 0 },
        lParam: 0,
      };

      const res = SHAppBarMessage(ABM_NEW, abd);
      this.isRegistered = true;
      this.logger("AppBar registered (ABM_NEW), result:", res);

      // Now set position
      this.updateAppBarPos();
    } catch (e) {
      this.logger("Failed to register AppBar:", e);
    }
  }

  updateAppBarPos() {
    if (!SHAppBarMessage || !this.hwnd || !this.isRegistered) return;

    try {
      const bounds = this.getMonitorBounds();
      const height = this.getEffectiveStripHeight();

      const abd = {
        cbSize: koffi.sizeof(APPBARDATA),
        hWnd: this.hwnd,
        uCallbackMessage: WM_APPBAR_CALLBACK,
        uEdge: ABE_TOP,
        rc: {
          left: bounds.left,
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.top + height,
        },
        lParam: 0,
      };

      // Query position first so Windows adjusts for other bars
      SHAppBarMessage(ABM_QUERYPOS, abd);

      // Enforce the requested height and top edge
      abd.rc.top = bounds.top;
      abd.rc.bottom = bounds.top + height;

      // Set the reserved position (reserves the space for other apps)
      const setRes = SHAppBarMessage(ABM_SETPOS, abd);
      this.logger(`AppBar position updated (ABM_SETPOS) [${abd.rc.left}, ${abd.rc.top}, ${abd.rc.right}, ${abd.rc.bottom}], res:`, setRes);
    } catch (e) {
      this.logger("Failed to update AppBar position:", e);
    }
  }

  debouncedUpdatePos() {
    if (this.posUpdateTimeout) clearTimeout(this.posUpdateTimeout);
    this.posUpdateTimeout = setTimeout(() => {
      this.posUpdateTimeout = null;
      if (this.isRegistered && this.mode === "reserved" && !this.isFullscreenActive) {
        this.updateAppBarPos();
      }
    }, 100);
  }

  removeAppBar() {
    if (!SHAppBarMessage || !this.hwnd || !this.isRegistered) return;

    try {
      const abd = {
        cbSize: koffi.sizeof(APPBARDATA),
        hWnd: this.hwnd,
        uCallbackMessage: 0,
        uEdge: ABE_TOP,
        rc: { left: 0, top: 0, right: 0, bottom: 0 },
        lParam: 0,
      };

      const res = SHAppBarMessage(ABM_REMOVE, abd);
      this.isRegistered = false;
      this.logger("AppBar removed (ABM_REMOVE), result:", res);
    } catch (e) {
      this.logger("Failed to remove AppBar:", e);
    }
  }

  setMode(newMode) {
    if (this.mode === newMode) return;
    this.logger(`Switching island mode from '${this.mode}' to '${newMode}'`);
    this.mode = newMode;

    if (newMode === "reserved") {
      if (!this.isFullscreenActive) {
        this.registerAppBar();
      }
    } else {
      // overlay or autohide: release reserved space
      this.removeAppBar();
    }

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send("menubar:mode-changed", this.mode);
    }
  }

  setStripHeight(height) {
    if (typeof height !== "number" || height < 24 || height > 80) return;
    this.stripHeight = height;
    if (this.isRegistered && this.mode === "reserved" && !this.isFullscreenActive) {
      this.updateAppBarPos();
    }
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send("menubar:config-changed", {
        stripHeight: this.stripHeight,
        stripMargin: this.stripMargin,
      });
    }
  }

  setStripMargin(margin) {
    if (typeof margin !== "number" || margin < 0 || margin > 40) return;
    this.stripMargin = margin;
    if (this.isRegistered && this.mode === "reserved" && !this.isFullscreenActive) {
      this.updateAppBarPos();
    }
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send("menubar:config-changed", {
        stripHeight: this.stripHeight,
        stripMargin: this.stripMargin,
      });
    }
  }

  // --- Fullscreen Handling ---
  handleFullscreenState(isFullscreen) {
    if (this.isFullscreenActive === isFullscreen) return;
    this.isFullscreenActive = isFullscreen;
    this.logger("Fullscreen state changed ->", isFullscreen);

    if (isFullscreen) {
      // Release reserved strip so fullscreen game/video has 100% of the screen
      if (this.isRegistered) {
        this.removeAppBar();
      }
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send("menubar:fullscreen-changed", {
          isFullscreen: true,
          behavior: this.fullscreenBehavior,
        });
      }
    } else {
      // Restore reserved strip if in reserved mode
      if (this.mode === "reserved" && !this.isRegistered) {
        this.registerAppBar();
      }
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send("menubar:fullscreen-changed", {
          isFullscreen: false,
          behavior: this.fullscreenBehavior,
        });
      }
    }
  }

  startFullscreenWatchdog() {
    if (!SHQueryUserNotificationState && !GetWindowRect) return;

    this.fullscreenWatchdogInterval = setInterval(() => {
      try {
        let isFs = false;

        // 1. Check SHQueryUserNotificationState
        if (SHQueryUserNotificationState) {
          const stateBuf = [0];
          const hr = SHQueryUserNotificationState(stateBuf);
          if (hr === 0) {
            const state = stateBuf[0];
            if (
              state === QUNS_RUNNING_D3D_FULL_SCREEN ||
              state === QUNS_PRESENTATION_MODE
            ) {
              isFs = true;
            }
          }
        }

        // 2. Check foreground window bounds against monitor bounds
        if (!isFs && GetForegroundWindow && GetWindowRect) {
          const fgHwnd = GetForegroundWindow();
          if (fgHwnd && fgHwnd !== this.hwnd) {
            const r = {};
            const ok = GetWindowRect(fgHwnd, r);
            if (ok) {
              const bounds = this.getMonitorBounds();
              // Check if window completely covers the monitor
              if (
                r.left <= bounds.left &&
                r.top <= bounds.top &&
                r.right >= bounds.right &&
                r.bottom >= bounds.bottom
              ) {
                isFs = true;
              }
            }
          }
        }

        this.handleFullscreenState(isFs);
      } catch (_) {}
    }, 1000);
  }

  // --- Foreground Application Watcher ---
  startForegroundWatcher() {
    if (!GetForegroundWindow) return;

    const checkForeground = () => {
      try {
        const fgHwnd = GetForegroundWindow();
        if (!fgHwnd || fgHwnd === this.lastForegroundHwnd) return;
        this.lastForegroundHwnd = fgHwnd;

        // Skip our own window so active app remains unchanged when user interacts with MenuBar
        if (fgHwnd === this.hwnd) return;

        this.resolveAppDetails(fgHwnd);
      } catch (_) {}
    };

    // 1. Try WinEvent hook for event-driven updates
    if (SetWinEventHook && koffi) {
      try {
        this.winEventCallback = koffi.register((hHook, event, hwnd) => {
          if (hwnd && hwnd !== this.hwnd) {
            this.lastForegroundHwnd = hwnd;
            this.resolveAppDetails(hwnd);
          }
        }, koffi.pointer(WinEventProc));

        // EVENT_SYSTEM_FOREGROUND = 0x0003, WINEVENT_OUTOFCONTEXT = 0
        this.winEventHook = SetWinEventHook(0x0003, 0x0003, 0, this.winEventCallback, 0, 0, 0);
      } catch (e) {
        this.logger("Failed to register WinEvent hook, falling back to polling:", e);
      }
    }

    // 2. Lightweight 500ms fallback poll for bulletproof detection
    this.foregroundPollInterval = setInterval(checkForeground, 500);

    // Initial check
    checkForeground();
  }

  async resolveAppDetails(hwnd) {
    try {
      if (!GetWindowThreadProcessId || !OpenProcess || !QueryFullProcessImageNameW) return;

      const pidBuf = [0];
      GetWindowThreadProcessId(hwnd, pidBuf);
      const pid = pidBuf[0];
      if (!pid) return;

      const hProc = OpenProcess(0x1000 /* PROCESS_QUERY_LIMITED_INFORMATION */, 0, pid);
      if (!hProc) return;

      const buf = new Uint16Array(1024);
      const sizeBuf = [1024];
      const ok = QueryFullProcessImageNameW(hProc, 0, buf, sizeBuf);
      CloseHandle(hProc);

      if (!ok || sizeBuf[0] === 0) return;

      const exePath = String.fromCharCode(...buf.slice(0, sizeBuf[0]));
      if (!exePath) return;

      if (this.appInfoCache.has(exePath)) {
        const cached = this.appInfoCache.get(exePath);
        this.activeApp = cached;
        this.emitActiveApp(cached);
        return;
      }

      // Format clean friendly name
      const parsed = path.parse(exePath);
      const baseLower = parsed.name.toLowerCase();
      let friendlyName = this.knownAppNames[baseLower];

      if (!friendlyName) {
        friendlyName = parsed.name
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }

      // Extract small icon via Electron app.getFileIcon
      let iconDataUrl = "";
      try {
        const icon = await app.getFileIcon(exePath, { size: "small" });
        if (icon && !icon.isEmpty()) {
          iconDataUrl = icon.toDataURL();
        }
      } catch (_) {}

      const appData = {
        name: friendlyName,
        icon: iconDataUrl,
        exePath,
      };

      this.appInfoCache.set(exePath, appData);
      this.activeApp = appData;
      this.emitActiveApp(appData);
    } catch (_) {}
  }

  emitActiveApp(appData) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send("menubar:active-app-changed", appData);
    }
  }

  getActiveApp() {
    return this.activeApp;
  }

  // --- Robust Exit & Crash Cleanup ---
  registerCleanupHandlers() {
    const cleanup = () => {
      this.destroy();
    };

    app.on("before-quit", cleanup);
    app.on("will-quit", cleanup);
    process.on("exit", cleanup);
    process.on("SIGINT", () => {
      cleanup();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      cleanup();
      process.exit(0);
    });

    process.on("uncaughtException", (err) => {
      this.logger("AppBarService uncaughtException caught - releasing strip:", err);
      cleanup();
    });
  }

  destroy() {
    // Unhook WinEvent
    if (this.winEventHook && UnhookWinEvent) {
      try {
        UnhookWinEvent(this.winEventHook);
      } catch (_) {}
      this.winEventHook = 0;
    }
    if (this.winEventCallback && koffi) {
      try {
        koffi.unregister(this.winEventCallback);
      } catch (_) {}
      this.winEventCallback = null;
    }

    // Clear intervals
    if (this.foregroundPollInterval) {
      clearInterval(this.foregroundPollInterval);
      this.foregroundPollInterval = null;
    }
    if (this.fullscreenWatchdogInterval) {
      clearInterval(this.fullscreenWatchdogInterval);
      this.fullscreenWatchdogInterval = null;
    }
    if (this.posUpdateTimeout) {
      clearTimeout(this.posUpdateTimeout);
      this.posUpdateTimeout = null;
    }

    // Always release the AppBar reservation
    this.removeAppBar();
  }
}

const appBarService = new AppBarService();
module.exports = {
  appBarService,
  AppBarService,
};
