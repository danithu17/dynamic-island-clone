const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

test("Setup Complete: 11 scenes configuration and data-driven state machine schema", () => {
  const configPath = path.join(__dirname, "../src/config/setupScenes.js");
  assert.ok(fs.existsSync(configPath), "setupScenes.js must exist");

  const { SETUP_SCENES, getSceneConfig, getTimeGreeting } = require("../src/config/setupScenes");
  assert.strictEqual(SETUP_SCENES.length, 11, "Must define 11 scenes (0 to 10)");

  // Scene 0: arrival (size 140x34)
  const scene0 = getSceneConfig(0);
  assert.strictEqual(scene0.name, "arrival");
  assert.deepStrictEqual(scene0.size, { width: 140, height: 34 });

  // Scene 1: hello (size 360x120)
  const scene1 = getSceneConfig(1);
  assert.strictEqual(scene1.name, "hello");
  assert.deepStrictEqual(scene1.size, { width: 360, height: 120 });

  // Scene 2: name (size 440x210)
  const scene2 = getSceneConfig(2);
  assert.strictEqual(scene2.name, "name");
  assert.deepStrictEqual(scene2.size, { width: 440, height: 210 });

  // Scene 3: style (size 480x240)
  const scene3 = getSceneConfig(3);
  assert.strictEqual(scene3.name, "style");
  assert.deepStrictEqual(scene3.size, { width: 480, height: 240 });

  // Scene 4: alerts (size 480x252)
  const scene4 = getSceneConfig(4);
  assert.strictEqual(scene4.name, "alerts");
  assert.strictEqual(scene4.saveKey, "alerts.types");

  // Scene 5: home (size 480x252)
  const scene5 = getSceneConfig(5);
  assert.strictEqual(scene5.name, "home");
  assert.strictEqual(scene5.saveKey, "homeDock.homeChips");

  // Scene 6: clipboard (size 480x252)
  const scene6 = getSceneConfig(6);
  assert.strictEqual(scene6.name, "clipboard");
  assert.strictEqual(scene6.saveKey, "clipboard.enabled");

  // Scene 7: dragDrop (size 480x252)
  const scene7 = getSceneConfig(7);
  assert.strictEqual(scene7.name, "dragDrop");

  // Scene 8: shortcutsStartup (size 480x252)
  const scene8 = getSceneConfig(8);
  assert.strictEqual(scene8.name, "shortcutsStartup");
  assert.strictEqual(scene8.saveKey, "general.startWithWindows");

  // Scene 9: google (size 480x252)
  const scene9 = getSceneConfig(9);
  assert.strictEqual(scene9.name, "google");
  assert.strictEqual(scene9.saveKey, "accounts.google");

  // Scene 10: finish (size 480x252)
  const scene10 = getSceneConfig(10);
  assert.strictEqual(scene10.name, "finish");
  assert.strictEqual(scene10.saveKey, "firstRun.completed");

  // Time of day greeting verification
  assert.strictEqual(getTimeGreeting(new Date("2026-11-13T07:30:00")), "Good morning");
  assert.strictEqual(getTimeGreeting(new Date("2026-11-13T13:30:00")), "Good afternoon");
  assert.strictEqual(getTimeGreeting(new Date("2026-11-13T18:30:00")), "Good evening");
  assert.strictEqual(getTimeGreeting(new Date("2026-11-13T23:30:00")), "Good night");
});

