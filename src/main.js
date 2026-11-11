"use strict";

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
} = require("electron");

// Disable Chromium background timer throttling and occlusion tracking so timers run continuously
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");
app.commandLine.appendSwitch("disable-renderer-backgrounding");

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
let appBarService;
try {
  appBarService = require("./services/appBarService").appBarService;
} catch (_) {
  try {
    const devPath = path.join(process.cwd(), "src/services/appBarService.js");
    if (fs.existsSync(devPath)) {
      appBarService = require(devPath).appBarService;
    } else {
      const appPath = path.join(app.getAppPath(), ".vite/build/services/appBarService.js");
      appBarService = require(appPath).appBarService;
    }
  } catch (err) {
    console.error("Critical: Could not load appBarService:", err);
  }
}

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

// --- Logging System ---
function getLogFilePath() {
  try {
    return path.join(app.getPath("userData"), "aura-island.log");
  } catch (_) {
    return path.join(process.cwd(), "aura-island.log");
  }
}

function logToFile(msg, err = null) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${msg}${err ? ` | Error: ${err.stack || err}` : ""}\n`;
  console.log(logLine.trim());
  try {
    const logPath = getLogFilePath();
    fs.appendFileSync(logPath, logLine, "utf8");
  } catch (_) {}
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

  try {
    mainWindow.moveTop();
  } catch (_) {}
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
        const useForward = forward !== undefined ? forward : true;
        mainWindow.setIgnoreMouseEvents(true, { forward: useForward });
      } else {
        mainWindow.setIgnoreMouseEvents(false);
        ensureAlwaysOnTop();
      }
    } catch (e) {
      try {
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
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

ipcMain.handle("set-display", (event, displayId) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const displays = screen.getAllDisplays();
    const targetDisplay =
      displays.find((d) => d.id.toString() === displayId.toString()) ||
      screen.getPrimaryDisplay();

    const { x, y, width, height } = targetDisplay.bounds;
    mainWindow.setBounds({ x, y, width, height });
    mainWindow.showInactive();
    ensureAlwaysOnTop();
    appBarService.debouncedUpdatePos();
  }
});

ipcMain.handle("update-window-position", (event, xPercent, yOffset) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const currentBounds = mainWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(currentBounds);
  const { x, y, width, height } = currentDisplay.bounds;
  mainWindow.setBounds({ x, y, width, height });
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

ipcMain.handle("control-system-volume", async (event, action) => {
  const res = await mediaHelper.controlSystemVolume(action);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("alert:volume-change", { action });
  }
  return res;
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

// --- Clipboard History Tracker ---
const clipboardHistory = [];
let lastClipboardText = "";

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
class SimpleUpdater extends EventEmitter {
  constructor() {
    super();
    this.currentVersion = app.getVersion();
  }
  async checkForUpdates() {
    return { status: "not-available" };
  }
}
const autoUpdater = new SimpleUpdater();

ipcMain.handle("check-for-updates", () => autoUpdater.checkForUpdates());
ipcMain.handle("start-update-download", () => Promise.resolve());
ipcMain.handle("cancel-update-download", () => Promise.resolve());
ipcMain.handle("install-update", () => Promise.resolve());
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
  const { x, y, width, height } = primaryDisplay.bounds;

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

  mainWindow.on("blur", () => {
    ensureAlwaysOnTop();
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

  // Topmost guard
  setInterval(() => {
    if (alwaysOnTopEnabled && mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
      if (!mainWindow.isAlwaysOnTop()) {
        ensureAlwaysOnTop();
      } else {
        try {
          mainWindow.moveTop();
        } catch (_) {}
      }
    }
  }, 3000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
