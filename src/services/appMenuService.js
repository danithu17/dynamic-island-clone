const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { app } = require("electron");

let koffi = null;
try {
  koffi = require("koffi");
} catch (_) {}

let user32 = null;
let kernel32 = null;
let advapi32 = null;
let GetForegroundWindow = null;
let SetForegroundWindow = null;
let SendInput = null;
let keybd_event = null;
let OpenProcess = null;
let OpenProcessToken = null;
let GetTokenInformation = null;
let CloseHandle = null;
let GetWindowThreadProcessId = null;
let INPUT = null;
let KEYBDINPUT = null;

const INPUT_KEYBOARD = 1;
const KEYEVENTF_KEYUP = 0x0002;
const KEYEVENTF_EXTENDEDKEY = 0x0001;

// Virtual key codes mapping
const VK_MAP = {
  ctrl: 0x11,
  control: 0x11,
  shift: 0x10,
  alt: 0x12,
  win: 0x5b,
  cmd: 0x5b,
  enter: 0x0d,
  return: 0x0d,
  esc: 0x1b,
  escape: 0x1b,
  space: 0x20,
  tab: 0x09,
  backspace: 0x08,
  delete: 0x2e,
  del: 0x2e,
  insert: 0x2d,
  home: 0x24,
  end: 0x23,
  pageup: 0x21,
  pagedown: 0x22,
  up: 0x26,
  down: 0x28,
  left: 0x25,
  right: 0x27,
  f1: 0x70,
  f2: 0x71,
  f3: 0x72,
  f4: 0x73,
  f5: 0x74,
  f6: 0x75,
  f7: 0x76,
  f8: 0x77,
  f9: 0x78,
  f10: 0x79,
  f11: 0x7a,
  f12: 0x7b,
  plus: 0xbb,
  "+": 0xbb,
  minus: 0xbd,
  "-": 0xbd,
  "`": 0xc0,
  "/": 0xbf,
};

if (koffi && process.platform === "win32") {
  try {
    user32 = koffi.load("user32.dll");
    kernel32 = koffi.load("kernel32.dll");
    advapi32 = koffi.load("advapi32.dll");

    GetForegroundWindow = user32.func("uintptr_t __stdcall GetForegroundWindow()");
    SetForegroundWindow = user32.func("int __stdcall SetForegroundWindow(uintptr_t hWnd)");
    GetWindowThreadProcessId = user32.func("uint32 __stdcall GetWindowThreadProcessId(uintptr_t hWnd, _Out_ uint32 *lpdwProcessId)");

    keybd_event = user32.func("void __stdcall keybd_event(uint8 bVk, uint8 bScan, uint32 dwFlags, uintptr_t dwExtraInfo)");

    let resolvedKeybd = null;
    try {
      resolvedKeybd = koffi.type("APPMENU_KEYBDINPUT");
    } catch (_) {}

    KEYBDINPUT = resolvedKeybd || koffi.struct("APPMENU_KEYBDINPUT", {
      wVk: "uint16",
      wScan: "uint16",
      dwFlags: "uint32",
      time: "uint32",
      dwExtraInfo: "uintptr_t",
    });

    let resolvedInput = null;
    try {
      resolvedInput = koffi.type("APPMENU_INPUT");
    } catch (_) {}

    INPUT = resolvedInput || koffi.struct("APPMENU_INPUT", {
      type: "uint32",
      padding: "uint32",
      ki: KEYBDINPUT,
      pad: "uint64",
    });

    SendInput = user32.func("uint32 __stdcall SendInput(uint32 cInputs, _In_ APPMENU_INPUT *pInputs, int cbSize)");

    OpenProcess = kernel32.func("uintptr_t __stdcall OpenProcess(uint32 dwDesiredAccess, int bInheritHandle, uint32 dwProcessId)");
    CloseHandle = kernel32.func("int __stdcall CloseHandle(uintptr_t hObject)");

    OpenProcessToken = advapi32.func("int __stdcall OpenProcessToken(uintptr_t ProcessHandle, uint32 DesiredAccess, _Out_ uintptr_t *TokenHandle)");
    GetTokenInformation = advapi32.func("int __stdcall GetTokenInformation(uintptr_t TokenHandle, uint32 TokenInformationClass, _Out_ void *TokenInformation, uint32 TokenInformationLength, _Out_ uint32 *ReturnLength)");
  } catch (err) {
    console.error("AppMenuService: Error loading Win32 functions:", err);
  }
}