test("Setup Complete: FirstRunSetup component satisfies all 11 scene features and interactions", () => {
  const setupPath = path.join(__dirname, "../src/components/FirstRunSetup.jsx");
  assert.ok(fs.existsSync(setupPath), "FirstRunSetup.jsx must exist");
  const content = fs.readFileSync(setupPath, "utf8");

  // Scene 0: Arrival
  assert.ok(content.includes("step === 0"), "Scene 0 Arrival condition exists");
  assert.ok(content.includes("scaleY"), "Arrival animated mascot eyes exist");

  // Scene 1: Hello
  assert.ok(content.includes("step === 1"), "Scene 1 Hello condition exists");
  assert.ok(content.includes("helloStrokeDone"), "Scene 1 SVG stroke path drawing exists");
  assert.ok(content.includes("Get started"), "Scene 1 Get started button exists");

  // Scene 2: Name
  assert.ok(content.includes("What should I call you?"), "Scene 2 Name prompt exists");
  assert.ok(content.includes("Live Preview"), "Scene 2 live preview greeting line exists");
  assert.ok(content.includes("getTimeGreeting"), "Dynamic time greeting used");

  // Scene 3: Style
  assert.ok(content.includes("Pick your style"), "Scene 3 style selection prompt exists");
  assert.ok(content.includes("Notch"), "Scene 3 Notch card exists");
  assert.ok(content.includes("Floating"), "Scene 3 Floating card exists");

  // Scene 4: Alerts Demo
  assert.ok(content.includes("SAMPLE_ALERTS"), "Scene 4 sample alerts array exists");
  assert.ok(content.includes("Charging Connected"), "Sample alert 1: charging exists");
  assert.ok(content.includes("Screenshot Captured"), "Sample alert 2: screenshot exists");
  assert.ok(content.includes("Download Complete"), "Sample alert 3: download exists");
  assert.ok(content.includes("Timer Done"), "Sample alert 4: timer exists");
  assert.ok(content.includes("New Email"), "Sample alert 5: email exists");
  assert.ok(content.includes("Agent Permission"), "Sample alert 6: ai agent exists");
  assert.ok(content.includes("USB Connected"), "Sample alert 7: usb exists");
  assert.ok(content.includes("Volume HUD"), "Sample alert 8: volume hud exists");
  assert.ok(content.includes("Keep"), "Keep button exists");
  assert.ok(content.includes("Not for me"), "Not for me button exists");
  assert.ok(content.includes("Keep all"), "Keep all shortcut exists");

  // Scene 5: Home chips
  assert.ok(content.includes("HOME_CHIP_OPTIONS"), "Scene 5 home chips options exist");
  assert.ok(content.includes("homeChips.length >= 4"), "Limits home chips to max 4");
  assert.ok(content.includes("Dock Preview"), "Live dock preview row exists");

  // Scene 6: Clipboard
  assert.ok(content.includes("Clipboard History"), "Scene 6 Clipboard history exists");
  assert.ok(content.includes("Copy any text to try it"), "Copy prompt exists");
  assert.ok(content.includes("Sample Copy"), "Sample copy button exists");

  // Scene 7: Drag & Drop
  assert.ok(content.includes("Drag & Drop"), "Scene 7 Drag & Drop exists");
  assert.ok(content.includes("Show me"), "Show me demo button exists");
  assert.ok(content.includes("onDragOver"), "Native drag over handler exists");
  assert.ok(content.includes("onDrop"), "Native drop handler exists");

  // Scene 8: Shortcuts & Startup
  assert.ok(content.includes("Shortcuts and startup"), "Scene 8 Shortcuts and startup exists");
  assert.ok(content.includes("hotkeyInputRef"), "Hotkey input ref exists");
  assert.ok(content.includes("Start with Windows"), "Start with Windows toggle exists");
  assert.ok(content.includes("setAutoLaunch"), "Calls setAutoLaunch IPC");

  // Scene 9: Google
  assert.ok(content.includes("Connect Google"), "Scene 9 Connect Google exists");
  assert.ok(content.includes("OAuth loopback with PKCE"), "Explains OAuth loopback with PKCE");

  // Scene 10: Finish
  assert.ok(content.includes("All set!"), "Scene 10 Finish title exists");
  assert.ok(content.includes("Alerts active"), "Summary checklist alerts item exists");
  assert.ok(content.includes("Home chips"), "Summary checklist home chips item exists");
  assert.ok(content.includes("AudioContext"), "Web Audio chime synthesis exists");
  assert.ok(content.includes("More settings"), "More settings button exists");
  assert.ok(content.includes("Done"), "Done finish button exists");

  // Navigation & Transitions
  assert.ok(content.includes("Progress Dots"), "Progress dots exist");
  assert.ok(content.includes("skipConfirming"), "Inline skip confirmation state exists");
  assert.ok(content.includes("Skip setup?"), "Inline skip title exists");
  assert.ok(content.includes("Keep going"), "Inline skip cancel button exists");
  assert.ok(content.includes('e.key === "Escape"'), "Esc key navigates back / cancels skip");
  assert.ok(content.includes('e.key === "Enter"'), "Enter key advances / finishes");
});

test("Setup Complete: Island integration pins setup open and renders wake hint", () => {
  const islandPath = path.join(__dirname, "../src/Island.jsx");
  const content = fs.readFileSync(islandPath, "utf8");

  assert.ok(content.includes("FirstRunSetup"), "Island imports FirstRunSetup");
  assert.ok(content.includes("isSetup"), "Island defines isSetup");
  assert.ok(content.includes("wakeHint"), "Island defines wakeHint state");
  assert.ok(content.includes("Move your mouse here anytime."), "Wake hint prompt exists on setup completion");
  assert.ok(content.includes("setupDimensions"), "Island dynamically respects setupDimensions");
});
