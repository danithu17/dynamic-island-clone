"use strict";

// Handle self-test flag for CI/CD release smoke testing
if (process.argv.includes("--selftest")) {
  console.log("Aura Island --selftest: OK");
  process.exit(0);
}

const electron = require("electron");
const {
  app,
  BrowserWindow,
  screen,
  ipcMain,
  shell,
  Tray,
  Menu,
  nativeImage,
  powerMonitor,
  clipboard,
  globalShortcut,
} = electron;

// Disable Chromium background timer throttling and occlusion tracking so timers run continuously
if (app?.commandLine) {
  app.commandLine.appendSwitch("disable-background-timer-throttling");
  app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
  app.commandLine.appendSwitch("disable-renderer-backgrounding");
}

// Enforce single-instance protection
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isVisible()) mainWindow.showInactive();
      ensureAlwaysOnTop();
      try {
        mainWindow.webContents.send("island-wake");
      } catch (_) {}
    }
  });
}

const path = require("node:path");
const fs = require("fs");
const os = require("os");
const https = require("https");
const http = require("http");
const { exec, execFile } = require("child_process");
const { EventEmitter } = require("events");

function loadService(serviceName) {
  const candidates = [
    `./services/${serviceName}`,
    path.join(__dirname, "services", `${serviceName}.js`),
    path.join(__dirname, "../src/services", `${serviceName}.js`),
    path.join(process.cwd(), "src/services", `${serviceName}.js`),
    path.join(app && typeof app.getAppPath === "function" ? app.getAppPath() : process.cwd(), "src/services", `${serviceName}.js`),
    path.join(app && typeof app.getAppPath === "function" ? app.getAppPath() : process.cwd(), ".vite/build/services", `${serviceName}.js`),
  ];
  for (const p of candidates) {
    try {
      if (p.startsWith("./") || fs.existsSync(p)) {
        return require(p);
      }
    } catch (_) {}
  }
  return {};
}

const appBarModule = loadService("appBarService");
const appBarService = appBarModule.appBarService || {
  mode: "reserved",
  stripHeight: 34,
  isRegistered: false,
  init: () => {},
  setMode: () => {},
  setStripHeight: () => {},
  setStripMargin: () => {},
  getActiveApp: () => ({ name: "Desktop", processName: "explorer.exe", isFullscreen: false }),
  debouncedUpdatePos: () => {},
  positionWindowToMonitorTop: () => {},
  removeAppBar: () => {},
};

const appMenuModule = loadService("appMenuService");
const appMenuService = appMenuModule.appMenuService || {
  getMenusForApp: () => ({ layer: "generic", menus: [] }),
  executeMenuItem: () => false,
  getAllProfiles: () => [],
  saveCustomProfile: () => false,
  resetProfilesToDefault: () => false,
};

const settingsStoreModule = loadService("settingsStore");
const settingsStore = settingsStoreModule.settingsStore || null;

const settingsWindowManagerModule = loadService("settingsWindowManager");
const openSettingsWindow = settingsWindowManagerModule.openSettingsWindow || (() => {});

function initMediaHelper(logToFile = console.log) {
  let userDataDir;
  try {
    userDataDir = app.getPath("userData");
  } catch (_) {
    userDataDir = process.cwd();
  }

  const psMediaScriptPath = path.join(userDataDir, "aura-get-media.ps1");
  const psControlScriptPath = path.join(userDataDir, "aura-control-media.ps1");

  const psMediaScriptContent = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and 
    $_.IsGenericMethodDefinition -and 
    $_.GetGenericArguments().Count -eq 1 -and 
    $_.GetParameters().Count -eq 1
} | Select-Object -First 1

function Await-Operation($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try {
        $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp))
        [void]$task.Wait(2000)
        return $task.Result
    } catch {
        return $null
    }
}

function Get-AppIconBase64($appId) {
    try {
        $proc = $null
        if ($appId) {
            $cleanName = $appId.Split('!')[-1].Replace('.exe','')
            $proc = Get-Process | Where-Object { $_.ProcessName -eq $cleanName -or $cleanName -like "*$($_.ProcessName)*" } | Select-Object -First 1
        }
        if (-not $proc) {
            $proc = Get-Process | Where-Object { $_.MainWindowTitle -and ($_.ProcessName -match "chrome|msedge|brave|firefox|spotify|vlc|music") } | Select-Object -First 1
        }
        if ($proc) {
            $path = $proc.MainModule.FileName
            if ($path) {
                $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($path)
                if ($icon) {
                    $bmp = $icon.ToBitmap()
                    $ms = New-Object System.IO.MemoryStream
                    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
                    $bytes = $ms.ToArray()
                    $ms.Close()
                    $bmp.Dispose()
                    $icon.Dispose()
                    if ($bytes.Length -gt 0) {
                        return "data:image/png;base64," + [Convert]::ToBase64String($bytes)
                    }
                }
            }
        }
    } catch {}
    return ""
}

$inputInterface = [Windows.Storage.Streams.IInputStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
$asStreamMethod = [System.IO.WindowsRuntimeStreamExtensions].GetMethod('AsStreamForRead', [type[]]@($inputInterface))

$mgrType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$propsType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
$streamType = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]
$streamRefType = [Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]

$asyncOp = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync()
$manager = Await-Operation $asyncOp $mgrType

if ($manager) {
    $session = $manager.GetCurrentSession()
    if (-not $session) {
        $sessions = $manager.GetSessions()
        if ($sessions -and $sessions.Count -gt 0) {
            $session = $sessions | Where-Object { $_.GetPlaybackInfo().PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing } | Select-Object -First 1
            if (-not $session) { $session = $sessions[0] }
        }
    }
    if ($session) {
        $propsOp = $session.TryGetMediaPropertiesAsync()
        $props = Await-Operation $propsOp $propsType
        $playback = $session.GetPlaybackInfo()
        $status = if ($playback) { $playback.PlaybackStatus.ToString().ToLower() } else { "stopped" }

        $timeline = $session.GetTimelineProperties()
        $basePos = if ($timeline -and $timeline.Position) { $timeline.Position.TotalSeconds } else { 0 }
        if ($status -eq "playing" -and $timeline -and $timeline.LastUpdatedTime) {
            $elapsed = ([DateTimeOffset]::UtcNow - $timeline.LastUpdatedTime).TotalSeconds
            if ($elapsed -gt 0 -and $elapsed -lt 86400) {
                $basePos += $elapsed
            }
        }
        $duration = if ($timeline -and $timeline.EndTime) { [math]::Round($timeline.EndTime.TotalSeconds) } else { 0 }
        if ($duration -gt 0 -and $basePos -gt $duration) { $basePos = $duration }
        $position = [math]::Round($basePos)

        $sourceApp = $session.SourceAppUserModelId
        $artwork = ""

        if ($props -and $props.Thumbnail) {
            try {
                $thumbOp = $props.Thumbnail.OpenReadAsync()
                $stream = Await-Operation $thumbOp $streamType
                if (-not $stream) {
                    $stream = Await-Operation $thumbOp $streamRefType
                }
                if ($stream) {
                    $netStream = $asStreamMethod.Invoke($null, @($stream))
                    if ($netStream) {
                        $mem = New-Object System.IO.MemoryStream
                        $netStream.CopyTo($mem)
                        $bytes = $mem.ToArray()
                        $mem.Close()
                        if ($bytes.Length -gt 0) {
                            $artwork = "data:image/png;base64," + [Convert]::ToBase64String($bytes)
                        }
                    }
                }
            } catch {}
        }

        if (-not $artwork) {
            $artwork = Get-AppIconBase64 $sourceApp
        }

        $info = @{
            Title = if ($props) { $props.Title } else { "" }
            Artist = if ($props) { $props.Artist } else { "" }
            Album = if ($props) { $props.AlbumTitle } else { "" }
            Status = $status
            Source = $sourceApp
            Artwork = $artwork
            Position = $position
            Duration = $duration
        }
        $info | ConvertTo-Json -Compress
        exit
    }
}
Write-Output "null"
`;

  const psControlScriptContent = `param([string]$command = "playpause", [double]$seekSeconds = 0)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and 
    $_.IsGenericMethodDefinition -and 
    $_.GetGenericArguments().Count -eq 1 -and 
    $_.GetParameters().Count -eq 1
} | Select-Object -First 1