const GENERIC_MENUS = [
  {
    label: "File",
    items: [
      { label: "New Window", shortcut: "Ctrl+N", action: "Ctrl+N" },
      { label: "Open...", shortcut: "Ctrl+O", action: "Ctrl+O" },
      { label: "Save", shortcut: "Ctrl+S", action: "Ctrl+S" },
      { type: "separator" },
      { label: "Close Window", shortcut: "Alt+F4", action: "Alt+F4" },
    ],
  },
  {
    label: "Edit",
    items: [
      { label: "Undo", shortcut: "Ctrl+Z", action: "Ctrl+Z" },
      { label: "Redo", shortcut: "Ctrl+Y", action: "Ctrl+Y" },
      { type: "separator" },
      { label: "Cut", shortcut: "Ctrl+X", action: "Ctrl+X" },
      { label: "Copy", shortcut: "Ctrl+C", action: "Ctrl+C" },
      { label: "Paste", shortcut: "Ctrl+V", action: "Ctrl+V" },
      { label: "Select All", shortcut: "Ctrl+A", action: "Ctrl+A" },
      { type: "separator" },
      { label: "Find...", shortcut: "Ctrl+F", action: "Ctrl+F" },
    ],
  },
  {
    label: "View",
    items: [
      { label: "Zoom In", shortcut: "Ctrl++", action: "Ctrl++" },
      { label: "Zoom Out", shortcut: "Ctrl+-", action: "Ctrl+-" },
      { label: "Actual Size", shortcut: "Ctrl+0", action: "Ctrl+0" },
      { type: "separator" },
      { label: "Toggle Full Screen", shortcut: "F11", action: "F11" },
    ],
  },
  {
    label: "Window",
    items: [
      { label: "Minimize", shortcut: "Win+Down", action: "Win+Down" },
      { label: "Maximize / Restore", shortcut: "Win+Up", action: "Win+Up" },
      { label: "Snap Left", shortcut: "Win+Left", action: "Win+Left" },
      { label: "Snap Right", shortcut: "Win+Right", action: "Win+Right" },
      { type: "separator" },
      { label: "Close Window", shortcut: "Alt+F4", action: "Alt+F4" },
    ],
  },
  {
    label: "Help",
    items: [
      { label: "Help & Shortcuts", shortcut: "F1", action: "F1" },
    ],
  },
];

class AppMenuService {
  constructor() {
    this.profiles = new Map();
    this.menuCache = new Map(); // hwnd -> { timestamp, result }
    this.cacheTtlMs = 60000;
    this.helperPath = this.resolveHelperPath();
    this.isEnabled = true;
    this.loadProfiles();
  }

