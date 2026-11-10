const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const { appBarService, AppBarService } = require("../src/services/appBarService");

test("AppBarService: exports singleton and class", () => {
  assert.ok(appBarService, "appBarService singleton should be defined");
  assert.ok(AppBarService, "AppBarService class should be defined");
  assert.strictEqual(typeof appBarService.setMode, "function");
  assert.strictEqual(typeof appBarService.setStripHeight, "function");
  assert.strictEqual(typeof appBarService.setStripMargin, "function");
  assert.strictEqual(typeof appBarService.removeAppBar, "function");
  assert.strictEqual(typeof appBarService.getActiveApp, "function");
});

test("AppBarService: mode switching and strip height boundaries", () => {
  const service = new AppBarService();
  assert.strictEqual(service.mode, "reserved");

  service.setMode("overlay");
  assert.strictEqual(service.mode, "overlay");

  service.setMode("autohide");
  assert.strictEqual(service.mode, "autohide");

  service.setMode("reserved");
  assert.strictEqual(service.mode, "reserved");

  // Height clamps
  service.setStripHeight(38);
  assert.strictEqual(service.stripHeight, 38);

  service.setStripHeight(10); // below min
  assert.strictEqual(service.stripHeight, 38);

  service.setStripMargin(6);
  assert.strictEqual(service.stripMargin, 6);
  assert.strictEqual(service.getEffectiveStripHeight(), 44);
});

test("AppBarService: known application names mapping", () => {
  const service = new AppBarService();
  assert.strictEqual(service.knownAppNames["chrome"], "Google Chrome");
  assert.strictEqual(service.knownAppNames["code"], "Visual Studio Code");
  assert.strictEqual(service.knownAppNames["msedge"], "Microsoft Edge");
  assert.strictEqual(service.knownAppNames["aura-island"], "Aura Island");
});

test("MenuBar Components: exist and are free of Apple trademarks", () => {
  const menubarDir = path.join(__dirname, "../src/components/menubar");
  assert.ok(fs.existsSync(menubarDir), "menubar directory should exist");

  const requiredFiles = [
    "MenuBar.jsx",
    "AuraLogo.jsx",
    "ActiveAppName.jsx",
    "MenuBarBattery.jsx",
    "MenuBarClock.jsx",
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(menubarDir, file);
    assert.ok(fs.existsSync(fullPath), `${file} should exist`);
    const content = fs.readFileSync(fullPath, "utf8");
    assert.doesNotMatch(content, /apple logo/i, `${file} should not reference apple logo`);
    assert.doesNotMatch(content, /sf pro/i, `${file} should not reference proprietary SF Pro`);
    assert.doesNotMatch(content, /sf symbols/i, `${file} should not reference proprietary SF Symbols`);
  }
});

test("AboutCredits: lists koffi and MIT license acknowledgement", () => {
  const aboutPath = path.join(__dirname, "../src/components/AboutCredits.jsx");
  const content = fs.readFileSync(aboutPath, "utf8");
  assert.match(content, /koffi/i, "AboutCredits must credit koffi");
  assert.match(content, /MIT License/i, "AboutCredits must state MIT License for koffi");
});
