const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Step 4 Release Engineering: package metadata and release files exist", () => {
  const pkgPath = path.join(__dirname, "../package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  assert.equal(pkg.version, "1.0.0");
  assert.equal(pkg.name, "aura-island");

  const licensePath = path.join(__dirname, "../LICENSE");
  assert.ok(fs.existsSync(licensePath), "LICENSE must exist");

  const thirdPartyPath = path.join(__dirname, "../THIRD_PARTY_NOTICES.md");
  assert.ok(fs.existsSync(thirdPartyPath), "THIRD_PARTY_NOTICES.md must exist");
  const notices = fs.readFileSync(thirdPartyPath, "utf8");
  assert.ok(notices.includes("Lucide"), "Must credit Lucide");
  assert.ok(notices.includes("Koffi"), "Must credit Koffi");

  const readmePath = path.join(__dirname, "../README.md");
  assert.ok(fs.existsSync(readmePath), "README.md must exist");
  const readme = fs.readFileSync(readmePath, "utf8");
  assert.ok(readme.toLowerCase().includes("smartscreen"), "README must document SmartScreen bypass");

  const changelogPath = path.join(__dirname, "../CHANGELOG.md");
  assert.ok(fs.existsSync(changelogPath), "CHANGELOG.md must exist");

  const checklistPath = path.join(__dirname, "../RELEASE_CHECKLIST.md");
  assert.ok(fs.existsSync(checklistPath), "RELEASE_CHECKLIST.md must exist");
  const checklist = fs.readFileSync(checklistPath, "utf8");
  assert.ok(checklist.includes("DPI"), "Checklist must include DPI scaling tests");
  assert.ok(checklist.toLowerCase().includes("fullscreen"), "Checklist must include fullscreen video/game suppression");

  const workflowPath = path.join(__dirname, "../.github/workflows/release.yml");
  assert.ok(fs.existsSync(workflowPath), "GitHub Actions release workflow must exist");
  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.ok(workflow.includes("--selftest"), "Workflow must run --selftest smoke test");
  assert.ok(workflow.includes("SHA256SUMS.txt"), "Workflow must generate SHA256 checksums");
});

test("Step 5 Notch Update UX: Island and SmartAlertView handle update flow with buttons", () => {
  const islandPath = path.join(__dirname, "../src/Island.jsx");
  const islandCode = fs.readFileSync(islandPath, "utf8");

  assert.ok(islandCode.includes("onUpdateEvent"), "Island must subscribe to onUpdateEvent");
  assert.ok(islandCode.includes("Update available"), "Island must show 'Update available' alert");
  assert.ok(islandCode.includes("startUpdateDownload"), "Island must invoke startUpdateDownload");
  assert.ok(islandCode.includes("installUpdate"), "Island must invoke installUpdate");
  assert.ok(islandCode.includes("Later"), "Island must provide a 'Later' dismiss option");

  const smartAlertPath = path.join(__dirname, "../src/components/SmartAlertView.jsx");
  const alertCode = fs.readFileSync(smartAlertPath, "utf8");
  assert.ok(alertCode.includes("alert.buttons"), "SmartAlertView must support inline alert buttons");

  const mainPath = path.join(__dirname, "../src/main.js");
  const mainCode = fs.readFileSync(mainPath, "utf8");
  assert.ok(mainCode.includes("SimpleUpdater"), "main.js must contain SimpleUpdater");
  assert.ok(mainCode.includes("isFullscreen"), "main.js must check isFullscreen before alerting");
  assert.ok(mainCode.includes("skipVersion"), "main.js must respect skipVersion");
  assert.ok(mainCode.includes("24 * 60 * 60 * 1000"), "main.js must schedule 24-hour update checks");
});