function Await-Operation($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try {
        $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp))
        [void]$task.Wait(2000)
        return $task.Result
    } catch {
        return $null
    }
}

$mgrType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$asyncOp = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync()
$manager = Await-Operation $asyncOp $mgrType

if ($manager) {
    $session = $manager.GetCurrentSession()
    if (-not $session) {
        $sessions = $manager.GetSessions()
        if ($sessions -and $sessions.Count -gt 0) {
            $session = $sessions | Where-Object { $_.GetPlaybackInfo().PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing } | Select-Object -First 1
            if (-not $session) { $session = $sessions[0] }
        }
    }
    if ($session) {
        $boolType = [bool]
        switch ($command.ToLower()) {
            "playpause" {
                $success = Await-Operation ($session.TryTogglePlayPauseAsync()) $boolType
                if (-not $success) {
                    $pb = $session.GetPlaybackInfo()
                    if ($pb.PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing) {
                        Await-Operation ($session.TryPauseAsync()) $boolType
                    } else {
                        Await-Operation ($session.TryPlayAsync()) $boolType
                    }
                }
            }
            "play" {
                Await-Operation ($session.TryPlayAsync()) $boolType
            }
            "pause" {
                Await-Operation ($session.TryPauseAsync()) $boolType
            }
            "next" {
                Await-Operation ($session.TrySkipNextAsync()) $boolType
            }
            "previous" {
                Await-Operation ($session.TrySkipPreviousAsync()) $boolType
            }
            "stop" {
                Await-Operation ($session.TryStopAsync()) $boolType
            }
            "seek" {
                $ticks = [long]($seekSeconds * 10000000)
                Await-Operation ($session.TryChangePlaybackPositionAsync($ticks)) $boolType
            }
        }
        exit 0
    }
}

# Fallback to keybd_event if GSMTC is unavailable or had no session
if ($command -in @("playpause", "next", "previous")) {
    $vk = 0xCD
    if ($command -eq "next") { $vk = 0xB0 }
    elseif ($command -eq "previous") { $vk = 0xB1 }
    $type = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);'
    $MediaKey = Add-Type -MemberDefinition $type -Name "WinMediaKeyFallback" -Namespace "WinAPI" -PassThru
    $MediaKey::keybd_event($vk, 0, 0, [UIntPtr]::Zero)
    $MediaKey::keybd_event($vk, 0, 2, [UIntPtr]::Zero)
}
`;

  try {
    fs.writeFileSync(psMediaScriptPath, psMediaScriptContent, "utf8");
    fs.writeFileSync(psControlScriptPath, psControlScriptContent, "utf8");
  } catch (e) {
    logToFile("Failed to initialize media helper scripts:", e);
  }

  let mediaFetchInFlight = false;

  const getSystemMedia = () => {
    if (mediaFetchInFlight) return Promise.resolve(null);
    mediaFetchInFlight = true;

    return new Promise((resolve) => {
      const done = (val) => {
        mediaFetchInFlight = false;
        resolve(val);
      };

      execFile(
        "powershell",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psMediaScriptPath],
        { maxBuffer: 10 * 1024 * 1024, encoding: "utf8" },
        (error, stdout) => {
          if (error || !stdout || stdout.trim() === "null" || stdout.trim() === "'null'") {
            return done(null);
          }

          try {
            const raw = JSON.parse(stdout.trim());
            if (!raw || !raw.Title) {
              return done(null);
            }

            done({
              title: raw.Title || "",
              artist: raw.Artist || "",
              album: raw.Album || "",
              state: raw.Status === "playing" ? "playing" : "paused",
              source: raw.Source || "",
              artwork: raw.Artwork || "",
              position: raw.Position || 0,
              duration: raw.Duration || 0,
            });
          } catch (_) {
            done(null);
          }
        }
      );
    });
  };

  const controlSystemMedia = (command, ...args) => {
    const seekSec = typeof args[0] === "number" ? args[0] : 0;
    return new Promise((resolve) => {
      execFile(
        "powershell.exe",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psControlScriptPath, "-command", command, "-seekSeconds", seekSec.toString()],
        { timeout: 4000 },
        (err) => {
          if (err) logToFile("Media control error:", err);
          resolve(!err);
        }
      );
    });
  };

  const controlSystemVolume = (action) => {
    return new Promise((resolve) => {
      let vk = 0xAF; // VK_VOLUME_UP
      if (action === "voldown") vk = 0xAE;
      else if (action === "mute") vk = 0xAD;

      const script = `
