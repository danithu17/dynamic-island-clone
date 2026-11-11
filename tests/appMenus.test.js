const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const { appMenuService, AppMenuService, GENERIC_MENUS } = require("../src/services/appMenuService");

test("AppMenuService: exports singleton, class, and generic menus", () => {
  assert.ok(appMenuService, "appMenuService should be defined");
  assert.ok(AppMenuService, "AppMenuService class should be defined");
  assert.ok(Array.isArray(GENERIC_MENUS), "GENERIC_MENUS should be an array");
  assert.ok(GENERIC_MENUS.length >= 4, "GENERIC_MENUS should have standard top-level menus");
});

test("Curated Profiles: all required app profiles exist and parse valid JSON", () => {
  const requiredApps = [
    "chrome.json",
    "vscode.json",
    "explorer.json",
    "notepad.json",
    "terminal.json",
    "spotify.json",
    "discord.json",
    "word.json",
    "excel.json",
    "powerpoint.json",
  ];

  const profilesDir = path.join(__dirname, "../src/menuProfiles");
  assert.ok(fs.existsSync(profilesDir), "menuProfiles directory should exist");

  for (const file of requiredApps) {
    const fullPath = path.join(profilesDir, file);
    assert.ok(fs.existsSync(fullPath), `Profile ${file} must exist`);

    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = JSON.parse(raw);
    assert.ok(parsed.app, `${file} must contain 'app' name`);
    assert.ok(Array.isArray(parsed.processNames), `${file} must contain 'processNames' array`);
    assert.ok(parsed.processNames.length > 0, `${file} must specify at least one process`);
    assert.ok(Array.isArray(parsed.menus), `${file} must contain 'menus' array`);
    assert.ok(parsed.menus.length > 0, `${file} must specify menus`);

    for (const menu of parsed.menus) {
      assert.ok(menu.label, `${file} menu must have a label`);
      assert.ok(Array.isArray(menu.items), `${file} menu must have items array`);
    }
  }
});

test("AppMenuService: profile matching by process name", async () => {
  const service = new AppMenuService();

  // Test Chrome
  const chromeRes = await service.getMenusForApp({ name: "Google Chrome", exePath: "C:\\Program Files\\Google\\Chrome\\chrome.exe" }, 0);
  assert.strictEqual(chromeRes.layer, "profile");
  assert.ok(chromeRes.menus.some((m) => m.label === "File"));
  assert.ok(chromeRes.menus.some((m) => m.label === "Bookmarks"));

  // Test VS Code
  const codeRes = await service.getMenusForApp({ name: "Visual Studio Code", exePath: "C:\\VSCode\\code.exe" }, 0);
  assert.strictEqual(codeRes.layer, "profile");
  assert.ok(codeRes.menus.some((m) => m.label === "Go"));

  // Test Explorer
  const expRes = await service.getMenusForApp({ name: "Explorer", exePath: "C:\\Windows\\explorer.exe" }, 0);
  assert.strictEqual(expRes.layer, "profile");

  // Test Unknown App -> Layer 3 Generic Fallback
  const unknownRes = await service.getMenusForApp({ name: "RandomTool", exePath: "C:\\Tools\\random.exe" }, 0);
  assert.strictEqual(unknownRes.layer, "generic");
  assert.ok(unknownRes.menus.some((m) => m.label === "File"));
  assert.ok(unknownRes.menus.some((m) => m.label === "Edit"));
  assert.ok(unknownRes.menus.some((m) => m.label === "Window"));
});

test("AppMenuService: parseShortcut converts keys to correct virtual key codes", () => {
  const service = new AppMenuService();

  const ctrlN = service.parseShortcut("Ctrl+N");
  assert.deepStrictEqual(ctrlN, [0x11, 78]); // 0x11 = VK_CONTROL, 78 = 'N'

  const ctrlShiftP = service.parseShortcut("Ctrl+Shift+P");
  assert.deepStrictEqual(ctrlShiftP, [0x11, 0x10, 80]); // 0x11, 0x10 = VK_SHIFT, 80 = 'P'

  const f11 = service.parseShortcut("F11");
  assert.deepStrictEqual(f11, [0x7a]); // 0x7a = VK_F11
});

test("AppMenuService: saveCustomProfile and resetProfilesToDefault", () => {
  const service = new AppMenuService();
  const initialCount = service.getAllProfiles().length;
  assert.ok(initialCount >= 8, "Initial profile count should be at least 8");

  const customProf = {
    app: "Test Custom Editor",
    processNames: ["testeditor"],
    menus: [
      {
        label: "File",
        items: [{ label: "New Project", shortcut: "Ctrl+N", action: "Ctrl+N" }],
      },
    ],
  };

  const saved = service.saveCustomProfile(customProf);
  assert.strictEqual(saved, true);
  assert.ok(service.profiles.has("testeditor"));

  // Clean up
  const customFile = path.join(__dirname, "../src/menuProfiles/testeditor.json");
  if (fs.existsSync(customFile)) {
    fs.unlinkSync(customFile);
  }
  service.resetProfilesToDefault();
  assert.strictEqual(service.profiles.has("testeditor"), false);
});
