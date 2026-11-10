"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Aura Island: package.json has proper branding, MIT license, and build configs", () => {
  const pkgPath = path.join(__dirname, "../package.json");
  assert.ok(fs.existsSync(pkgPath), "package.json must exist");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  assert.equal(pkg.name, "aura-island");
  assert.equal(pkg.productName, "Aura Island");
  assert.equal(pkg.license, "MIT");
  assert.equal(pkg.build.appId, "com.auraisland.app");
  assert.equal(pkg.build.productName, "Aura Island");
  assert.equal(pkg.build.win.artifactName, "AuraIsland-Windows-v${version}-Setup.${ext}");
});

test("Aura Island: About & Credits screen exists and properly credits original author", () => {
  const aboutPath = path.join(__dirname, "../src/components/AboutCredits.jsx");
  assert.ok(fs.existsSync(aboutPath), "AboutCredits.jsx must exist");
  const content = fs.readFileSync(aboutPath, "utf8");

  assert.ok(content.includes("Aura Island"), "Must contain Aura Island product branding");
  assert.ok(content.includes("nabil24024004") || content.includes("Abrar Nabil"), "Must credit original author Abrar Nabil");
  assert.ok(content.includes("Quick-Pill"), "Must reference original Quick-Pill project");
  assert.ok(content.includes("MIT License"), "Must display MIT license notice");
  assert.ok(content.includes("https://github.com/nabil24024004/Quick-Pill-Dynamic-Island-for-Windows"), "Must link to upstream repository");
});

test("Aura Island: MediaControls component exists with playback controls and scrubber", () => {
  const mediaPath = path.join(__dirname, "../src/components/MediaControls.jsx");
  assert.ok(fs.existsSync(mediaPath), "MediaControls.jsx must exist");
  const content = fs.readFileSync(mediaPath, "utf8");

  assert.ok(content.includes("SkipBack"), "Must include SkipBack icon/control");
  assert.ok(content.includes("SkipForward"), "Must include SkipForward icon/control");
  assert.ok(content.includes("onPlayPause"), "Must support onPlayPause handler");
  assert.ok(content.includes("formatTime"), "Must format scrubber time");
});

test("Aura Island: SettingsView component exists with General and About navigation", () => {
  const settingsPath = path.join(__dirname, "../src/components/SettingsView.jsx");
  assert.ok(fs.existsSync(settingsPath), "SettingsView.jsx must exist");
  const content = fs.readFileSync(settingsPath, "utf8");

  assert.ok(content.includes("Always on Top"), "Must include Always on Top toggle");
  assert.ok(content.includes("Start with Windows"), "Must include Start with Windows option");
  assert.ok(content.includes("AboutCredits"), "Must render AboutCredits");
});

test("Aura Island: Island.jsx has compact notch idle size, spring transitions, and ErrorBoundary", () => {
  const islandPath = path.join(__dirname, "../src/Island.jsx");
  assert.ok(fs.existsSync(islandPath), "Island.jsx must exist");
  const content = fs.readFileSync(islandPath, "utf8");

  assert.ok(content.includes("ErrorBoundary"), "Must wrap view in ErrorBoundary");
  assert.ok(content.includes("MediaControls"), "Must include MediaControls");
  assert.ok(content.includes("SettingsView"), "Must include SettingsView");
  assert.ok(content.includes("stiffness: 350"), "Must have spring physics stiffness: 350");
  assert.ok(content.includes("damping: 28"), "Must have spring physics damping: 28");
});

test("Aura Island: main.js enforces single-instance protection, logging, and non-stealing launch", () => {
  const mainPath = path.join(__dirname, "../src/main.js");
  assert.ok(fs.existsSync(mainPath), "main.js must exist");
  const content = fs.readFileSync(mainPath, "utf8");

  assert.ok(content.includes("app.requestSingleInstanceLock()"), "Must enforce single-instance lock");
  assert.ok(content.includes("aura-island.log"), "Must log to aura-island.log");
  assert.ok(content.includes("mainWindow.showInactive()"), "Must use showInactive to avoid focus stealing");
  assert.ok(content.includes("setIgnoreMouseEvents"), "Must manage mouse click-through");
  assert.ok(content.includes("screen-saver"), "Must assert screen-saver topmost level");
});

test("Aura Island: mediaHelper service exists and provides GSMTC integration", () => {
  const mediaHelperPath = path.join(__dirname, "../src/services/mediaHelper.js");
  assert.ok(fs.existsSync(mediaHelperPath), "mediaHelper.js must exist");
  const { initMediaHelper } = require("../src/services/mediaHelper");
  assert.equal(typeof initMediaHelper, "function");

  const helper = initMediaHelper();
  assert.equal(typeof helper.getSystemMedia, "function");
  assert.equal(typeof helper.controlSystemMedia, "function");
  assert.equal(typeof helper.controlSystemVolume, "function");
});

