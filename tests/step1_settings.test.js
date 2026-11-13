const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const { settingsStore, SettingsStore, DEFAULT_SETTINGS, CURRENT_SCHEMA_VERSION } = require("../src/services/settingsStore");
const { translations, getTranslation } = require("../src/locales/translations");

test("Step 1 SettingsStore: schemaVersion and default keys exist", () => {
  assert.strictEqual(CURRENT_SCHEMA_VERSION, 1);
  assert.strictEqual(DEFAULT_SETTINGS.schemaVersion, 1);

  // General page defaults
  assert.ok(DEFAULT_SETTINGS.general);
  assert.strictEqual(DEFAULT_SETTINGS.general.displayName, "User");
  assert.strictEqual(DEFAULT_SETTINGS.general.language, "en");
  assert.strictEqual(DEFAULT_SETTINGS.general.checkHotkey, "Ctrl+Alt+,");
  assert.strictEqual(typeof DEFAULT_SETTINGS.general.startWithWindows, "boolean");

  // Island page defaults
  assert.ok(DEFAULT_SETTINGS.island);
  assert.strictEqual(DEFAULT_SETTINGS.island.style, "notch");
  assert.strictEqual(DEFAULT_SETTINGS.island.idleSize, "compact");
  assert.strictEqual(DEFAULT_SETTINGS.island.hoverDelay, 180);
  assert.strictEqual(DEFAULT_SETTINGS.island.collapseDelay, 350);
  assert.strictEqual(DEFAULT_SETTINGS.island.mascotEyes, true);
  assert.strictEqual(DEFAULT_SETTINGS.island.reduceMotion, false);

  // Alerts page defaults
  assert.ok(DEFAULT_SETTINGS.alerts);
  assert.strictEqual(DEFAULT_SETTINGS.alerts.enabled, true);
  assert.strictEqual(DEFAULT_SETTINGS.alerts.duration, 4);
  assert.ok(DEFAULT_SETTINGS.alerts.dndSchedule);
  assert.ok(DEFAULT_SETTINGS.alerts.types.charging);
  assert.ok(DEFAULT_SETTINGS.alerts.types.screenshots);
  assert.ok(DEFAULT_SETTINGS.alerts.types.downloads);
  assert.ok(DEFAULT_SETTINGS.alerts.types.timer);
  assert.ok(DEFAULT_SETTINGS.alerts.types.gmail);
  assert.ok(DEFAULT_SETTINGS.alerts.types.aiAgent);
  assert.ok(DEFAULT_SETTINGS.alerts.types.usbDevices);
  assert.ok(DEFAULT_SETTINGS.alerts.types.volumeHud);
});

test("Step 1 SettingsStore: atomic write and backup file creation", () => {
  const store = new SettingsStore();
  const testVal = "TestUser_" + Date.now();
  store.set("general.displayName", testVal);

  assert.strictEqual(store.get("general.displayName"), testVal);
  assert.ok(fs.existsSync(store.filePath), "settings.json file should exist");

  const bakPath = store.filePath + ".bak";
  assert.ok(fs.existsSync(bakPath), "settings.json.bak backup should exist");
});

test("Step 1 SettingsStore: corrupt-file fallback recovers without crashing", () => {
  const store = new SettingsStore();
  const originalPath = store.filePath;
  const tempDir = path.join(__dirname, "temp_corrupt_test_" + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  const corruptFile = path.join(tempDir, "settings.json");
  fs.writeFileSync(corruptFile, "{ INVALID JSON CORRUPT DATA ...", "utf8");

  // Override getStorePath for a test instance
  class TestCorruptStore extends SettingsStore {
    getStorePath() {
      return corruptFile;
    }
  }

  const recoveredStore = new TestCorruptStore();
  assert.ok(recoveredStore.hasRecoveredFromCorrupt, "Should detect corrupt file and recover");
  assert.strictEqual(recoveredStore.get("general.displayName"), "User");

  // Clean up test directory
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (_) {}
});

test("Step 1 Translations: contains English, Sinhala, and Tamil structures", () => {
  assert.ok(translations.en, "English translations must exist");
  assert.ok(translations.si, "Sinhala translations must exist");
  assert.ok(translations.ta, "Tamil translations must exist");

  assert.strictEqual(getTranslation("en").general.displayName, "Display Name");
  assert.ok(getTranslation("si").general.displayName, "Sinhala display name should be defined");
  assert.ok(getTranslation("ta").general.displayName, "Tamil display name should be defined");
});

test("Step 1 Control Kit: SettingsUI.jsx exports all required controls", () => {
  const uiPath = path.join(__dirname, "../src/settings/components/SettingsUI.jsx");
  assert.ok(fs.existsSync(uiPath));
  const content = fs.readFileSync(uiPath, "utf8");

  // Verify all required controls are exported
  assert.ok(content.includes("export function ToggleSwitch"));
  assert.ok(content.includes("export function SegmentedControl"));
  assert.ok(content.includes("export function SliderWithValue"));
  assert.ok(content.includes("export function Stepper"));
  assert.ok(content.includes("export function TextField"));
  assert.ok(content.includes("export function Dropdown"));
  assert.ok(content.includes("export function ColorDots"));
  assert.ok(content.includes("export function HotkeyRecorder"));
  assert.ok(content.includes("export function ListPicker"));
  assert.ok(content.includes("export function ReorderableList"));
  assert.ok(content.includes("export function SettingsButton"));
  assert.ok(content.includes("export function InlineConfirmSheet"));
  assert.ok(content.includes("export function SettingsCard"));
  assert.ok(content.includes("export function SettingsRow"));

  // Verify ToggleSwitch is exact 51x31
  assert.ok(content.includes("width: 51"));
  assert.ok(content.includes("height: 31"));
});

test("Step 1 Settings App: includes 15 pages in macOS System Settings layout", () => {
  const appPath = path.join(__dirname, "../src/settings/SettingsApp.jsx");
  const content = fs.readFileSync(appPath, "utf8");

  // Check 15 pages
  const expectedPages = [
    'id: "general"',
    'id: "island"',
    'id: "appearance"',
    'id: "alerts"',
    'id: "homeDock"',
    'id: "clipboard"',
    'id: "tray"',
    'id: "notesSnippets"',
    'id: "accounts"',
    'id: "focusTimer"',
    'id: "shortcuts"',
    'id: "dataPrivacy"',
    'id: "updates"',
    'id: "advanced"',
    'id: "about"',
  ];

  for (const page of expectedPages) {
    assert.ok(content.includes(page), `Page ${page} should be present in SECTIONS`);
  }

  // Sidebar width 240px
  assert.ok(content.includes("width: 240") || content.includes("240px"));
  // Page title 28
  assert.ok(content.includes("fontSize: 28"));
  // Inline confirm sheet integration
  assert.ok(content.includes("InlineConfirmSheet"));
});
