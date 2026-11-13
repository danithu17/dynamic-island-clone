const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

test("Step 2 FirstRunSetup: component exists and defines 7 guided screens", () => {
  const setupPath = path.join(__dirname, "../src/components/FirstRunSetup.jsx");
  assert.ok(fs.existsSync(setupPath), "FirstRunSetup.jsx must exist");
  const content = fs.readFileSync(setupPath, "utf8");

  // Verify 7 screens
  assert.ok(content.includes("step === 1"), "Screen 1 must exist");
  assert.ok(content.includes("What should I call you?"), "Screen 1 greeting prompt must exist");
  assert.ok(content.includes("step === 2"), "Screen 2 must exist");
  assert.ok(content.includes("Pick your style"), "Screen 2 style selection must exist");
  assert.ok(content.includes("step === 3"), "Screen 3 must exist");
  assert.ok(content.includes("Smart Alerts"), "Screen 3 alerts must exist");
  assert.ok(content.includes("step === 4"), "Screen 4 must exist");
  assert.ok(content.includes("Your Home"), "Screen 4 home chips must exist");
  assert.ok(content.includes("step === 5"), "Screen 5 must exist");
  assert.ok(content.includes("Make it yours"), "Screen 5 personalization must exist");
  assert.ok(content.includes("step === 6"), "Screen 6 must exist");
  assert.ok(content.includes("Connect Google"), "Screen 6 google optional must exist");
  assert.ok(content.includes("step === 7"), "Screen 7 must exist");
  assert.ok(content.includes("Try it"), "Screen 7 try it must exist");

  // Navigation controls
  assert.ok(content.includes("Continue"), "Continue button must exist");
  assert.ok(content.includes("Back"), "Back button must exist");
  assert.ok(content.includes("Skip setup"), "Skip setup must exist");
  assert.ok(content.includes("More settings"), "More settings button must exist");

  // Step progress saving
  assert.ok(content.includes("firstRun.step"), "Must save progress per screen");
  assert.ok(content.includes("firstRun.completed"), "Must mark completion");
});

test("Step 2 Island: integrates FirstRunSetup with 480x252 dimensions", () => {
  const islandPath = path.join(__dirname, "../src/Island.jsx");
  const content = fs.readFileSync(islandPath, "utf8");

  assert.ok(content.includes("FirstRunSetup"), "Island must import FirstRunSetup");
  assert.ok(content.includes("isSetup"), "Island must define isSetup state");
  assert.ok(content.includes("width = 480"), "Setup notch width must be 480");
  assert.ok(content.includes("height = 252"), "Setup notch height must be 252");
  assert.ok(content.includes("onStartFirstRun"), "Must handle onStartFirstRun IPC");
});

test("Step 3 Remaining Settings Pages: components exist and export default functions", () => {
  const sections = [
    "HomeDockSection.jsx",
    "ClipboardSection.jsx",
    "TraySection.jsx",
    "NotesSnippetsSection.jsx",
    "AccountsSection.jsx",
    "FocusTimerSection.jsx",
    "ShortcutsSection.jsx",
    "UpdatesSection.jsx",
    "AdvancedSection.jsx",
  ];

  for (const file of sections) {
    const fullPath = path.join(__dirname, "../src/settings/sections", file);
    assert.ok(fs.existsSync(fullPath), `Section ${file} should exist`);
    const content = fs.readFileSync(fullPath, "utf8");
    assert.ok(content.includes("export default function"), `${file} should export default function`);
  }
});
