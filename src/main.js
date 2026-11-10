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
  return mediaHelper.controlSystemVolume(action);
});

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
  screen.on("display-metrics-changed", () => ensureAlwaysOnTop());
  screen.on("display-added", () => ensureAlwaysOnTop());
  screen.on("display-removed", () => ensureAlwaysOnTop());

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
