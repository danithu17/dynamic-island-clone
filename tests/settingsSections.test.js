const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

test("Settings Sections: all 11 required section components exist", () => {
  const sections = [
    "GeneralSection.jsx",
    "AppearanceSection.jsx",
    "MenuBarSection.jsx",
    "IslandSection.jsx",
    "AlertsSection.jsx",
    "ShortcutsSection.jsx",
    "FeaturesSection.jsx",
    "MenuProfilesSection.jsx",
    "AccountsSection.jsx",
    "DataPrivacySection.jsx",
    "AboutSection.jsx",
  ];

  for (const file of sections) {
    const fullPath = path.join(__dirname, "../src/settings/sections", file);
    assert.ok(fs.existsSync(fullPath), `Section file ${file} should exist`);
    const content = fs.readFileSync(fullPath, "utf8");
    assert.ok(content.length > 50, `Section file ${file} should have content`);
  }
});

test("Settings App: search index and categories match specification", () => {
  const appPath = path.join(__dirname, "../src/settings/SettingsApp.jsx");
  assert.ok(fs.existsSync(appPath));
  const content = fs.readFileSync(appPath, "utf8");

  // Verify all 11 categories exist in the navigation list
  assert.ok(content.includes('id: "general"'));
  assert.ok(content.includes('id: "appearance"'));
  assert.ok(content.includes('id: "menuBar"'));
  assert.ok(content.includes('id: "island"'));
  assert.ok(content.includes('id: "alerts"'));
  assert.ok(content.includes('id: "shortcuts"'));
  assert.ok(content.includes('id: "features"'));
  assert.ok(content.includes('id: "menuProfiles"'));
  assert.ok(content.includes('id: "accounts"'));
  assert.ok(content.includes('id: "dataPrivacy"'));
  assert.ok(content.includes('id: "about"'));

  // Verify search index is defined
  assert.ok(content.includes("SEARCH_INDEX"));
  assert.ok(content.includes("handleResetSection"));
  assert.ok(content.includes("handleResetAll"));
});

test("Settings UI & Branding: no Apple trademarks or SF symbols in settings files", () => {
  const settingsDir = path.join(__dirname, "../src/settings");
  const readAll = (dir) => {
    let files = [];
    for (const item of fs.readdirSync(dir)) {
      const p = path.join(dir, item);
      if (fs.statSync(p).isDirectory()) {
        files = files.concat(readAll(p));
      } else if (p.endsWith(".jsx") || p.endsWith(".js")) {
        files.push(p);
      }
    }
    return files;
  };

  const forbidden = ["apple.com", "macOS Tahoe", "SF Pro", "SF Symbols", "macOS Sequoia", "", "⌘"];
  const allFiles = readAll(settingsDir);

  for (const f of allFiles) {
    const text = fs.readFileSync(f, "utf8");
    for (const term of forbidden) {
      assert.ok(
        !text.includes(term),
        `File ${path.basename(f)} should not contain forbidden Apple trademark: "${term}"`
      );
    }
  }
});