test("Aura Island: No Apple trademarks in user-facing texts", () => {
  const filesToCheck = [
    path.join(__dirname, "../src/Island.jsx"),
    path.join(__dirname, "../src/components/AboutCredits.jsx"),
    path.join(__dirname, "../src/components/MediaControls.jsx"),
    path.join(__dirname, "../src/components/SettingsView.jsx"),
  ];

  for (const file of filesToCheck) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf8");
      // Check for user-facing string occurrences (excluding -apple-system CSS fallback)
      const sanitized = content.replace(/-apple-system/g, "");
      assert.ok(!sanitized.includes("Apple Music"), `${file} must not contain 'Apple Music'`);
      assert.ok(!sanitized.includes("Apple Dynamic Island"), `${file} must not contain 'Apple Dynamic Island'`);
      assert.ok(!sanitized.includes("Apple Inc"), `${file} must not contain 'Apple Inc'`);
    }
  }
});

test("Aura Island Smart Alerts: alertQueue handles priority and deduplication", () => {
  const { AlertQueue } = require("../src/services/alertQueue");
  const queue = new AlertQueue();

  let receivedAlert = null;
  queue.subscribe((alert) => {
    receivedAlert = alert;
  });

  // Show normal alert
  queue.showAlert({ type: "network", title: "Wi-Fi Connected", priority: 2 });
  assert.equal(receivedAlert?.title, "Wi-Fi Connected");

  // Higher priority alert preempts
  queue.showAlert({ type: "battery", title: "Low Battery", priority: 8 });
  assert.equal(receivedAlert?.title, "Low Battery");

  // Lower priority alert is queued, does not preempt
  queue.showAlert({ type: "download", title: "File Downloaded", priority: 5 });
  assert.equal(receivedAlert?.title, "Low Battery");

  // Dismissing battery alert surfaces the queued download alert
  queue.dismissCurrent();
  assert.equal(receivedAlert?.title, "File Downloaded");

  // Deduplication: updating download alert modifies active in-place
  queue.showAlert({ type: "download", title: "Updated Download", priority: 5 });
  assert.equal(receivedAlert?.title, "Updated Download");
  assert.equal(queue.queue.length, 1); // Only the wi-fi alert remaining in queue
});

test("Aura Island Smart Alerts: SmartAlertView component exists", () => {
  const smartAlertPath = path.join(__dirname, "../src/components/SmartAlertView.jsx");
  assert.ok(fs.existsSync(smartAlertPath), "SmartAlertView.jsx must exist");
  const content = fs.readFileSync(smartAlertPath, "utf8");

  assert.ok(content.includes("getAlertIcon"), "Must include getAlertIcon helper");
  assert.ok(content.includes("accentColor"), "Must support accentColor");
  assert.ok(content.includes("alert.progress"), "Must support alert.progress bar");
});

test("Aura Island Quick Toggles: QuickToggles component and system IPC handlers exist", () => {
  const togglesPath = path.join(__dirname, "../src/components/QuickToggles.jsx");
  assert.ok(fs.existsSync(togglesPath), "QuickToggles.jsx must exist");
  const togglesContent = fs.readFileSync(togglesPath, "utf8");

  assert.ok(togglesContent.includes("handleToggleWifi"), "Must handle Wi-Fi toggle");
  assert.ok(togglesContent.includes("handleToggleBluetooth"), "Must handle Bluetooth toggle");
  assert.ok(togglesContent.includes("handleToggleDnd"), "Must handle DND toggle");
  assert.ok(togglesContent.includes("handleToggleMute"), "Must handle Mute toggle");
  assert.ok(togglesContent.includes("handleScreenshot"), "Must handle Screenshot toggle");
  assert.ok(togglesContent.includes("handleLock"), "Must handle Lock toggle");

  const islandPath = path.join(__dirname, "../src/Island.jsx");
  const islandContent = fs.readFileSync(islandPath, "utf8");
  assert.ok(islandContent.includes("QuickToggles"), "Island.jsx must include QuickToggles");

  const mainPath = path.join(__dirname, "../src/main.js");
  const mainContent = fs.readFileSync(mainPath, "utf8");
  assert.ok(mainContent.includes("take-screenshot"), "main.js must register take-screenshot IPC");
  assert.ok(mainContent.includes("lock-workstation"), "main.js must register lock-workstation IPC");
  assert.ok(mainContent.includes("open-wifi-settings"), "main.js must register open-wifi-settings IPC");
  assert.ok(mainContent.includes("open-bluetooth-settings"), "main.js must register open-bluetooth-settings IPC");

  const preloadPath = path.join(__dirname, "../src/preload.js");
  const preloadContent = fs.readFileSync(preloadPath, "utf8");
  assert.ok(preloadContent.includes("takeScreenshot"), "preload.js must expose takeScreenshot");
  assert.ok(preloadContent.includes("lockWorkstation"), "preload.js must expose lockWorkstation");
  assert.ok(preloadContent.includes("openWifiSettings"), "preload.js must expose openWifiSettings");
  assert.ok(preloadContent.includes("openBluetoothSettings"), "preload.js must expose openBluetoothSettings");
});

