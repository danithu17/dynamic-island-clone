"use strict";

const path = require("node:path");
const fs = require("fs");
const electron = require("electron");
const app = electron.app;
const screen = electron.screen;
const nativeImage = electron.nativeImage;

let koffi = null;
try {
  koffi = require("koffi");
} catch (e) {
  console.error("Failed to load koffi:", e);
}

let appMenuService = null;
try {
  appMenuService = require("./appMenuService").appMenuService;
} catch (_) {
  try {
    appMenuService = require("../services/appMenuService").appMenuService;
  } catch (_) {}
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
let SystemParametersInfoW = null;
let SetWindowPos = null;
let GetWindowLongPtrW = null;
let SetWindowLongPtrW = null;
let KBDLLHOOKSTRUCT = null;
let HOOKPROC = null;
let SetWindowsHookExW = null;
let UnhookWindowsHookEx = null;
let CallNextHookEx = null;

const SPI_GETWORKAREA = 0x0030;
const SPI_SETWORKAREA = 0x002F;
const SPIF_UPDATEINIFILE = 0x0001;
const SPIF_SENDCHANGE = 0x0002;

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
    SystemParametersInfoW = user32.func("int __stdcall SystemParametersInfoW(uint32 uiAction, uint32 uiParam, _Inout_ APPBAR_RECT *pvParam, uint32 fWinIni)");
    SetWindowPos = user32.func("int __stdcall SetWindowPos(uintptr_t hWnd, uintptr_t hWndInsertAfter, int X, int Y, int cx, int cy, uint32 uFlags)");
    GetWindowLongPtrW = user32.func("uintptr_t __stdcall GetWindowLongPtrW(uintptr_t hWnd, int nIndex)");
    SetWindowLongPtrW = user32.func("uintptr_t __stdcall SetWindowLongPtrW(uintptr_t hWnd, int nIndex, uintptr_t dwNewLong)");

    OpenProcess = kernel32.func("uintptr_t __stdcall OpenProcess(uint32 dwDesiredAccess, int bInheritHandle, uint32 dwProcessId)");
    CloseHandle = kernel32.func("int __stdcall CloseHandle(uintptr_t hObject)");
    QueryFullProcessImageNameW = kernel32.func("int __stdcall QueryFullProcessImageNameW(uintptr_t hProcess, uint32 dwFlags, _Out_ uint16 *lpExeName, _Inout_ uint32 *lpdwSize)");

    // Low-level Keyboard Hook for Hardware Media/Volume Keys
    KBDLLHOOKSTRUCT = koffi.struct("APPBAR_KBDLLHOOKSTRUCT", {
      vkCode: "uint32",
      scanCode: "uint32",
      flags: "uint32",
      time: "uint32",
      dwExtraInfo: "uintptr_t",
    });

    HOOKPROC = koffi.proto("intptr_t __stdcall HOOKPROC(int nCode, uintptr_t wParam, intptr_t lParam)");
    SetWindowsHookExW = user32.func("uintptr_t __stdcall SetWindowsHookExW(int idHook, HOOKPROC *lpfn, uintptr_t hmod, uint32 dwThreadId)");
    UnhookWindowsHookEx = user32.func("int __stdcall UnhookWindowsHookEx(uintptr_t hhk)");
    CallNextHookEx = user32.func("intptr_t __stdcall CallNextHookEx(uintptr_t hhk, int nCode, uintptr_t wParam, intptr_t lParam)");
  } catch (err) {
    console.error("Error setting up Win32 bindings with koffi:", err);
  }
}

