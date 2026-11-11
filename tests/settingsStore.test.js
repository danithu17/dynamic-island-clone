const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const { settingsStore, SettingsStore, DEFAULT_SETTINGS } = require("../src/services/settingsStore");
const { openSettingsWindow, getSettingsWindow, closeSettingsWindow } = require("../src/services/settingsWindowManager");

test("SettingsStore: exports singleton, class, and default schema", () => {
  assert.ok(settingsStore, "settingsStore singleton should be defined");
  assert.strictEqual(typeof SettingsStore, "function", "SettingsStore should be a class/function");
  assert.ok(DEFAULT_SETTINGS, "DEFAULT_SETTINGS should be defined");
  assert.strictEqual(DEFAULT_SETTINGS.version, 1);
  assert.ok(DEFAULT_SETTINGS.general);
  assert.ok(DEFAULT_SETTINGS.appearance);
  assert.ok(DEFAULT_SETTINGS.menuBar);
  assert.ok(DEFAULT_SETTINGS.island);
  assert.ok(DEFAULT_SETTINGS.alerts);
  assert.ok(DEFAULT_SETTINGS.shortcuts);
  assert.ok(DEFAULT_SETTINGS.features);
  assert.ok(DEFAULT_SETTINGS.accounts);
  assert.ok(DEFAULT_SETTINGS.windowState);
});

test("SettingsStore: get, set, and setMultiple work with dot notation", () => {
  const store = new SettingsStore();
  
  // Test initial default
  assert.strictEqual(store.get("menuBar.islandPosition"), "reserved");
  assert.strictEqual(store.get("shortcuts.openSettings"), "Ctrl+,");

  // Test set
  store.set("menuBar.islandPosition", "autohide");
  assert.strictEqual(store.get("menuBar.islandPosition"), "autohide");

  // Test setMultiple
  store.setMultiple({
    "appearance.theme": "light",
    "alerts.duration": 6,
  });
  assert.strictEqual(store.get("appearance.theme"), "light");
  assert.strictEqual(store.get("alerts.duration"), 6);
});

test("SettingsStore: validation clamps and guards invalid values", () => {
  const store = new SettingsStore();

  // Invalid stripHeight clamped to default 34
  store.set("menuBar.stripHeight", 9999);
  assert.strictEqual(store.get("menuBar.stripHeight"), 34);

  // Invalid mode clamped to "reserved"
  store.set("menuBar.islandPosition", "invalid_mode");
  assert.strictEqual(store.get("menuBar.islandPosition"), "reserved");

  // Valid stripHeight preserved
  store.set("menuBar.stripHeight", 48);
  assert.strictEqual(store.get("menuBar.stripHeight"), 48);
});

test("SettingsStore: resetSection and resetAll restore defaults", () => {
  const store = new SettingsStore();

  store.set("appearance.accentColor", "#ff0000");
  assert.strictEqual(store.get("appearance.accentColor"), "#ff0000");

  store.resetSection("appearance");
  assert.strictEqual(store.get("appearance.accentColor"), "#0a84ff");

  store.set("island.idleSize", "minimal");
  store.resetAll();
  assert.strictEqual(store.get("island.idleSize"), "compact");
});

test("SettingsStore: subscriber listeners receive live change notifications", () => {
  const store = new SettingsStore();
  let received = null;

  const unsub = store.subscribe((keyPath, value) => {
    received = { keyPath, value };
  });

  store.set("shortcuts.firstMenu", "Ctrl+Alt+M");
  assert.deepStrictEqual(received, { keyPath: "shortcuts.firstMenu", value: "Ctrl+Alt+M" });

  unsub();
  received = null;
  store.set("shortcuts.firstMenu", "Alt+F");
  assert.strictEqual(received, null, "Unsubscribed listener should not receive events");
});

test("settingsWindowManager: module exports expected lifecycle functions", () => {
  assert.strictEqual(typeof openSettingsWindow, "function");
  assert.strictEqual(typeof getSettingsWindow, "function");
  assert.strictEqual(typeof closeSettingsWindow, "function");
  assert.strictEqual(getSettingsWindow(), null, "Initial window should be null");
});
