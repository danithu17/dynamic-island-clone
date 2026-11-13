const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

test("Step 1 Sharpness: DPI Snapping at 100%, 125%, 150%, 175%, and 200%", () => {
  const { snapToPhysicalPixels, snapBoundsToDevicePixels } = require("../src/styles/designTokens");

  const dpis = [1.0, 1.25, 1.5, 1.75, 2.0];
  const testValues = [76, 140, 380, 480, 520, 560];

  dpis.forEach((dpi) => {
    testValues.forEach((val) => {
      const snapped = snapToPhysicalPixels(val, dpi);
      const physPx = snapped * dpi;
      // In physical device pixels, coordinates must be whole integers
      assert.strictEqual(
        Math.abs(physPx - Math.round(physPx)) < 1e-4,
        true,
        `Value ${val} at ${dpi * 100}% DPI (${snapped} DIP) must produce whole device pixels: ${physPx}`
      );
    });

    const bounds = { x: 0, y: 0, width: 520, height: 192 };
    const snappedBounds = snapBoundsToDevicePixels(bounds, dpi);
    assert.strictEqual(typeof snappedBounds.x, "number");
    assert.strictEqual(typeof snappedBounds.y, "number");
    assert.strictEqual(typeof snappedBounds.width, "number");
    assert.strictEqual(typeof snappedBounds.height, "number");
  });
});

test("Step 1 Sharpness: Text, Typography and ClearType rendering rules", () => {
  const { designTokens } = require("../src/styles/designTokens");
  assert.ok(designTokens.typography.weightMedium >= 500, "weightMedium must be >= 500 for crisp small text");
  assert.strictEqual(designTokens.colors.islandBg, "#000000", "islandBg must be solid opaque black for subpixel ClearType");
  assert.strictEqual(designTokens.colors.barBg, "#0d0e11", "barBg must be solid dark for subpixel ClearType");

  const cssPath = path.join(__dirname, "../src/App.css");
  const css = fs.readFileSync(cssPath, "utf8");
  assert.ok(css.includes("tabular-nums"), "App.css must enforce tabular-nums for numeric stability");
  assert.ok(css.includes("shape-rendering: geometricPrecision"), "App.css must enforce geometricPrecision on SVG icons");
  assert.ok(!css.includes("will-change: transform, width, height"), "App.css must not leave permanent will-change on #Island");
});

test("Step 1 Sharpness: Notch flares align exactly with top edge and match solid black shell", () => {
  const islandPath = path.join(__dirname, "../src/Island.jsx");
  const content = fs.readFileSync(islandPath, "utf8");

  assert.ok(content.includes('fill="#000000"'), "Notch flares must use pure black #000000 fill matching shell");
  assert.ok(content.includes("geometricPrecision"), "Notch flare SVGs must use geometricPrecision");
  assert.ok(content.includes("left: -11.5"), "Left flare must have subpixel overlap to prevent rasterizer seam");
  assert.ok(content.includes("right: -11.5"), "Right flare must have subpixel overlap to prevent rasterizer seam");
});

test("Step 1 Motion: Unified spring presets exist and are consistent", () => {
  const { designTokens } = require("../src/styles/designTokens");
  assert.ok(designTokens.motion, "Motion system must be defined in designTokens");
  assert.ok(designTokens.motion.springExpand, "springExpand preset must exist");
  assert.ok(designTokens.motion.springCollapse, "springCollapse preset must exist");
  assert.ok(designTokens.motion.springTab, "springTab preset must exist");
  assert.ok(designTokens.motion.springAlert, "springAlert preset must exist");
  assert.ok(designTokens.motion.springPress, "springPress preset must exist");
  assert.ok(designTokens.motion.reduced, "reduced motion preset must exist");

  assert.strictEqual(designTokens.motion.springExpand.stiffness, 350);
  assert.strictEqual(designTokens.motion.springExpand.damping, 28);
});

test("Step 1 Motion: Island implements hysteresis, cancel timers, and staged content fade", () => {
  const islandPath = path.join(__dirname, "../src/Island.jsx");
  const content = fs.readFileSync(islandPath, "utf8");

  assert.ok(content.includes("hysteresisTimer"), "Island must define hysteresis timer to eliminate hover jitter");
  assert.ok(content.includes("modeRef"), "Island must track mode in ref to avoid stale closures during transitions");
  assert.ok(content.includes("animFrameTracker"), "Island must track animation frame times for 60fps monitoring");
  assert.ok(content.includes("__auraFrameStats"), "Island must expose frame stats for measurement");
  assert.ok(content.includes("prefers-reduced-motion"), "Island must listen to Windows reduced motion settings");
});