class AppBarService {
  constructor() {
    this.mainWindow = null;
    this.hwnd = 0;
    this.isRegistered = false;
    this.originalWorkArea = null;
    this.isWorkAreaModified = false;
    this.isUpdatingPos = false;
    this.mode = "reserved"; // "reserved" | "overlay" | "autohide"
    this.stripHeight = 34; // default height in px
    this.stripMargin = 0; // margin in px
    this.fullscreenBehavior = "hide"; // "hide" | "collapse"
    this.displayScope = "primary"; // "primary" | "all"
    this.targetDisplayId = null;
    this.activeAppEnabled = true;
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
    this.keyboardHook = 0;
    this.keyboardCallback = null;
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

      // Make window non-activating so clicking menus never steals focus from active app
      if (GetWindowLongPtrW && SetWindowLongPtrW && this.hwnd) {
        try {
          const curEx = Number(GetWindowLongPtrW(this.hwnd, -20 /* GWL_EXSTYLE */));
          const newEx = curEx | 0x08000000 /* WS_EX_NOACTIVATE */;
          SetWindowLongPtrW(this.hwnd, -20, newEx);
        } catch (_) {}
      }
    } catch (e) {
      this.logger("Failed to extract HWND from window handle:", e);
      return;
    }

    // Ensure window position remains locked to monitor top edge (flush with y=0)
    win.on("move", () => {
      if (this.mode === "reserved" && !this.isUpdatingPos && !this.isFullscreenActive) {
        const display = this.getTargetDisplay();
        const cur = win.getBounds();
        if (cur.y !== display.bounds.y || cur.x !== display.bounds.x) {
          this.logger(`Window shifted to (${cur.x}, ${cur.y}), re-locking to monitor top (${display.bounds.x}, ${display.bounds.y})`);
          this.positionWindowToMonitorTop();
        }
      }
    });

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

    // Start Low-level Keyboard Watcher for Hardware Volume & Media Keys
    this.startKeyboardWatcher();

