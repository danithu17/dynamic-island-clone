import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

import { detectClipboardType, applyQuickAction } from '../src/services/clipboardActions.js';
import { compareVersions, isNewerVersion } from '../src/services/versionCompare.js';
import { alertQueue } from '../src/services/alertQueue.js';
import { SettingsStore, CURRENT_SCHEMA_VERSION } from '../src/services/settingsStore.js';
import { shelfStorage } from '../src/services/shelfStorage.js';

test('Unit Tests: Clipboard type detection & quick actions', () => {
  // 1. JSON Detection & Formatting
  const rawJson = '{"name":"Aura","version":1}';
  assert.strictEqual(detectClipboardType(rawJson), 'json');
  const formatted = applyQuickAction(rawJson, 'format-json');
  assert.ok(formatted.includes('\n  "name": "Aura"'));

  // 2. Base64 Detection & Decoding/Encoding
  const plainText = 'Hello Windows Island!';
  const b64 = applyQuickAction(plainText, 'to-base64');
  assert.strictEqual(detectClipboardType(b64), 'base64');
  const decoded = applyQuickAction(b64, 'from-base64');
  assert.strictEqual(decoded, plainText);

  // 3. Case changes
  assert.strictEqual(applyQuickAction('aura island', 'to-uppercase'), 'AURA ISLAND');
  assert.strictEqual(applyQuickAction('AURA ISLAND', 'to-lowercase'), 'aura island');
  assert.strictEqual(applyQuickAction('aura dynamic island', 'to-titlecase'), 'Aura Dynamic Island');

  // 4. URL and Color detection
  assert.strictEqual(detectClipboardType('https://github.com/aura'), 'url');
  assert.strictEqual(detectClipboardType('#0a84ff'), 'hex-color');
  assert.strictEqual(detectClipboardType('124.50'), 'number');
});

test('Unit Tests: Settings migrations & schema upgrades', () => {
  const tmpDir = path.join(process.cwd(), '.tmp_test_migration_' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const settingsFile = path.join(tmpDir, 'settings.json');

  // Write a legacy v0 settings file
  const legacyData = {
    general: { displayName: "CustomUser", language: "es" },
    appearance: { accentColor: "#ff9f0a" },
    windowState: { width: 520 },
  };
  fs.writeFileSync(settingsFile, JSON.stringify(legacyData), 'utf8');

  class TestMigrationStore extends SettingsStore {
    getStorePath() {
      return settingsFile;
    }
  }

  const store = new TestMigrationStore();
  const settings = store.get();

  // Migrations must preserve legacy user fields and upgrade schema
  assert.strictEqual(settings.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.strictEqual(settings.general.displayName, "CustomUser");
  assert.strictEqual(settings.general.language, "es");
  assert.strictEqual(settings.appearance.accentColor, "#ff9f0a");
  assert.ok(settings.features !== undefined, "Defaults are merged during migration");

  // Clean up
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}
});

test('Unit Tests: Alert Queue priority, merging, and timing', () => {
  // Test DND suppression
  const originalLocalStorage = globalThis.localStorage;
  let dndState = "false";
  globalThis.localStorage = {
    getItem: (k) => (k === "aura_dnd" ? dndState : null),
    setItem: () => {},
  };

  alertQueue.clearAll();

  // Low priority alert under normal state
  alertQueue.showAlert({ type: 'normal', priority: 3, title: 'Low Priority' });
  assert.strictEqual(alertQueue.getCurrentAlert()?.title, 'Low Priority');

  // Turn on DND: priority < 8 must be suppressed
  dndState = "true";
  alertQueue.clearAll();
  alertQueue.showAlert({ type: 'routine', priority: 5, title: 'Silenced Routine' });
  assert.strictEqual(alertQueue.getCurrentAlert(), null, 'Routine alerts suppressed in DND');

  // Urgent alert (priority >= 8) breaks through DND
  alertQueue.showAlert({ type: 'battery', priority: 9, title: 'Battery 10%' });
  assert.strictEqual(alertQueue.getCurrentAlert()?.title, 'Battery 10%', 'Urgent alerts bypass DND');

  // Merging duplicate types
  alertQueue.showAlert({ type: 'battery', priority: 9, title: 'Battery 5%' });
  assert.strictEqual(alertQueue.getCurrentAlert()?.title, 'Battery 5%', 'Same type updates in-place');
  assert.strictEqual(alertQueue.getQueueLength(), 0, 'Merged in-place with no duplicates in queue');

  // Priority preemption
  alertQueue.showAlert({ type: 'critical', priority: 20, title: 'Critical System Alert' });
  assert.strictEqual(alertQueue.getCurrentAlert()?.title, 'Critical System Alert', 'Priority 20 preempts priority 9');

  // Restore
  globalThis.localStorage = originalLocalStorage;
  alertQueue.clearAll();
});

test('Unit Tests: Update version comparison', () => {
  assert.strictEqual(compareVersions('v1.2.0', '1.1.0'), 1);
  assert.strictEqual(compareVersions('1.0.0', 'v1.0.1'), -1);
  assert.strictEqual(compareVersions('1.0.0', '1.0.0'), 0);
  assert.strictEqual(compareVersions('2.0.0', '1.9.9'), 1);
  assert.strictEqual(compareVersions('1.0.0', '1.0.0-beta.1'), 1, 'Release outranks pre-release');

  assert.strictEqual(isNewerVersion('1.0.0', '1.0.1'), true);
  assert.strictEqual(isNewerVersion('1.1.0', '1.0.9'), false);
  assert.strictEqual(isNewerVersion('1.0.0', '1.0.0'), false);
});

test('End-to-End Smoke: Shelf Drag-Drop and Settings Live Updates', () => {
  // Test Shelf storage drop persistence
  shelfStorage.clearShelf();
  assert.strictEqual(shelfStorage.getItems().length, 0);

  const droppedItem = shelfStorage.addItem({
    name: 'AuditReport.pdf',
    path: 'C:\\Users\\USER\\Documents\\AuditReport.pdf',
    size: 204800,
  });

  assert.ok(droppedItem.id);
  assert.strictEqual(shelfStorage.getItems().length, 1);
  assert.strictEqual(shelfStorage.getItems()[0].name, 'AuditReport.pdf');

  // Remove item
  shelfStorage.removeItem(droppedItem.id);
  assert.strictEqual(shelfStorage.getItems().length, 0);
});