  resolveHelperPath() {
    const basePath = app && typeof app.getAppPath === "function" ? app.getAppPath() : process.cwd();
    const candidates = [
      path.join(__dirname, "../helpers/bin/uiaHelper.exe"),
      path.join(__dirname, "helpers/bin/uiaHelper.exe"),
      path.join(process.resourcesPath || "", "helpers/bin/uiaHelper.exe"),
      path.join(basePath, "src/helpers/bin/uiaHelper.exe"),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return candidates[0];
  }

  loadProfiles() {
    this.profiles.clear();
    const profilesDir = path.join(__dirname, "../menuProfiles");

    if (fs.existsSync(profilesDir)) {
      try {
        const files = fs.readdirSync(profilesDir);
        for (const f of files) {
          if (f.endsWith(".json")) {
            const raw = fs.readFileSync(path.join(profilesDir, f), "utf8");
            const data = JSON.parse(raw);
            if (Array.isArray(data.processNames)) {
              for (const proc of data.processNames) {
                this.profiles.set(proc.toLowerCase(), data);
              }
            }
          }
        }
      } catch (err) {
        console.error("AppMenuService: Error loading menu profiles:", err);
      }
    }
  }

  isProcessElevated(hwnd) {
    if (!GetWindowThreadProcessId || !OpenProcess || !OpenProcessToken || !GetTokenInformation || !CloseHandle) {
      return false;
    }

    try {
      const pidBuf = [0];
      GetWindowThreadProcessId(hwnd, pidBuf);
      const pid = pidBuf[0];
      if (!pid) return false;

      // PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
      const hProc = OpenProcess(0x1000, 0, pid);
      if (!hProc) return true; // Can't open handle -> likely elevated process

      try {
        const hTokenBuf = [0];
        // TOKEN_QUERY = 0x0008
        const okToken = OpenProcessToken(hProc, 0x0008, hTokenBuf);
        if (!okToken || !hTokenBuf[0]) return true;

        const hToken = hTokenBuf[0];
        try {
          const elevBuf = Buffer.alloc(4);
          const retLen = [0];
          // TokenElevation = 20
          const okInfo = GetTokenInformation(hToken, 20, elevBuf, 4, retLen);
          if (okInfo) {
            const isElevated = elevBuf.readInt32LE(0) !== 0;
            return isElevated;
          }
        } finally {
          CloseHandle(hToken);
        }
      } finally {
        CloseHandle(hProc);
      }
    } catch (_) {}
    return false;
  }

  async queryUIAHelper(hwnd) {
    if (!this.helperPath || !fs.existsSync(this.helperPath)) {
      return { found: false };
    }

    return new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try { child.kill(); } catch (_) {}
          resolve({ found: false, timeout: true });
        }
      }, 250);

      const child = spawn(this.helperPath, ["query", String(hwnd)], {
        windowsHide: true,
      });

      let stdout = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });

      child.on("close", () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          try {
            const parsed = JSON.parse(stdout.trim());
            resolve(parsed);
          } catch (_) {
            resolve({ found: false });
          }
        }
      });

      child.on("error", () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve({ found: false });
        }
      });
    });
  }

  async getMenusForApp(activeApp, hwnd) {
    if (!this.isEnabled) {
      return {
        appName: activeApp?.name || "Desktop",
        layer: "disabled",
        menus: [],
      };
    }

    const appName = activeApp?.name || "Desktop";
    const cleanProc = (activeApp?.exePath ? path.basename(activeApp.exePath, ".exe") : activeApp?.name || "").toLowerCase();

    // Check if target window is elevated
    const isElevated = hwnd ? this.isProcessElevated(hwnd) : false;

    // Check memory cache
    if (hwnd && this.menuCache.has(hwnd)) {
      const cached = this.menuCache.get(hwnd);
      if (Date.now() - cached.timestamp < this.cacheTtlMs) {
        return {
          appName,
          isElevated,
          ...cached.result,
        };
      }
    }

    // 1. LAYER 1: UI Automation Mirror
    if (hwnd && !isElevated) {
      try {
        const uiaRes = await this.queryUIAHelper(hwnd);
        if (uiaRes && uiaRes.found && Array.isArray(uiaRes.menus) && uiaRes.menus.length > 0) {
          const result = {
            layer: "mirror",
            source: uiaRes.source || "uia",
            menus: uiaRes.menus,
          };
          this.menuCache.set(hwnd, { timestamp: Date.now(), result });
          return { appName, isElevated, ...result };
        }
      } catch (err) {
        console.error("AppMenuService: UIA mirror query error:", err);
      }
    }

    // 2. LAYER 2: Curated Profiles
    if (this.profiles.has(cleanProc)) {
      const profile = this.profiles.get(cleanProc);
      const result = {
        layer: "profile",
        profileName: profile.app,
        menus: profile.menus,
      };
      if (hwnd) {
        this.menuCache.set(hwnd, { timestamp: Date.now(), result });
      }
      return { appName, isElevated, ...result };
    }

    // 3. LAYER 3: Generic Fallback
    const fallbackResult = {
      layer: "generic",
      menus: GENERIC_MENUS,
    };
    if (hwnd) {
      this.menuCache.set(hwnd, { timestamp: Date.now(), result: fallbackResult });
    }
    return { appName, isElevated, ...fallbackResult };
  }

  parseShortcut(shortcut) {
    if (!shortcut) return [];
    const parts = shortcut.split("+").map((s) => s.trim().toLowerCase());
    const keys = [];

    for (const p of parts) {
      if (VK_MAP[p]) {
        keys.push(VK_MAP[p]);
      } else if (p.length === 1) {
        keys.push(p.toUpperCase().charCodeAt(0));
      }
    }
    return keys;
  }

  async sendKeystroke(targetHwnd, shortcut) {
    if (!shortcut) return false;

    // Verify foreground window
    if (GetForegroundWindow && targetHwnd) {
      const fg = GetForegroundWindow();
      if (fg !== targetHwnd && SetForegroundWindow) {
        SetForegroundWindow(targetHwnd);
        await new Promise((r) => setTimeout(r, 20));
      }
    }

    const vkKeys = this.parseShortcut(shortcut);
    if (vkKeys.length === 0) return false;

    try {
      // 1. Try SendInput with Koffi
      if (SendInput && INPUT && koffi) {
        const inputs = [];
        // Key down in order
        for (const vk of vkKeys) {
          inputs.push({
            type: INPUT_KEYBOARD,
            padding: 0,
            ki: {
              wVk: vk,
              wScan: 0,
              dwFlags: 0,
              time: 0,
              dwExtraInfo: 0,
            },
            pad: 0,
          });
        }
        // Key up in reverse order
        for (let i = vkKeys.length - 1; i >= 0; i--) {
          inputs.push({
            type: INPUT_KEYBOARD,
            padding: 0,
            ki: {
              wVk: vkKeys[i],
              wScan: 0,
              dwFlags: KEYEVENTF_KEYUP,
              time: 0,
              dwExtraInfo: 0,
            },
            pad: 0,
          });
        }

        const sent = SendInput(inputs.length, inputs, koffi.sizeof(INPUT));
        if (sent > 0) return true;
      }

      // 2. Fallback to keybd_event
      if (keybd_event) {
        for (const vk of vkKeys) {
          keybd_event(vk, 0, 0, 0);
        }
        for (let i = vkKeys.length - 1; i >= 0; i--) {
          keybd_event(vkKeys[i], 0, KEYEVENTF_KEYUP, 0);
        }
        return true;
      }
    } catch (err) {
      console.error("AppMenuService: Failed to send keystroke:", err);
    }
    return false;
  }

  async executeMenuItem({ hwnd, path: itemPath, cmdId, action, layer }) {
    if (layer === "mirror") {
      if (cmdId && this.helperPath && fs.existsSync(this.helperPath)) {
        return new Promise((resolve) => {
          const child = spawn(this.helperPath, ["invoke", String(hwnd), String(cmdId)], { windowsHide: true });
          child.on("close", () => resolve(true));
          child.on("error", () => resolve(false));
        });
      } else if (itemPath && this.helperPath && fs.existsSync(this.helperPath)) {
        return new Promise((resolve) => {
          const child = spawn(this.helperPath, ["invoke", String(hwnd), itemPath], { windowsHide: true });
          child.on("close", () => resolve(true));
          child.on("error", () => resolve(false));
        });
      }
    }

    if (action) {
      return this.sendKeystroke(hwnd, action);
    }
    return false;
  }

  getAllProfiles() {
    const list = [];
    const seen = new Set();
    for (const [, prof] of this.profiles.entries()) {
      if (!seen.has(prof.app)) {
        seen.add(prof.app);
        list.push(prof);
      }
    }
    return list;
  }

  saveCustomProfile(profileData) {
    if (!profileData || !profileData.app || !Array.isArray(profileData.processNames)) {
      return false;
    }
    try {
      const fileName = `${profileData.processNames[0].toLowerCase().replace(/[^a-z0-9]/g, "_")}.json`;
      const savePath = path.join(__dirname, "../menuProfiles", fileName);
      fs.writeFileSync(savePath, JSON.stringify(profileData, null, 2), "utf8");
      this.loadProfiles();
      return true;
    } catch (err) {
      console.error("AppMenuService: Error saving custom profile:", err);
      return false;
    }
  }

  resetProfilesToDefault() {
    this.loadProfiles();
    this.menuCache.clear();
    return true;
  }

  clearCache() {
    this.menuCache.clear();
  }
}

const appMenuService = new AppMenuService();
module.exports = {
  appMenuService,
  AppMenuService,
  GENERIC_MENUS,
};
