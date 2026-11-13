const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

test("Step 1 Setup Config: defines 11 scenes, sizes, and time greeting helper", () => {
  const configPath = path.join(__dirname, "../src/config/setupScenes.js");
  assert.ok(fs.existsSync(configPath), "setupScenes.js must exist");

  const { SETUP_SCENES, getSceneConfig, getTimeGreeting } = require("../src/config/setupScenes");
  assert.strictEqual(SETUP_SCENES.length, 11, "Must define 11 scenes (0 to 10)");

  // Verify Scene 0 to 3
  const scene0 = getSceneConfig(0);
  assert.strictEqual(scene0.name, "arrival");
  assert.deepStrictEqual(scene0.size, { width: 140, height: 34 });

  const scene1 = getSceneConfig(1);
  assert.strictEqual(scene1.name, "hello");
  assert.deepStrictEqual(scene1.size, { width: 360, height: 120 });

  const scene2 = getSceneConfig(2);
  assert.strictEqual(scene2.name, "name");
  assert.deepStrictEqual(scene2.size, { width: 440, height: 210 });

  const scene3 = getSceneConfig(3);
  assert.strictEqual(scene3.name, "style");
  assert.deepStrictEqual(scene3.size, { width: 480, height: 240 });

  // Time greeting helper verification
  assert.strictEqual(getTimeGreeting(new Date("2026-11-13T08:00:00")), "Good morning");
  assert.strictEqual(getTimeGreeting(new Date("2026-11-13T14:00:00")), "Good afternoon");
  assert.strictEqual(getTimeGreeting(new Date("2026-11-13T19:00:00")), "Good evening");
  assert.strictEqual(getTimeGreeting(new Date("2026-11-13T23:00:00")), "Good night");
});

test("Step 1 Setup UI & State Machine: FirstRunSetup implements progress dots, transitions, and scenes 0-3", () => {
  const setupPath = path.join(__dirname, "../src/components/FirstRunSetup.jsx");
  assert.ok(fs.existsSync(setupPath), "FirstRunSetup.jsx must exist");
  const content = fs.readFileSync(setupPath, "utf8");

  // Scene 0: Arrival
  assert.ok(content.includes("step === 0"), "Scene 0 Arrival must be implemented");
  assert.ok(content.includes("scaleY"), "Arrival must include blinking mascot eyes");

  // Scene 1: Hello
  assert.ok(content.includes("helloStrokeDone"), "Scene 1 handwriting animation must exist");
  assert.ok(content.includes("Get started"), "Scene 1 Get started button must exist");

  // Scene 2: Name
  assert.ok(content.includes("What should I call you?"), "Scene 2 Name prompt must exist");
  assert.ok(content.includes("Live Preview"), "Scene 2 live preview greeting must exist");
  assert.ok(content.includes("getTimeGreeting"), "Must use dynamic time of day greeting");

  // Scene 3: Style
  assert.ok(content.includes("Pick your style"), "Scene 3 style selection must exist");
  assert.ok(content.includes("Notch"), "Scene 3 Notch option must exist");
  assert.ok(content.includes("Floating"), "Scene 3 Floating option must exist");

  // Inline Skip confirmation (no native dialog)
  assert.ok(content.includes("skipConfirming"), "Must handle inline skip confirm state");
  assert.ok(content.includes("Skip setup?"), "Must show inline skip confirmation text");
  assert.ok(content.includes("Keep going"), "Must have Keep going option");

  // Keyboard navigation & persistence
  assert.ok(content.includes('e.key === "Escape"'), "Esc key must trigger Back/Cancel");
  assert.ok(content.includes('e.key === "Enter"'), "Enter key must trigger Continue");
  assert.ok(content.includes("onSceneChange"), "Must notify parent Island of scene dimensions");
  assert.ok(content.includes("firstRun.step"), "Must save progress per scene");
});

test("Step 1 Setup Replay: main.js and tray support setup:run-again", () => {
  const mainPath = path.join(__dirname, "../src/main.js");
  const content = fs.readFileSync(mainPath, "utf8");

  assert.ok(content.includes('ipcMain.handle("setup:run-again"'), "Must handle setup:run-again IPC");
  assert.ok(content.includes('"first-run:start"'), "Must dispatch first-run:start to renderer");
  assert.ok(content.includes("Run setup again"), "Tray menu must have Run setup again option");
});