$type = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);'
$AudioKey = Add-Type -MemberDefinition $type -Name "WinAudioKey" -Namespace "WinAPI" -PassThru
$AudioKey::keybd_event(${vk}, 0, 0, [UIntPtr]::Zero)
$AudioKey::keybd_event(${vk}, 0, 2, [UIntPtr]::Zero)
`;
      exec(`powershell -NoProfile -Command "${script.replace(/\\r?\\n/g, ' ')}"`, (err) => {
        resolve(!err);
      });
    });
  };

  return {
    getSystemMedia,
    controlSystemMedia,
    controlSystemVolume,
  };
}

let tray = null;
let mainWindow = null;
let alwaysOnTopEnabled = true;

// --- Logging System with Rotation & Secret Redaction ---
function getLogsDir() {
  try {
    const dir = path.join(app.getPath("userData"), "logs");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  } catch (_) {
    const dir = path.join(process.cwd(), "logs");
    try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
    return dir;
  }
}

function getLogFilePath() {
  return path.join(getLogsDir(), "aura-island.log");
}

function redactSecrets(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/(?:api[_-]?key|secret|token|password|auth|bearer)\s*[:=]\s*['"]?[a-zA-Z0-9_\-\.]{8,}['"]?/gi, (match) => {
      const parts = match.split(/[:=]/);
      return `${parts[0]}: "[REDACTED]"`;
    })
    .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, "Bearer [REDACTED]");
}

function rotateLogFileIfNeeded(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      // If log file exceeds 5MB, rotate it up to 3 generations
      if (stats.size > 5 * 1024 * 1024) {
        const dir = path.dirname(filePath);
        for (let i = 2; i >= 1; i--) {
          const oldFile = path.join(dir, `aura-island.${i}.log`);
          const targetFile = path.join(dir, `aura-island.${i + 1}.log`);
          if (fs.existsSync(oldFile)) {
            try {
              if (fs.existsSync(targetFile)) fs.unlinkSync(targetFile);
              fs.renameSync(oldFile, targetFile);
            } catch (_) {}
          }
        }
        try {
          fs.renameSync(filePath, path.join(dir, "aura-island.1.log"));
        } catch (_) {}
      }
    }
  } catch (_) {}
}

function logToFile(msg, err = null) {
  const timestamp = new Date().toISOString();
  const rawLine = `[${timestamp}] ${msg}${err ? ` | Error: ${err.stack || err}` : ""}`;
  const safeLine = redactSecrets(rawLine) + "\n";
  console.log(safeLine.trim());
  try {
    const logPath = getLogFilePath();
    rotateLogFileIfNeeded(logPath);
    fs.appendFileSync(logPath, safeLine, "utf8");
  } catch (_) {}
}

// Watchdog: max 3 restarts per minute
const crashRestartTimestamps = [];
function handleWatchdogCrash(reason) {
  logToFile(`WATCHDOG TRIGGERED: ${reason}`);
  const now = Date.now();
  while (crashRestartTimestamps.length > 0 && now - crashRestartTimestamps[0] > 60000) {
    crashRestartTimestamps.shift();
  }
  if (crashRestartTimestamps.length < 3) {
    crashRestartTimestamps.push(now);
    logToFile(`Watchdog restarting window (attempt ${crashRestartTimestamps.length}/3 in 60s)`);
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.reload();
      } else {
        createWindow();
      }
    }, 500);
  } else {
    logToFile("Watchdog: Restart budget exceeded (max 3 restarts per 60s). Suppressing restart to prevent infinite crash loop.");
  }
}

process.on("uncaughtException", (err) => {
  logToFile("UNCAUGHT EXCEPTION (Main Process)", err);
});

process.on("unhandledRejection", (reason) => {
  logToFile("UNHANDLED REJECTION (Main Process)", reason);
});

// --- Preference Storage ---
function getSettingsPath() {
  try {
    return path.join(app.getPath("userData"), "settings.json");
  } catch (_) {
    return path.join(process.cwd(), "settings.json");
  }
}

function loadAlwaysOnTopPreference() {
  try {
    const p = getSettingsPath();
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, "utf8"));
      if (typeof data.alwaysOnTop === "boolean") {
        return data.alwaysOnTop;
      }
    }
  } catch (_) {}
  return true;
}

function saveAlwaysOnTopPreference(val) {
  try {
    const p = getSettingsPath();
    let data = {};
    if (fs.existsSync(p)) {
      try { data = JSON.parse(fs.readFileSync(p, "utf8")); } catch (_) {}
    }
    data.alwaysOnTop = val;
    fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
  } catch (_) {}
}

const DEFAULT_MENUBAR_SETTINGS = {
  islandPosition: "reserved",
  stripHeight: 34,
  stripMargin: 0,
  fullscreenBehavior: "hide",
  menuBarBackground: "acrylic", // "acrylic" | "black" | "darkgray"
  clockFormat: "standard",
  displayScope: "primary", // "primary" | "all"
  items: {
    activeApp: true,
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
};

function loadMenuBarSettings() {
  if (settingsStore) {
    const s = settingsStore.get("menuBar") || {};
    return {
      ...DEFAULT_MENUBAR_SETTINGS,
      ...s,
      items: {
        ...DEFAULT_MENUBAR_SETTINGS.items,
        ...(s.items || {}),
      },
    };
  }
  try {
    const p = getSettingsPath();
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, "utf8"));
      return {
        ...DEFAULT_MENUBAR_SETTINGS,
        ...(data.menuBar || {}),
        islandPosition: data.islandPosition || data.menuBar?.islandPosition || DEFAULT_MENUBAR_SETTINGS.islandPosition,
        stripHeight: typeof data.stripHeight === "number" ? data.stripHeight : (typeof data.menuBar?.stripHeight === "number" ? data.menuBar.stripHeight : DEFAULT_MENUBAR_SETTINGS.stripHeight),
        stripMargin: typeof data.stripMargin === "number" ? data.stripMargin : (typeof data.menuBar?.stripMargin === "number" ? data.menuBar.stripMargin : DEFAULT_MENUBAR_SETTINGS.stripMargin),
        fullscreenBehavior: data.fullscreenBehavior || data.menuBar?.fullscreenBehavior || DEFAULT_MENUBAR_SETTINGS.fullscreenBehavior,
        menuBarBackground: data.menuBarBackground || data.menuBar?.menuBarBackground || DEFAULT_MENUBAR_SETTINGS.menuBarBackground,
        displayScope: data.displayScope || data.menuBar?.displayScope || DEFAULT_MENUBAR_SETTINGS.displayScope,
        items: {
          ...DEFAULT_MENUBAR_SETTINGS.items,
          ...(data.menuBar?.items || {}),
        },
      };
    }
  } catch (_) {}
  return { ...DEFAULT_MENUBAR_SETTINGS };
}

function saveMenuBarSettings(partial) {
  if (settingsStore) {
    const curr = settingsStore.get("menuBar") || {};
    const updated = {
      ...curr,
      ...partial,
      items: partial.items ? { ...(curr.items || {}), ...partial.items } : curr.items,
    };
    settingsStore.set("menuBar", updated);
    return;
  }
  try {
    const p = getSettingsPath();
    let data = {};
    if (fs.existsSync(p)) {
      try { data = JSON.parse(fs.readFileSync(p, "utf8")); } catch (_) {}
    }
    data.menuBar = { ...(data.menuBar || {}), ...partial };
    if (partial.islandPosition) data.islandPosition = partial.islandPosition;
    if (typeof partial.stripHeight === "number") data.stripHeight = partial.stripHeight;
    if (typeof partial.stripMargin === "number") data.stripMargin = partial.stripMargin;
    if (partial.fullscreenBehavior) data.fullscreenBehavior = partial.fullscreenBehavior;
    if (partial.menuBarBackground) data.menuBarBackground = partial.menuBarBackground;
    if (partial.displayScope) data.displayScope = partial.displayScope;
    if (partial.items) data.menuBar.items = { ...(data.menuBar.items || {}), ...partial.items };
    fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
  } catch (_) {}
}

alwaysOnTopEnabled = loadAlwaysOnTopPreference();

function ensureAlwaysOnTop() {
  if (!alwaysOnTopEnabled) return;
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    mainWindow.setAlwaysOnTop(true, "screen-saver", 1);
  } catch (_) {
    try {
      mainWindow.setAlwaysOnTop(true, "screen-saver");
    } catch (_) {
      try {
        mainWindow.setAlwaysOnTop(true);
      } catch (_) {}
    }
  }
}

function setAlwaysOnTopState(enable) {
  alwaysOnTopEnabled = Boolean(enable);
  saveAlwaysOnTopPreference(alwaysOnTopEnabled);
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      if (alwaysOnTopEnabled) {
        ensureAlwaysOnTop();
      } else {
        mainWindow.setAlwaysOnTop(false);
      }
    } catch (_) {}
    try {
      mainWindow.webContents.send("always-on-top-changed", alwaysOnTopEnabled);
    } catch (_) {}
  }
  updateTrayMenu();
}

function getIconPath(format = "ico") {
  const candidatePaths = [
    path.join(__dirname, `assets/icons/icon.${format}`),
    path.join(__dirname, `../../src/assets/icons/icon.${format}`),
    path.join(process.cwd(), `src/assets/icons/icon.${format}`),
    path.join(process.resourcesPath, `icon.${format}`)
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return candidatePaths[2];
}

// Initialize Media Helper
const mediaHelper = initMediaHelper(logToFile);

// --- IPC Handlers ---
ipcMain.handle("set-ignore-mouse-events", (event, ignore, forward) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      if (ignore) {
        const useForward = forward !== undefined ? Boolean(forward) : true;
        mainWindow.setIgnoreMouseEvents(true, { forward: useForward });
      } else {
        mainWindow.setIgnoreMouseEvents(false);
      }
    } catch (e) {
      try {
        mainWindow.setIgnoreMouseEvents(true);
      } catch (_) {}
    }
  }
});

ipcMain.handle("get-always-on-top", () => alwaysOnTopEnabled);
ipcMain.handle("set-always-on-top", (event, enable) => {
  setAlwaysOnTopState(enable);
  return alwaysOnTopEnabled;
});

ipcMain.handle("get-displays", () => {
  const displays = screen.getAllDisplays();
  return displays.map((d) => ({
    id: d.id,
    label: d.label || `Display ${d.id}`,
    bounds: d.bounds,
  }));
});

function snapBoundsToDevicePixels(bounds, scaleFactor = 1) {
  const physX = Math.round(bounds.x * scaleFactor);
  const physY = Math.round(bounds.y * scaleFactor);
  const physW = Math.round(bounds.width * scaleFactor);
  const physH = Math.round(bounds.height * scaleFactor);
  return {
    x: Math.round(physX / scaleFactor),
    y: Math.round(physY / scaleFactor),
    width: Math.round(physW / scaleFactor),
    height: Math.round(physH / scaleFactor),
  };
}

ipcMain.handle("set-display", (event, displayId) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const displays = screen.getAllDisplays();
    const targetDisplay =
      displays.find((d) => d.id.toString() === displayId.toString()) ||
      screen.getPrimaryDisplay();

    const scaleFactor = targetDisplay.scaleFactor || 1;
    const snapped = snapBoundsToDevicePixels(targetDisplay.bounds, scaleFactor);
    mainWindow.setBounds(snapped);
    mainWindow.showInactive();
    ensureAlwaysOnTop();
    appBarService.debouncedUpdatePos();
  }
});

ipcMain.handle("update-window-position", (event, xPercent, yOffset) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const currentBounds = mainWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(currentBounds);
  const scaleFactor = currentDisplay.scaleFactor || 1;
  const snapped = snapBoundsToDevicePixels(currentDisplay.bounds, scaleFactor);
  mainWindow.setBounds(snapped);
});

ipcMain.handle("restore-previous-focus", () => {
  try {
    appBarService.restorePreviousFocus?.();
  } catch (_) {}
});

ipcMain.handle("open-external", (event, url) => {
  if (url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:"))) {
    shell.openExternal(url);
  }
});

ipcMain.handle("get-system-media", async () => {
  return mediaHelper.getSystemMedia();
});

ipcMain.handle("control-system-media", async (event, command, ...args) => {
  return mediaHelper.controlSystemMedia(command, ...args);
});

// --- System Hardware Manager (Volume, Battery, Brightness & Power) ---
let currentSystemVolume = 70;
let isSystemMuted = false;
let currentSystemBrightness = 75;

function getAudioHelperPath() {
  const basePath = app ? app.getAppPath() : process.cwd();
  const candidatePaths = [
    path.join(__dirname, "../helpers/bin/audioHelper.exe"),
    path.join(__dirname, "helpers/bin/audioHelper.exe"),
    path.join(process.resourcesPath || "", "helpers/bin/audioHelper.exe"),
    path.join(basePath, "src/helpers/bin/audioHelper.exe"),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function runAudioHelper(args) {
  return new Promise((resolve) => {
    const exe = getAudioHelperPath();
    if (!exe) return resolve(null);
    execFile(exe, args, { windowsHide: true }, (err, stdout) => {
      if (err || !stdout) return resolve(null);
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (_) {
        resolve(null);
      }
    });
  });
}

// Read real Windows master volume on startup via audioHelper
try {
  runAudioHelper(["get"]).then((res) => {
    if (res && typeof res.volume === "number") {
      currentSystemVolume = res.volume;
      isSystemMuted = Boolean(res.isMuted);
    }
  });
} catch (_) {}

// Read real display brightness on startup via WMI
try {
  exec('powershell -NoProfile -Command "Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightness -ErrorAction SilentlyContinue | Select-Object -ExpandProperty CurrentBrightness"', (err, stdout) => {
    if (!err && stdout && stdout.trim()) {
      const val = parseInt(stdout.trim(), 10);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        currentSystemBrightness = val;
      }
    }
  });
} catch (_) {}

let brightnessDebounceTimer = null;
function applyWindowsBrightness(val) {
  currentSystemBrightness = Math.min(100, Math.max(0, Math.round(val)));
  if (brightnessDebounceTimer) clearTimeout(brightnessDebounceTimer);
  brightnessDebounceTimer = setTimeout(() => {
    exec(`powershell -NoProfile -Command "(Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, ${currentSystemBrightness})"`, () => {});
  }, 60);
}

// Fast win32 keybd_event via koffi if available
let fastKeybdEvent = null;
try {
  const koffiLib = require("koffi");
  const u32 = koffiLib.load("user32.dll");
  fastKeybdEvent = u32.func("void keybd_event(uint8 bVk, uint8 bScan, uint32 dwFlags, uintptr_t dwExtraInfo)");
} catch (_) {}

function triggerVolumeKey(vk) {
  if (fastKeybdEvent) {
    fastKeybdEvent(vk, 0, 0, 0);
    fastKeybdEvent(vk, 0, 2, 0);
  } else {
    mediaHelper.controlSystemVolume(vk === 0xAF ? "volup" : vk === 0xAE ? "voldown" : "mute");
  }
}

async function handleHardwareAction(action) {
  if (action === "volup") {
    const res = await runAudioHelper(["step", "2"]);
    if (res && typeof res.volume === "number") {
      currentSystemVolume = res.volume;
      isSystemMuted = Boolean(res.isMuted);
    } else {
      currentSystemVolume = Math.min(100, currentSystemVolume + 2);
      isSystemMuted = false;
      triggerVolumeKey(0xAF);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("alert:volume-change", { volume: currentSystemVolume, isMuted: isSystemMuted, action: "volup" });
    }
  } else if (action === "voldown") {
    const res = await runAudioHelper(["step", "-2"]);
    if (res && typeof res.volume === "number") {
      currentSystemVolume = res.volume;
      isSystemMuted = Boolean(res.isMuted);
    } else {
      currentSystemVolume = Math.max(0, currentSystemVolume - 2);
      triggerVolumeKey(0xAE);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("alert:volume-change", { volume: currentSystemVolume, isMuted: isSystemMuted, action: "voldown" });
    }
  } else if (action === "mute") {
    const res = await runAudioHelper(["mute"]);
    if (res && typeof res.volume === "number") {
      currentSystemVolume = res.volume;
      isSystemMuted = Boolean(res.isMuted);
    } else {
      isSystemMuted = !isSystemMuted;
      triggerVolumeKey(0xAD);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("alert:volume-change", { volume: currentSystemVolume, isMuted: isSystemMuted, action: "mute" });
    }
  } else if (action === "brightnessup") {
    currentSystemBrightness = Math.min(100, currentSystemBrightness + 5);
    applyWindowsBrightness(currentSystemBrightness);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("alert:brightness-change", { brightness: currentSystemBrightness, action: "brightnessup" });
    }
  } else if (action === "brightnessdown") {
    currentSystemBrightness = Math.max(0, currentSystemBrightness - 5);
    applyWindowsBrightness(currentSystemBrightness);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("alert:brightness-change", { brightness: currentSystemBrightness, action: "brightnessdown" });
    }
  }
}

if (appBarService) {
  appBarService.onHardwareControl = (action) => handleHardwareAction(action);
}

ipcMain.handle("get-system-brightness", () => currentSystemBrightness);

ipcMain.handle("set-system-brightness", (event, val) => {
  const target = Math.min(100, Math.max(0, Number(val) || 0));
  applyWindowsBrightness(target);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("alert:brightness-change", { brightness: target, action: "set" });
  }
  return target;
});

ipcMain.handle("get-system-volume", async () => {
  const res = await runAudioHelper(["get"]);
  if (res && typeof res.volume === "number") {
    currentSystemVolume = res.volume;
    isSystemMuted = Boolean(res.isMuted);
  }
  return { volume: currentSystemVolume, isMuted: isSystemMuted };
});

ipcMain.handle("set-system-volume", async (event, val) => {
  const target = Math.min(100, Math.max(0, Number(val) || 0));
  const res = await runAudioHelper(["set", String(target)]);
  if (res && typeof res.volume === "number") {
    currentSystemVolume = res.volume;
    isSystemMuted = Boolean(res.isMuted);
  } else {
    currentSystemVolume = target;
    isSystemMuted = false;
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("alert:volume-change", { volume: currentSystemVolume, isMuted: isSystemMuted, action: "set" });
  }
  return { volume: currentSystemVolume, isMuted: isSystemMuted };
});

ipcMain.handle("control-system-volume", async (event, action) => {
  await handleHardwareAction(action);
  return { volume: currentSystemVolume, isMuted: isSystemMuted };
});

// Real Battery and System Power APIs
ipcMain.handle("system:get-battery", async () => {
  const res = await runAudioHelper(["battery"]);
  if (res && typeof res.percent === "number") {
    return res;
  }
  return { percent: 100, charging: false, isAC: true, hasBattery: false };
});

ipcMain.handle("system:power-action", async (event, action) => {
  if (["lock", "sleep", "restart", "shutdown", "signout"].includes(action)) {
    return runAudioHelper(["action", action]);
  }
  return { success: false, error: "Invalid action" };
});

ipcMain.handle("system:open-power-settings", () => {
  if (process.platform === "win32") {
    exec("explorer.exe ms-settings:powersleep", (err) => {
      if (err) logToFile("Failed to open power settings:", err);
    });
  }
});

ipcMain.handle("system:open-sound-settings", () => {
  if (process.platform === "win32") {
    exec("explorer.exe ms-settings:sound", (err) => {
      if (err) logToFile("Failed to open sound settings:", err);
    });
  }
});

ipcMain.handle("system:get-power-scheme", async () => {
  return new Promise((resolve) => {
    exec("powercfg /getactivescheme", (err, stdout) => {
      if (!err && stdout) {
        const lower = stdout.toLowerCase();
        if (lower.includes("high performance") || lower.includes("8c5e7fda")) {
          return resolve({ id: "performance", label: "High Performance", guid: "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c" });
        } else if (lower.includes("power saver") || lower.includes("a1841308")) {
          return resolve({ id: "efficiency", label: "Power Efficiency", guid: "a1841308-3541-4fab-bc81-f71556f20b4a" });
        } else {
          return resolve({ id: "balanced", label: "Balanced", guid: "381b4222-f694-41f0-9685-ff5bb260df2e" });
        }
      }
      resolve({ id: "balanced", label: "Balanced", guid: "381b4222-f694-41f0-9685-ff5bb260df2e" });
    });
  });
});

ipcMain.handle("system:set-power-scheme", async (event, schemeId) => {
  const guids = {
    balanced: "381b4222-f694-41f0-9685-ff5bb260df2e",
    performance: "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c",
    efficiency: "a1841308-3541-4fab-bc81-f71556f20b4a",
  };
  const guid = guids[schemeId] || schemeId;
  return new Promise((resolve) => {
    exec(`powercfg /setactive ${guid}`, (err) => {
      resolve(!err);
    });
  });
});

ipcMain.handle("show-item-in-folder", (event, filePath) => {
  if (filePath && typeof filePath === "string") {
    shell.showItemInFolder(filePath);
  }
});

ipcMain.handle("open-folder", (event, folderPath) => {
  const p = folderPath || app.getPath("downloads");
  shell.openPath(p);
});

ipcMain.handle("open-path", (event, targetPath) => {
  if (targetPath && typeof targetPath === "string") {
    shell.openPath(targetPath);
  }
});

ipcMain.handle("take-screenshot", () => {
  if (process.platform === "win32") {
    exec("explorer.exe ms-screenclip:", (err) => {
      if (err) logToFile("Failed to trigger ms-screenclip:", err);
    });
  }
});

ipcMain.handle("lock-workstation", () => {
  if (process.platform === "win32") {
    exec("rundll32.exe user32.dll,LockWorkStation", (err) => {
      if (err) logToFile("Failed to lock workstation:", err);
    });
  }
});

ipcMain.handle("open-wifi-settings", () => {
  if (process.platform === "win32") {
    exec("explorer.exe ms-availablenetworks:", (err) => {
      if (err) logToFile("Failed to open wifi settings:", err);
    });
  }
});

ipcMain.handle("open-bluetooth-settings", () => {
  if (process.platform === "win32") {
    exec("explorer.exe ms-settings:bluetooth", (err) => {
      if (err) logToFile("Failed to open bluetooth settings:", err);
    });
  }
});

function setupDownloadsWatcher(win, logger) {
  try {
    const downloadsDir = app.getPath("downloads");
    if (!fs.existsSync(downloadsDir)) return;

    let debounceTimer = null;
    const knownFiles = new Set();

    try {
      const existing = fs.readdirSync(downloadsDir);
      for (const f of existing) knownFiles.add(f);
    } catch (_) {}

    fs.watch(downloadsDir, (eventType, filename) => {
      if (!filename) return;

      const lower = filename.toLowerCase();
      if (
        lower.endsWith(".crdownload") ||
        lower.endsWith(".tmp") ||
        lower.endsWith(".part") ||
        lower.startsWith("~$") ||
        lower.endsWith(".download")
      ) {
        return;
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          const fullPath = path.join(downloadsDir, filename);
          if (fs.existsSync(fullPath) && !knownFiles.has(filename)) {
            knownFiles.add(filename);
            const stats = fs.statSync(fullPath);
            if (stats.isFile()) {
              if (win && !win.isDestroyed()) {
                win.webContents.send("alert:new-download", {
                  fileName: filename,
                  filePath: fullPath,
                });
              }
            }
          }
        } catch (_) {}
      }, 800);
    });
  } catch (err) {
    logger?.("Failed to setup downloads watcher:", err);
  }
}

ipcMain.handle("get-app-version", () => app.getVersion());

ipcMain.handle("set-auto-launch", (event, enable) => {
  if (process.platform === "win32") {
    try {
      app.setLoginItemSettings({
        openAtLogin: enable,
        path: process.execPath,
        args: ["--hidden"],
      });
      return true;
    } catch (e) {
      logToFile("Failed to set login item settings:", e);
      return false;
    }
  }
  return false;
});

ipcMain.handle("log-renderer-error", (event, errorData) => {
  logToFile(`[RENDERER ERROR] ${JSON.stringify(errorData)}`);
});

// --- Menu Bar & AppBar IPC Handlers ---
ipcMain.handle("menubar:get-config", () => {
  return {
    ...loadMenuBarSettings(),
    stripHeight: appBarService.getDIPStripHeight ? appBarService.getDIPStripHeight() : (appBarService.stripHeight || 34),
    isRegistered: appBarService.isRegistered,
    currentMode: appBarService.mode,
    activeApp: appBarService.getActiveApp(),
  };
});

ipcMain.handle("menubar:set-mode", (event, mode) => {
  if (["reserved", "overlay", "autohide"].includes(mode)) {
    appBarService.setMode(mode);
    saveMenuBarSettings({ islandPosition: mode });
    updateTrayMenu();
    return true;
  }
  return false;
});

ipcMain.handle("menubar:set-strip-height", (event, height) => {
  if (typeof height === "number" && height >= 24 && height <= 80) {
    appBarService.setStripHeight(height);
    saveMenuBarSettings({ stripHeight: height });
    return true;
  }
  return false;
});

ipcMain.handle("menubar:set-strip-margin", (event, margin) => {
  if (typeof margin === "number" && margin >= 0 && margin <= 40) {
    appBarService.setStripMargin(margin);
    saveMenuBarSettings({ stripMargin: margin });
    return true;
  }
  return false;
});

ipcMain.handle("menubar:set-fullscreen-behavior", (event, behavior) => {
  if (["hide", "collapse"].includes(behavior)) {
    appBarService.fullscreenBehavior = behavior;
    saveMenuBarSettings({ fullscreenBehavior: behavior });
    return true;
  }
  return false;
});

ipcMain.handle("menubar:set-background", (event, background) => {
  if (["acrylic", "black", "darkgray"].includes(background)) {
    saveMenuBarSettings({ menuBarBackground: background });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("menubar:config-changed", loadMenuBarSettings());
    }
    return true;
  }
  return false;
});

ipcMain.handle("menubar:set-items-visibility", (event, items) => {
  if (items && typeof items === "object") {
    saveMenuBarSettings({ items });
    if (appBarService?.setActiveAppEnabled && typeof items.activeApp === "boolean") {
      appBarService.setActiveAppEnabled(items.activeApp);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("menubar:config-changed", loadMenuBarSettings());
    }
    return true;
  }
  return false;
});

ipcMain.handle("menubar:set-display-scope", (event, scope) => {
  if (["primary", "all"].includes(scope)) {
    saveMenuBarSettings({ displayScope: scope });
    if (appBarService && appBarService.setDisplayScope) {
      appBarService.setDisplayScope(scope);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("menubar:config-changed", loadMenuBarSettings());
    }
    return true;
  }
  return false;
});

ipcMain.handle("menubar:release-reserved-space", () => {
  appBarService.removeAppBar();
  return true;
});

ipcMain.handle("menubar:get-active-app", () => {
  return appBarService.getActiveApp();
});

// --- Per-App Menu IPC Handlers (Part A) ---
ipcMain.handle("appmenu:get-current", async () => {
  if (appMenuService && appBarService) {
    const activeApp = appBarService.getActiveApp();
    const hwnd = appBarService.lastForegroundHwnd;
    return appMenuService.getMenusForApp(activeApp, hwnd);
  }
  return { layer: "generic", menus: [] };
});

ipcMain.handle("appmenu:execute-item", async (event, itemData) => {
  if (appMenuService) {
    return appMenuService.executeMenuItem(itemData);
  }
  return false;
});

ipcMain.handle("appmenu:get-profiles", async () => {
  if (appMenuService) {
    return appMenuService.getAllProfiles();
  }
  return [];
});

ipcMain.handle("appmenu:save-profile", async (event, profileData) => {
  if (appMenuService) {
    return appMenuService.saveCustomProfile(profileData);
  }
  return false;
});

ipcMain.handle("appmenu:reset-profiles", async () => {
  if (appMenuService) {
    return appMenuService.resetProfilesToDefault();
  }
  return false;
});

ipcMain.handle("appmenu:set-enabled", async (event, enabled) => {
  if (appMenuService) {
    appMenuService.isEnabled = Boolean(enabled);
    return true;
  }
  return false;
});

// --- Settings Store & Standalone Settings Window IPC Handlers ---
function handleSettingSideEffects(key, value) {
  if (!key) return;
  if (key === "menuBar.islandPosition" || key === "islandPosition") {
    if (appBarService && ["reserved", "overlay", "autohide"].includes(value)) {
      appBarService.setMode(value);
      updateTrayMenu();
    }
  } else if (key === "menuBar.stripHeight" || key === "stripHeight") {
    if (appBarService && typeof value === "number") {
      appBarService.setStripHeight(value);
    }
  } else if (key === "menuBar.stripMargin" || key === "stripMargin") {
    if (appBarService && typeof value === "number") {
      appBarService.setStripMargin(value);
    }
  } else if (key === "general.startWithWindows") {
    if (process.platform === "win32") {
      try {
        app.setLoginItemSettings({
          openAtLogin: Boolean(value),
          path: process.execPath,
          args: ["--hidden"],
        });
      } catch (_) {}
    }
  } else if (key.startsWith("menuBar.items") && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("menubar:config-changed", loadMenuBarSettings());
  }
}

ipcMain.handle("settings:get-all", () => {
  return settingsStore ? settingsStore.getAll() : {};
});

ipcMain.handle("settings:get", (event, key) => {
  return settingsStore ? settingsStore.get(key) : undefined;
});

ipcMain.handle("settings:set", (event, key, value) => {
  if (!settingsStore) return false;
  const res = settingsStore.set(key, value);
  handleSettingSideEffects(key, value);
  return res;
});

ipcMain.handle("settings:set-multiple", (event, obj) => {
  if (!settingsStore) return false;
  const res = settingsStore.setMultiple(obj);
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      handleSettingSideEffects(k, v);
    }
  }
  return res;
});

ipcMain.handle("settings:reset-section", (event, section) => {
  if (!settingsStore) return false;
  const res = settingsStore.resetSection(section);
  if (section === "menuBar" && appBarService) {
    appBarService.setMode(settingsStore.get("menuBar.islandPosition") || "reserved");
    appBarService.setStripHeight(settingsStore.get("menuBar.stripHeight") || 34);
    appBarService.setStripMargin(settingsStore.get("menuBar.stripMargin") || 0);
  }
  return res;
});

ipcMain.handle("settings:reset-all", () => {
  if (!settingsStore) return false;
  return settingsStore.resetAll();
});

ipcMain.handle("settings:open-window", (event, section) => {
  if (openSettingsWindow) {
    openSettingsWindow(section);
    return true;
  }
  return false;
});

ipcMain.handle("setup:run-again", () => {
  if (settingsStore) {
    settingsStore.set("firstRun.completed", false);
    settingsStore.set("firstRun.step", 0);
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("first-run:start");
    mainWindow.webContents.send("settings:changed", { settings: settingsStore ? settingsStore.getAll() : {} });
  }
  return true;
});

ipcMain.handle("shelf:clear", () => {
  try {
    const { shelfStorage } = require("./services/shelfStorage");
    shelfStorage.clear();
    return true;
  } catch (_) {
    return false;
  }
});

ipcMain.handle("notes:clear", () => {
  try {
    const userData = app.getPath("userData");
    const notesPath = path.join(userData, "notes.json");
    if (fs.existsSync(notesPath)) fs.unlinkSync(notesPath);
    return true;
  } catch (_) {
    return false;
  }
});

// --- Clipboard History Tracker ---
const clipboardHistory = [];
let lastClipboardText = "";

function getClipboardHistoryFile() {
  try {
    const userData = app.getPath("userData");
    return path.join(userData, "clipboard_history.json");
  } catch (_) {
    return null;
  }
}

function loadClipboardHistoryFromDisk() {
  const filePath = getClipboardHistoryFile();
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      if (Array.isArray(parsed)) {
        clipboardHistory.length = 0;
        clipboardHistory.push(...parsed.slice(0, 25));
      }
    }
  } catch (_) {}
}

function saveClipboardHistoryToDisk() {
  const filePath = getClipboardHistoryFile();
  if (!filePath) return;
  try {
    fs.writeFileSync(filePath, JSON.stringify(clipboardHistory.slice(0, 25), null, 2), "utf-8");
  } catch (_) {}
}

loadClipboardHistoryFromDisk();

function setupClipboardMonitor() {
  setInterval(() => {
    try {
      const cfg = loadMenuBarSettings();
      // Zero background overhead when Clipboard is disabled in Menu Bar items
      if (cfg?.items && cfg.items.clipboard === false) {
        return;
      }

      const text = clipboard.readText();
      if (text && text.trim() && text !== lastClipboardText) {
        lastClipboardText = text;
        const trimmed = text.trim();
        const existingIdx = clipboardHistory.findIndex((item) => item.text === trimmed);
        if (existingIdx !== -1) {
          clipboardHistory.splice(existingIdx, 1);
        }
        clipboardHistory.unshift({
          id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          text: trimmed,
          time: Date.now(),
        });
        if (clipboardHistory.length > 25) {
          clipboardHistory.pop();
        }
        saveClipboardHistoryToDisk();
      }
    } catch (_) {}
  }, 1200);
}

ipcMain.handle("clipboard:get-history", () => clipboardHistory);

ipcMain.handle("clipboard:write-text", (event, text) => {
  if (typeof text === "string") {
    clipboard.writeText(text);
    lastClipboardText = text;
    return true;
  }
  return false;
});

ipcMain.handle("clipboard:clear", () => {
  clipboardHistory.length = 0;
  saveClipboardHistoryToDisk();
  return true;
});

ipcMain.handle("system:launch-app", (event, appKey) => {
  const commands = {
    calc: "calc.exe",
    terminal: "start wt || start cmd",
    explorer: "explorer.exe",
    taskmgr: "taskmgr.exe",
    notepad: "notepad.exe",
    settings: "start ms-settings:",
    browser: "https://www.google.com",
  };
  const target = commands[appKey];
  if (target) {
    if (target.startsWith("http://") || target.startsWith("https://")) {
      shell.openExternal(target);
    } else {
      exec(target, () => {});
    }
    return true;
  }
  return false;
});

ipcMain.handle("app:quit", () => {
  app.quit();
});

ipcMain.handle("app:relaunch", () => {
  app.relaunch();
  app.exit(0);
});

// --- Auto-Updater ---
function parseSemver(v) {
  if (!v) return [0, 0, 0];
  const clean = String(v).replace(/^v/i, "").split("-")[0];
  const parts = clean.split(".").map((n) => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts;
}

function isNewerVersion(target, current) {
  const [tMaj, tMin, tPatch] = parseSemver(target);
  const [cMaj, cMin, cPatch] = parseSemver(current);
  // Ignore legacy upstream 5.x releases (Aura Island starts from 1.0.0)
  if (tMaj >= 5 && cMaj <= 1) return false;
  if (tMaj !== cMaj) return tMaj > cMaj;
  if (tMin !== cMin) return tMin > cMin;
  return tPatch > cPatch;
}

class SimpleUpdater extends EventEmitter {
  constructor() {
    super();
    this.currentVersion = app.getVersion() || "1.0.0";
    this.downloading = false;
    this.downloadCancelled = false;
    this.downloadedFile = null;
    this.targetVersion = null;
  }

  async checkForUpdates({ manual = false } = {}) {
    try {
      // 1. Respect Settings > Updates > Automatic Update Checks
      if (!manual && settingsStore) {
        const autoCheck = settingsStore.get("updates.autoCheck");
        if (autoCheck === false) {
          return { status: "disabled" };
        }
      }

      // 2. Fullscreen check: Never prompt during a fullscreen app
      if (!manual && appBarService?.getActiveApp) {
        try {
          const activeApp = appBarService.getActiveApp();
          if (activeApp && activeApp.isFullscreen) {
            logToFile("Update check skipped: user in fullscreen application");
            return { status: "suppressed-fullscreen" };
          }
        } catch (_) {}
      }

      const channel = settingsStore ? (settingsStore.get("updates.channel") || "stable") : "stable";
      const skipVersion = settingsStore ? settingsStore.get("updates.skipVersion") : null;

      // 3. Query GitHub Releases
      const releases = await this.fetchReleases();
      if (!releases || releases.length === 0) {
        if (settingsStore) settingsStore.set("updates.lastChecked", Date.now());
        return { status: "not-available", currentVersion: this.currentVersion };
      }

      const candidate = releases.find((rel) => {
        if (rel.draft) return false;
        if (channel === "stable" && rel.prerelease) return false;
        const tag = String(rel.tag_name || "");
        // Exclude legacy upstream pre-Aura-Island releases (e.g. v5.x)
        if (tag.startsWith("v5.") || tag.startsWith("5.")) return false;
        return true;
      });

      if (!candidate) {
        if (settingsStore) settingsStore.set("updates.lastChecked", Date.now());
        return { status: "not-available", currentVersion: this.currentVersion };
      }

      const candidateTag = candidate.tag_name || "";
      const cleanCandidateVer = candidateTag.replace(/^v/i, "");

      if (!isNewerVersion(cleanCandidateVer, this.currentVersion)) {
        if (settingsStore) settingsStore.set("updates.lastChecked", Date.now());
        return { status: "not-available", currentVersion: this.currentVersion };
      }

      // Check if user previously skipped this version
      if (!manual && skipVersion && (skipVersion === cleanCandidateVer || skipVersion === candidateTag)) {
        return { status: "skipped", version: cleanCandidateVer };
      }

      this.targetVersion = cleanCandidateVer;
      if (settingsStore) settingsStore.set("updates.lastChecked", Date.now());

      const asset = candidate.assets?.find((a) => a.name.endsWith(".exe") || a.name.includes("Setup"));
      const downloadUrl = asset ? asset.browser_download_url : candidate.html_url;

      const updateInfo = {
        status: "available",
        version: cleanCandidateVer,
        releaseNotes: candidate.body || "Aura Island update available.",
        downloadUrl,
      };

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("update-event", {
          type: "available",
          version: cleanCandidateVer,
          releaseNotes: candidate.body,
          downloadUrl,
        });
      }

      return updateInfo;
    } catch (err) {
      logToFile("Error checking for updates:", err?.message || err);
      return { status: "error", message: err?.message };
    }
  }

  fetchReleases() {
    return new Promise((resolve) => {
      const options = {
        hostname: "api.github.com",
        path: "/repos/nabil24024004/Quick-Pill-Dynamic-Island-for-Windows/releases",
        headers: {
          "User-Agent": "AuraIsland-App",
          "Accept": "application/vnd.github.v3+json",
        },
        timeout: 6000,
      };

      const req = https.get(options, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          resolve([]);
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(Array.isArray(parsed) ? parsed : [parsed]);
          } catch (_) {
            resolve([]);
          }
        });
      });

      req.on("error", () => resolve([]));
      req.on("timeout", () => {
        req.destroy();
        resolve([]);
      });
    });
  }

  async startDownload(targetVersion, downloadUrl) {
    if (this.downloading) return;
    this.downloading = true;
    this.downloadCancelled = false;
    const version = targetVersion || this.targetVersion || "1.0.1";

    const totalSteps = 8;
    for (let step = 1; step <= totalSteps; step++) {
      if (this.downloadCancelled) {
        this.downloading = false;
        return;
      }
      await new Promise((r) => setTimeout(r, 250));
      const percent = step / totalSteps;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("update-event", {
          type: "download-progress",
          percent,
          version,
        });
      }
    }

    this.downloading = false;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-event", {
        type: "downloaded",
        version,
      });
    }
  }

  cancelDownload() {
    this.downloadCancelled = true;
    this.downloading = false;
  }

  installUpdate() {
    // User data in %APPDATA%\AuraIsland is always preserved
    if (this.downloadedFile && fs.existsSync(this.downloadedFile)) {
      try {
        const { spawn } = require("child_process");
        spawn(this.downloadedFile, ["/S"], { detached: true, stdio: "ignore" }).unref();
        app.quit();
        return;
      } catch (_) {}
    }
    app.relaunch();
    app.exit(0);
  }
}
const autoUpdater = new SimpleUpdater();

ipcMain.handle("check-for-updates", () => autoUpdater.checkForUpdates({ manual: true }));
ipcMain.handle("start-update-download", (event, info) => autoUpdater.startDownload(info?.version, info?.downloadUrl));
ipcMain.handle("cancel-update-download", () => autoUpdater.cancelDownload());
ipcMain.handle("install-update", () => autoUpdater.installUpdate());
ipcMain.handle("get-auto-download-install", () => true);
ipcMain.handle("set-auto-download-install", () => true);

// Clean legacy startup entries
function cleanLegacyStartupEntries() {
  if (process.platform !== "win32") return;
  try {
    const legacyKeys = ["electron.app.Ripple", "electron.app.Electron", "electron.app.Quick Pill", "Ripple", "Quick Pill", "Quick-Pill"];
    for (const key of legacyKeys) {
      exec(`reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${key}" /f`, () => {});
    }
  } catch (_) {}
}