    // Register exit/crash cleanup handlers
    this.registerCleanupHandlers();
  }

  getEffectiveStripHeight() {
    return Math.max(24, Math.min(80, this.stripHeight + this.stripMargin));
  }

  getTargetDisplay() {
    if (this.targetDisplayId && screen.getAllDisplays) {
      try {
        const matched = screen.getAllDisplays().find((d) => String(d.id) === String(this.targetDisplayId));
        if (matched) return matched;
      } catch (_) {}
    }
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      try {
        const bounds = this.mainWindow.getBounds();
        return screen.getDisplayMatching(bounds);
      } catch (_) {}
    }
    return screen.getPrimaryDisplay();
  }

  getPhysicalMonitorBounds() {
    const display = this.getTargetDisplay();
    if (screen.dipToScreenRect) {
      try {
        const physRect = screen.dipToScreenRect(null, display.bounds);
        return {
          left: physRect.x,
          top: physRect.y,
          right: physRect.x + physRect.width,
          bottom: physRect.y + physRect.height,
          scaleFactor: display.scaleFactor || 1,
        };
      } catch (_) {}
    }

    if (GetMonitorInfoW && this.hwnd) {
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
            scaleFactor: display.scaleFactor || 1,
          };
        }
      } catch (e) {
        this.logger("Error reading monitor info:", e);
      }
    }

    const scale = display.scaleFactor || 1;
    return {
      left: Math.round(display.bounds.x * scale),
      top: Math.round(display.bounds.y * scale),
      right: Math.round((display.bounds.x + display.bounds.width) * scale),
      bottom: Math.round((display.bounds.y + display.bounds.height) * scale),
      scaleFactor: scale,
    };
  }

  getPhysicalStripHeight() {
    const display = this.getTargetDisplay();
    const scale = display.scaleFactor || 1;
    return Math.round(this.getEffectiveStripHeight() * scale);
  }

  getDIPStripHeight() {
    const display = this.getTargetDisplay();
    const scale = display.scaleFactor || 1;
    return this.getPhysicalStripHeight() / scale;
  }

  positionWindowToMonitorTop() {
    if (!this.mainWindow || this.mainWindow.isDestroyed() || !this.hwnd) return;
    if (this.isUpdatingPos) return;

    try {
      this.isUpdatingPos = true;
      const display = this.getTargetDisplay();
      const dipBounds = display.bounds;
      const physBounds = this.getPhysicalMonitorBounds();

      // Win32 physical positioning: pin window at top = 0 of monitor
      if (SetWindowPos) {
        SetWindowPos(
          this.hwnd,
          0,
          physBounds.left,
          physBounds.top,
          physBounds.right - physBounds.left,
          physBounds.bottom - physBounds.top,
          0x0004 | 0x0010 | 0x0400 /* SWP_NOZORDER | SWP_NOACTIVATE | SWP_NOSENDCHANGING */
        );
      }

      // Electron DIP positioning
      this.mainWindow.setBounds({
        x: dipBounds.x,
        y: dipBounds.y,
        width: dipBounds.width,
        height: dipBounds.height,
      });
    } catch (e) {
      this.logger("Failed to position window to monitor top:", e);
    } finally {
      setTimeout(() => {
        this.isUpdatingPos = false;
      }, 40);
    }
  }

  captureOriginalWorkArea() {
    if (SystemParametersInfoW && !this.originalWorkArea) {
      try {
        const rc = { left: 0, top: 0, right: 0, bottom: 0 };
        const ok = SystemParametersInfoW(SPI_GETWORKAREA, 0, rc, 0);
        if (ok && rc.right > rc.left && rc.bottom > rc.top) {
          this.originalWorkArea = { ...rc };
          this.logger("Captured original Windows work area:", this.originalWorkArea);
        }
      } catch (e) {
        this.logger("Error capturing work area:", e);
      }
    }
  }

  applyReservedWorkArea() {
    this.captureOriginalWorkArea();
    if (!SystemParametersInfoW || !this.originalWorkArea) return;

    try {
      const physHeight = this.getPhysicalStripHeight();
      const bounds = this.getPhysicalMonitorBounds();
      const targetTop = bounds.top + physHeight;

      const newRc = {
        left: this.originalWorkArea.left,
        top: Math.max(this.originalWorkArea.top, targetTop),
        right: this.originalWorkArea.right,
        bottom: this.originalWorkArea.bottom,
      };

      const ok = SystemParametersInfoW(
        SPI_SETWORKAREA,
        0,
        newRc,
        SPIF_SENDCHANGE | SPIF_UPDATEINIFILE
      );
      this.isWorkAreaModified = true;
      this.logger(`Windows work area adjusted (top=${newRc.top}): applications start below bar, res=${ok}`);

      // Lock window back to monitor top edge immediately and on subsequent ticks
      this.positionWindowToMonitorTop();
      setTimeout(() => this.positionWindowToMonitorTop(), 40);
      setTimeout(() => this.positionWindowToMonitorTop(), 120);
      setTimeout(() => this.positionWindowToMonitorTop(), 250);
    } catch (e) {
      this.logger("Failed to apply work area:", e);
    }
  }

  restoreOriginalWorkArea() {
    if (!SystemParametersInfoW || !this.originalWorkArea || !this.isWorkAreaModified) return;

    try {
      const ok = SystemParametersInfoW(
        SPI_SETWORKAREA,
        0,
        this.originalWorkArea,
        SPIF_SENDCHANGE | SPIF_UPDATEINIFILE
      );
      this.isWorkAreaModified = false;
      this.logger(`Restored original Windows work area, res=${ok}`);
      this.positionWindowToMonitorTop();
    } catch (e) {
      this.logger("Failed to restore original work area:", e);
    }
  }

  registerAppBar() {
    if (!this.hwnd) return;

    try {
      if (SHAppBarMessage && !this.isRegistered) {
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
      }

      // Now set position & constrain work area
      this.updateAppBarPos();
    } catch (e) {
      this.logger("Failed to register AppBar:", e);
    }
  }

  updateAppBarPos() {
    if (!this.hwnd) return;

    try {
      const physBounds = this.getPhysicalMonitorBounds();
      const physHeight = this.getPhysicalStripHeight();
      const dipHeight = this.getDIPStripHeight();

      if (SHAppBarMessage && this.isRegistered) {
        const abd = {
          cbSize: koffi.sizeof(APPBARDATA),
          hWnd: this.hwnd,
          uCallbackMessage: WM_APPBAR_CALLBACK,
          uEdge: ABE_TOP,
          rc: {
            left: physBounds.left,
            top: physBounds.top,
            right: physBounds.right,
            bottom: physBounds.top + physHeight,
          },
          lParam: 0,
        };

        SHAppBarMessage(ABM_QUERYPOS, abd);
        abd.rc.top = physBounds.top;
        abd.rc.bottom = physBounds.top + physHeight;
        const setRes = SHAppBarMessage(ABM_SETPOS, abd);
        this.logger(`AppBar position updated (ABM_SETPOS) [${abd.rc.left}, ${abd.rc.top}, ${abd.rc.right}, ${abd.rc.bottom}], res:`, setRes);
      }

      // Constrain all Windows applications so they can only run below the bar
      this.applyReservedWorkArea();

      // Broadcast unified DIP strip height to renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send("menubar:config-changed", {
          stripHeight: dipHeight,
          stripMargin: this.stripMargin,
        });
      }
    } catch (e) {
      this.logger("Failed to update AppBar position:", e);
    }
  }

  debouncedUpdatePos() {
    if (this.posUpdateTimeout) clearTimeout(this.posUpdateTimeout);
    this.posUpdateTimeout = setTimeout(() => {
      this.posUpdateTimeout = null;
      if (this.mode === "reserved" && !this.isFullscreenActive) {
        this.updateAppBarPos();
      }
    }, 100);
  }

  removeAppBar() {
    try {
      if (SHAppBarMessage && this.hwnd && this.isRegistered) {
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
      }

      // Restore Windows work area so applications regain full screen
      this.restoreOriginalWorkArea();
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
        stripHeight: this.getDIPStripHeight(),
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
        stripHeight: this.getDIPStripHeight(),
        stripMargin: this.stripMargin,
      });
    }
  }

  setDisplayScope(scope) {
    if (["primary", "all"].includes(scope)) {
      this.displayScope = scope;
      this.logger("Menu bar display scope set to:", scope);
      if (this.mode === "reserved") {
        this.positionWindowToMonitorTop();
        this.updateAppBarPos();
      }
    }
  }

  setTargetDisplay(displayId) {
    this.targetDisplayId = displayId;
    this.logger("Target display ID set to:", displayId);
    this.positionWindowToMonitorTop();
    if (this.mode === "reserved") {
      this.updateAppBarPos();
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

  setActiveAppEnabled(enabled) {
    this.activeAppEnabled = Boolean(enabled);
    if (!this.activeAppEnabled) {
      this.lastForegroundHwnd = 0;
    }
  }

  // --- Foreground Application Watcher (Safe Polling, Zero Crashing Hooks) ---
  startForegroundWatcher() {
    if (!GetForegroundWindow) return;

    const checkForeground = () => {
      if (this.activeAppEnabled === false) return;
      try {
        const fgHwnd = GetForegroundWindow();
        if (!fgHwnd || fgHwnd === this.lastForegroundHwnd) return;
        this.lastForegroundHwnd = fgHwnd;

        // Skip our own window so active app remains unchanged when user interacts with MenuBar
        if (fgHwnd === this.hwnd) return;

        this.resolveAppDetails(fgHwnd);
      } catch (_) {}
    };

    // Safe 500ms non-invasive poll (zero hook dll injection or system freezes)
    this.foregroundPollInterval = setInterval(checkForeground, 500);

    // Initial check
    checkForeground();
  }

  async resolveAppDetails(hwnd) {
    let hProc = 0;
    try {
      if (!GetWindowThreadProcessId || !OpenProcess || !QueryFullProcessImageNameW) return;

      const pidBuf = [0];
      GetWindowThreadProcessId(hwnd, pidBuf);
      const pid = pidBuf[0];
      if (!pid || pid === process.pid) return;

      hProc = OpenProcess(0x1000 /* PROCESS_QUERY_LIMITED_INFORMATION */, 0, pid);
      if (!hProc) return;

      const buf = new Uint16Array(1024);
      const sizeBuf = [1024];
      const ok = QueryFullProcessImageNameW(hProc, 0, buf, sizeBuf);
      if (!ok || sizeBuf[0] === 0) return;

      const exePath = String.fromCharCode(...buf.slice(0, sizeBuf[0]));
      if (!exePath) return;

      if (this.appInfoCache.has(exePath)) {
        const cached = this.appInfoCache.get(exePath);
        this.activeApp = cached;
        this.emitActiveApp(cached);

        if (appMenuService && this.mainWindow && !this.mainWindow.isDestroyed()) {
          appMenuService.getMenusForApp(cached, hwnd).then((menusData) => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
              this.mainWindow.webContents.send("menubar:app-menus-changed", {
                ...menusData,
                hwnd,
              });
            }
          }).catch(() => {});
        }
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

      // Extract high-res icon via Electron app.getFileIcon
      let iconDataUrl = "";
      try {
        const icon = await app.getFileIcon(exePath, { size: "large" });
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

      if (appMenuService && this.mainWindow && !this.mainWindow.isDestroyed()) {
        appMenuService.getMenusForApp(appData, hwnd).then((menusData) => {
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send("menubar:app-menus-changed", {
              ...menusData,
              hwnd,
            });
          }
        }).catch(() => {});
      }
    } catch (_) {
    } finally {
      if (hProc && CloseHandle) {
        try {
          CloseHandle(hProc);
        } catch (_) {}
      }
    }
  }

  startKeyboardWatcher() {
    if (!SetWindowsHookExW || !koffi) return;

    try {
      this.keyboardCallback = koffi.register((nCode, wParam, lParam) => {
        if (nCode >= 0 && (wParam === 0x0100 || wParam === 0x0104)) {
          try {
            const kbd = koffi.decode(lParam, KBDLLHOOKSTRUCT);
            if (kbd) {
              const vk = kbd.vkCode;
              if (vk === 0xAF) {
                this.notifyKeyboardControl("volup");
              } else if (vk === 0xAE) {
                this.notifyKeyboardControl("voldown");
              } else if (vk === 0xAD) {
                this.notifyKeyboardControl("mute");
              } else if (vk === 0xD8 || vk === 0xE0) {
                this.notifyKeyboardControl("brightnessup");
              } else if (vk === 0xD9 || vk === 0xE1) {
                this.notifyKeyboardControl("brightnessdown");
              } else if (vk === 0xCD) {
                this.notifyKeyboardControl("playpause");
              } else if (vk === 0xB0) {
                this.notifyKeyboardControl("next");
              } else if (vk === 0xB1) {
                this.notifyKeyboardControl("previous");
              }
            }
          } catch (_) {}
        }
        return CallNextHookEx(this.keyboardHook, nCode, wParam, lParam);
      }, koffi.pointer(HOOKPROC));

      this.keyboardHook = SetWindowsHookExW(13 /* WH_KEYBOARD_LL */, this.keyboardCallback, 0, 0);
      this.logger("Keyboard control buttons watcher established:", this.keyboardHook);
    } catch (e) {
      this.logger("Failed to establish keyboard control watcher:", e);
    }
  }

  notifyKeyboardControl(action) {
    if (this.onHardwareControl) {
      try {
        this.onHardwareControl(action);
      } catch (_) {}
    }
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      try {
        if (["volup", "voldown", "mute"].includes(action)) {
          this.mainWindow.webContents.send("alert:volume-change", { action });
          this.mainWindow.webContents.send("menubar:volume-change", { action });
        } else if (["brightnessup", "brightnessdown"].includes(action)) {
          this.mainWindow.webContents.send("alert:brightness-change", { action });
        } else if (["playpause", "next", "previous"].includes(action)) {
          this.mainWindow.webContents.send("menubar:media-change", { command: action });
        }
      } catch (_) {}
    }
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
    // Unhook Keyboard hook
    if (this.keyboardHook && UnhookWindowsHookEx) {
      try {
        UnhookWindowsHookEx(this.keyboardHook);
      } catch (_) {}
      this.keyboardHook = 0;
    }
    if (this.keyboardCallback && koffi) {
      try {
        koffi.unregister(this.keyboardCallback);
      } catch (_) {}
      this.keyboardCallback = null;
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

    // Always release the AppBar reservation & restore Windows work area
    this.removeAppBar();
  }
}

const appBarService = new AppBarService();
module.exports = {
  appBarService,
  AppBarService,
};