test("Aura Island Phase 3: shelfStorage manages items, deduplication, and subscriber notifications", () => {
  const { ShelfStorage } = require("../src/services/shelfStorage");
  const shelf = new ShelfStorage();

  let lastList = null;
  const unsubscribe = shelf.subscribe((items) => {
    lastList = items;
  });

  // Add file item
  const item1 = shelf.addItem({
    name: "report.pdf",
    path: "C:\\Users\\USER\\Documents\\report.pdf",
    size: 1048576,
    type: "application/pdf",
    target: "shelf",
  });
  assert.equal(item1.name, "report.pdf");
  assert.equal(lastList.length, 1);
  assert.equal(lastList[0].name, "report.pdf");

  // Add second item (URL)
  const item2 = shelf.addItem({
    name: "GitHub Docs",
    path: "https://docs.github.com",
    size: 22,
    type: "url",
    isUrl: true,
    target: "shelf",
  });
  assert.equal(lastList.length, 2);

  // Deduplication by path: re-adding report.pdf moves it to front without duplicate
  shelf.addItem({
    name: "report.pdf",
    path: "C:\\Users\\USER\\Documents\\report.pdf",
    size: 2048576,
    type: "application/pdf",
    target: "shelf",
  });
  assert.equal(lastList.length, 2);
  assert.equal(lastList[0].size, 2048576);

  // Remove single item
  shelf.removeItem(item2.id);
  assert.equal(lastList.length, 1);
  assert.equal(lastList[0].name, "report.pdf");

  // Clear shelf
  shelf.clearShelf();
  assert.equal(lastList.length, 0);

  unsubscribe();
});

test("Aura Island Phase 3: DragMouthView and ShelfView components exist with drag-drop and shelf panels", () => {
  const mouthPath = path.join(__dirname, "../src/components/DragMouthView.jsx");
  assert.ok(fs.existsSync(mouthPath), "DragMouthView.jsx must exist");
  const mouthContent = fs.readFileSync(mouthPath, "utf8");

  assert.ok(mouthContent.includes("Save to Shelf"), "Must include 'Save to Shelf' drop tile");
  assert.ok(mouthContent.includes("Mail it (Gmail)"), "Must include 'Mail it (Gmail)' drop tile");
  assert.ok(mouthContent.includes("To your phone"), "Must include 'To your phone' drop tile");
  assert.ok(mouthContent.includes("handleDrop"), "Must handle drop event");

  const shelfPath = path.join(__dirname, "../src/components/ShelfView.jsx");
  assert.ok(fs.existsSync(shelfPath), "ShelfView.jsx must exist");
  const shelfContent = fs.readFileSync(shelfPath, "utf8");

  assert.ok(shelfContent.includes("handleOpenItem"), "Must support opening items");
  assert.ok(shelfContent.includes("handleRevealItem"), "Must support revealing files in explorer");
  assert.ok(shelfContent.includes("handleRemoveItem"), "Must support removing items");
  assert.ok(shelfContent.includes("handleClearAll"), "Must support clearing shelf");

  const islandPath = path.join(__dirname, "../src/Island.jsx");
  const islandContent = fs.readFileSync(islandPath, "utf8");
  assert.ok(islandContent.includes("DragMouthView"), "Island.jsx must import and use DragMouthView");
  assert.ok(islandContent.includes("ShelfView"), "Island.jsx must import and use ShelfView");
  assert.ok(islandContent.includes("drag-mouth"), "Island.jsx must support drag-mouth mode");

  const mainPath = path.join(__dirname, "../src/main.js");
  const mainContent = fs.readFileSync(mainPath, "utf8");
  assert.ok(mainContent.includes("open-path"), "main.js must register open-path IPC handler");

  const preloadPath = path.join(__dirname, "../src/preload.js");
  const preloadContent = fs.readFileSync(preloadPath, "utf8");
  assert.ok(preloadContent.includes("openPath"), "preload.js must expose openPath API");
});
