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
    "MenuItem.jsx",
    "DropdownPanel.jsx",
    "AuraMenuDropdown.jsx",
    "ActiveAppDropdown.jsx",
    "LauncherDropdown.jsx",
    "ShelfDropdown.jsx",
    "NotesDropdown.jsx",
    "ClipboardDropdown.jsx",
    "StatusChips.jsx",
    "WifiDropdown.jsx",
    "BluetoothDropdown.jsx",
    "VolumeDropdown.jsx",
    "ControlCenterDropdown.jsx",
    "ControlCenter.jsx",
    "ClockDropdown.jsx",
    "ClockPanel.jsx",
    "BatteryDropdown.jsx",
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

test("AppBarService: physical strip height and DIP conversions match", () => {
  const service = new AppBarService();
  service.stripHeight = 34;
  service.stripMargin = 0;

  // Mock getTargetDisplay returning scaleFactor 1.25
  service.getTargetDisplay = () => ({
    bounds: { x: 0, y: 0, width: 1536, height: 864 },
    scaleFactor: 1.25,
  });

  const physHeight = service.getPhysicalStripHeight();
  const dipHeight = service.getDIPStripHeight();

  assert.strictEqual(physHeight, Math.round(34 * 1.25)); // 43 or 42
  assert.strictEqual(dipHeight, physHeight / 1.25);
  // DIP height times scaleFactor must exactly equal physical height
  assert.strictEqual(Math.round(dipHeight * 1.25), physHeight);
});

test("AboutCredits: lists koffi and MIT license acknowledgement", () => {
  const aboutPath = path.join(__dirname, "../src/components/AboutCredits.jsx");
  const content = fs.readFileSync(aboutPath, "utf8");
  assert.match(content, /koffi/i, "AboutCredits must credit koffi");
  assert.match(content, /MIT License/i, "AboutCredits must state MIT License for koffi");
});

test("tasksStorage: manages calendar tasks and reminders", () => {
  const { TasksStorage } = require("../src/services/tasksStorage");
  const storage = new TasksStorage();
  const initialCount = storage.getTasks().length;
  assert.ok(initialCount >= 0);

  const newTask = storage.addTask({
    title: "Test Antigravity Task",
    date: "2026-11-15",
    time: "11:30 AM",
    tag: "Work",
  });
  assert.ok(newTask && newTask.id);
  assert.strictEqual(newTask.title, "Test Antigravity Task");

  // Filter by date
  const dateTasks = storage.getTasksForDate("2026-11-15");
  assert.ok(dateTasks.some((t) => t.id === newTask.id));

  // Toggle completion
  storage.toggleTask(newTask.id);
  const toggled = storage.getTasks().find((t) => t.id === newTask.id);
  assert.strictEqual(toggled.completed, true);

  // Delete
  storage.deleteTask(newTask.id);
  assert.strictEqual(storage.getTasks().some((t) => t.id === newTask.id), false);
});

test("OverflowMenu: component exists and exports default function", () => {
  const overflowPath = path.join(__dirname, "../src/components/menubar/OverflowMenu.jsx");
  assert.ok(fs.existsSync(overflowPath), "OverflowMenu.jsx must exist");
  const content = fs.readFileSync(overflowPath, "utf8");
  assert.match(content, /export default function OverflowMenu/);
});

test("AppBarService: display scope and target display selection", () => {
  const service = new AppBarService();
  assert.strictEqual(service.displayScope, "primary");

  service.setDisplayScope("all");
  assert.strictEqual(service.displayScope, "all");

  service.setTargetDisplay("2");
  assert.strictEqual(service.targetDisplayId, "2");
});

test("AppBarService: hardware keyboard control notification", () => {
  const service = new AppBarService();
  const sentMessages = [];
  service.mainWindow = {
    isDestroyed: () => false,
    webContents: {
      send: (channel, data) => sentMessages.push({ channel, data }),
    },
  };

  service.notifyKeyboardControl("volup");
  assert.ok(sentMessages.some((m) => m.channel === "menubar:volume-change" && m.data.action === "volup"));
  assert.ok(sentMessages.some((m) => m.channel === "alert:volume-change" && m.data.action === "volup"));

  service.notifyKeyboardControl("playpause");
  assert.ok(sentMessages.some((m) => m.channel === "menubar:media-change" && m.data.command === "playpause"));
});

test("AppBarService: background efficiency & active app suppression when disabled", () => {
  const service = new AppBarService();
  assert.strictEqual(service.activeAppEnabled, true);

  service.setActiveAppEnabled(false);
  assert.strictEqual(service.activeAppEnabled, false);

  // When disabled, lastForegroundHwnd resets and no polling work is conducted
  assert.strictEqual(service.lastForegroundHwnd, 0);

  service.setActiveAppEnabled(true);
  assert.strictEqual(service.activeAppEnabled, true);
});