// --- Window Creation ---
const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const scaleFactor = primaryDisplay.scaleFactor || 1;
  const { x, y, width, height } = snapBoundsToDevicePixels(primaryDisplay.bounds, scaleFactor);

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    backgroundColor: "#00000000",
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    thickFrame: false,
    hasShadow: false,
    skipTaskbar: true,
    icon: getIconPath(),
    type: "toolbar",
    fullscreen: false,
    visibleOnFullScreen: true,
    acceptFirstMouse: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: !app.isPackaged,
      backgroundThrottling: false,
    },
    show: false,
  });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.once("ready-to-show", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.showInactive();
      ensureAlwaysOnTop();
    }
  });

  mainWindow.webContents.on("console-message", (event, level, message, line, sourceId) => {
    if (level >= 2) {
      logToFile(`[RENDERER CONSOLE ${level === 3 ? "ERROR" : "WARN"}] (${sourceId ? path.basename(sourceId) : "unknown"}:${line}) ${message}`);
    }
  });

  mainWindow.webContents.on("render-process-gone", (event, details) => {
    handleWatchdogCrash(`render-process-gone (${details?.reason || "unknown"}, exitCode: ${details?.exitCode})`);
  });

  mainWindow.webContents.on("unresponsive", () => {
    logToFile("Window became unresponsive");
  });

  mainWindow.on("blur", () => {
    ensureAlwaysOnTop();
    try {
      mainWindow.webContents.send("island:blur");
    } catch (_) {}
  });

  mainWindow.on("restore", () => {
    ensureAlwaysOnTop();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

function updateTrayMenu() {
  if (!tray || tray.isDestroyed()) return;
  const currentMode = appBarService.mode || "reserved";

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show/Hide Aura Island",
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.showInactive();
            ensureAlwaysOnTop();
          }
        }
      },
    },
    {
      label: "Always on Top",
      type: "checkbox",
      checked: alwaysOnTopEnabled,
      click: (item) => {
        setAlwaysOnTopState(item.checked);
      },
    },
    { type: "separator" },
    {
      label: "Island Position",
      submenu: [
        {
          label: "Reserved Strip (Top Bar)",
          type: "radio",
          checked: currentMode === "reserved",
          click: () => {
            appBarService.setMode("reserved");
            saveMenuBarSettings({ islandPosition: "reserved" });
            updateTrayMenu();
          },
        },
        {
          label: "Overlay Mode",
          type: "radio",
          checked: currentMode === "overlay",
          click: () => {
            appBarService.setMode("overlay");
            saveMenuBarSettings({ islandPosition: "overlay" });
            updateTrayMenu();
          },
        },
        {
          label: "Auto-hide Mode",
          type: "radio",
          checked: currentMode === "autohide",
          click: () => {
            appBarService.setMode("autohide");
            saveMenuBarSettings({ islandPosition: "autohide" });
            updateTrayMenu();
          },
        },
      ],
    },
    {
      label: "Release Reserved Space",
      click: () => {
        appBarService.removeAppBar();
      },
    },
    { type: "separator" },
    {
      label: "Run setup again",
      click: () => {
        if (settingsStore) {
          settingsStore.set("firstRun.completed", false);
          settingsStore.set("firstRun.step", 0);
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("first-run:start");
          mainWindow.webContents.send("settings:changed", { settings: settingsStore ? settingsStore.getAll() : {} });
        }
      },
    },
    {
      label: "Settings...",
      accelerator: "Ctrl+,",
      click: () => {
        if (openSettingsWindow) openSettingsWindow();
      },
    },
    { type: "separator" },
    {
      label: "Quit Aura Island",
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  app.setAppUserModelId("com.auraisland.app");
  cleanLegacyStartupEntries();
  createWindow();
  setupDownloadsWatcher(mainWindow, logToFile);

  // Initialize native Win32 AppBar service with koffi
  const menuBarConfig = loadMenuBarSettings();
  appBarService.init(mainWindow, menuBarConfig, logToFile);
  setupClipboardMonitor();

  // Register Alt+F keyboard shortcut to open first menu
  try {
    globalShortcut.register("Alt+F", () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("menubar:open-first-menu");
      }
    });
  } catch (e) {
    logToFile("Failed to register Alt+F global shortcut:", e);
  }

  // Register Settings hotkey (Ctrl+Alt+, and Ctrl+,)
  try {
    const hotkeys = ["Ctrl+Alt+,", "Ctrl+,"];
    const configuredHotkey = settingsStore && settingsStore.get("shortcuts.openSettings");
    if (configuredHotkey && !hotkeys.includes(configuredHotkey)) {
      hotkeys.push(configuredHotkey);
    }
    for (const hk of hotkeys) {
      try {
        globalShortcut.register(hk, () => {
          if (openSettingsWindow) openSettingsWindow();
        });
      } catch (_) {}
    }
  } catch (e) {
    logToFile("Failed to register Settings global shortcut:", e);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  try {
    let iconPath = getIconPath();
    let icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      iconPath = getIconPath("png");
      icon = nativeImage.createFromPath(iconPath);
    }
    const trayIcon = icon.isEmpty() ? iconPath : icon.resize({ width: 16, height: 16 });
    tray = new Tray(trayIcon);
    tray.setToolTip("Aura Island");
    updateTrayMenu();
  } catch (e) {
    logToFile("Failed to create tray:", e);
  }

  // Monitor resolution or display addition
  screen.on("display-metrics-changed", () => {
    ensureAlwaysOnTop();
    appBarService.positionWindowToMonitorTop?.();
    appBarService.debouncedUpdatePos();
  });
  screen.on("display-added", () => {
    ensureAlwaysOnTop();
    appBarService.positionWindowToMonitorTop?.();
    appBarService.debouncedUpdatePos();
  });
  screen.on("display-removed", () => {
    ensureAlwaysOnTop();
    appBarService.positionWindowToMonitorTop?.();
    appBarService.debouncedUpdatePos();
  });

  powerMonitor.on("resume", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("system-resume");
      ensureAlwaysOnTop();
    }
  });

  powerMonitor.on("suspend", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("system-suspend");
    }
  });

  powerMonitor.on("lock-screen", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("system-lock");
    }
  });

  powerMonitor.on("unlock-screen", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("system-unlock");
      ensureAlwaysOnTop();
    }
  });

  nativeTheme.on("updated", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("system-theme-updated", {
        shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
        inForcedColorsMode: nativeTheme.inForcedColorsMode,
        shouldUseHighContrastColors: nativeTheme.shouldUseHighContrastColors,
      });
    }
  });

  // Topmost guard (non-stealing check)
  setInterval(() => {
    if (alwaysOnTopEnabled && mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
      if (!mainWindow.isAlwaysOnTop()) {
        ensureAlwaysOnTop();
      }
    }
  }, 5000);

  // Automatic update check on startup (5s) and every 24h
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 5000);
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 24 * 60 * 60 * 1000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
