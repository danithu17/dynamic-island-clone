import React, { useState, useEffect } from "react";
import {
  SettingsCard,
  SettingsRow,
  ToggleSwitch,
  SegmentedControl,
  SliderWithValue,
} from "../components/SettingsUI";
import { Sparkles, MousePointer, Gauge, Eye, EyeOff, Maximize2, Zap } from "lucide-react";
import { getTranslation } from "../../locales/translations";

export default function IslandSection({ settings = {}, onUpdate, highlightedRow }) {
  const island = settings.island || {};
  const currentLang = settings.general?.language || "en";
  const t = getTranslation(currentLang).island;

  // Live preview interactive state
  const [previewHovered, setPreviewHovered] = useState(false);
  const [blink, setBlink] = useState(false);

  // Periodic mascot eyes blink for preview
  useEffect(() => {
    if (!island.mascotEyes) return;
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3200);
    return () => clearInterval(interval);
  }, [island.mascotEyes]);

  const isFloating = island.style === "floating";
  const speedScale =
    island.animationSpeed === "gentle" ? "0.45s" : island.animationSpeed === "fast" ? "0.18s" : "0.28s";

  return (
    <div>
      {/* Live Preview Strip */}
      <SettingsCard title="Live Interactive Preview" description="Experience your island style, dimensions, and motion physics live">
        <div
          style={{
            position: "relative",
            height: 120,
            background: "linear-gradient(180deg, #121214 0%, #1e1e24 100%)",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: isFloating ? "center" : "flex-start",
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: isFloating ? 0 : 0,
            marginTop: 4,
            marginBottom: 8,
          }}
        >
          {/* Simulated display top bezel line */}
          {!isFloating && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: "rgba(255, 255, 255, 0.12)",
              }}
            />
          )}

          {/* Simulated Island Pill */}
          <div
            onMouseEnter={() => setPreviewHovered(true)}
            onMouseLeave={() => setPreviewHovered(false)}
            style={{
              width: previewHovered
                ? 320
                : island.idleSize === "hidden"
                ? 14
                : island.idleSize === "minimal"
                ? 64
                : 120,
              height: previewHovered ? 68 : 32,
              backgroundColor: "#000000",
              borderRadius: isFloating ? 18 : previewHovered ? 20 : "0 0 16px 16px",
              boxShadow: previewHovered
                ? "0 12px 30px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.2)"
                : "0 4px 14px rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 14px",
              cursor: "pointer",
              transition: island.reduceMotion ? "none" : `all ${speedScale} cubic-bezier(0.16, 1, 0.3, 1)`,
              position: "relative",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Mascot Eyes in Idle */}
            {!previewHovered && island.mascotEyes && island.idleSize !== "hidden" && (
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: blink ? 1 : 6,
                    borderRadius: 3,
                    backgroundColor: "#ffffff",
                    transition: "height 0.1s ease",
                  }}
                />
                <div
                  style={{
                    width: 5,
                    height: blink ? 1 : 6,
                    borderRadius: 3,
                    backgroundColor: "#ffffff",
                    transition: "height 0.1s ease",
                  }}
                />
              </div>
            )}

            {/* Expanded State Content Preview */}
            {previewHovered && (
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#ffffff",
                  fontSize: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #0a84ff, #bf5af2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                    }}
                  >
                    🎵
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>Aura Island</div>
                    <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.6)" }}>
                      Live Activity
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#30d158",
                    background: "rgba(48, 209, 88, 0.15)",
                    padding: "3px 8px",
                    borderRadius: 6,
                  }}
                >
                  Active
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 8,
              fontSize: 11,
              color: "rgba(255, 255, 255, 0.45)",
            }}
          >
            {previewHovered ? "Release cursor to collapse" : "Hover over the island to preview expansion"}
          </div>
        </div>
      </SettingsCard>

      {/* Geometry & Placement */}
      <SettingsCard title="Geometry & Layout" description="Choose how the island attaches to your screen">
        <SettingsRow
          id="style"
          highlight={highlightedRow === "style"}
          icon={<Sparkles size={16} />}
          label={t.style}
          description={t.styleDesc}
          control={
            <SegmentedControl
              options={[
                { label: "Notch", value: "notch" },
                { label: "Floating", value: "floating" },
              ]}
              value={island.style || "notch"}
              onChange={(val) => onUpdate("island.style", val)}
            />
          }
        />
        <SettingsRow
          id="idleSize"
          highlight={highlightedRow === "idleSize"}
          icon={<Gauge size={16} />}
          label={t.idleSize}
          description={t.idleSizeDesc}
          isLast
          control={
            <SegmentedControl
              options={[
                { label: "Compact", value: "compact" },
                { label: "Minimal", value: "minimal" },
                { label: "Hidden", value: "hidden" },
              ]}
              value={island.idleSize || "compact"}
              onChange={(val) => onUpdate("island.idleSize", val)}
            />
          }
        />
      </SettingsCard>

      {/* Hover & Timing */}
      <SettingsCard title="Hover & Collapse Timings" description="Fine-tune cursor delays to prevent unintentional activations">
        <SettingsRow
          id="hoverDelay"
          highlight={highlightedRow === "hoverDelay"}
          icon={<MousePointer size={16} />}
          label={t.hoverDelay}
          description={t.hoverDelayDesc}
          control={
            <SliderWithValue
              min={120}
              max={400}
              step={10}
              unit="ms"
              value={typeof island.hoverDelay === "number" ? island.hoverDelay : 180}
              onChange={(val) => {
                onUpdate("island.hoverDelay", val);
                onUpdate("island.hoverDelayMs", val);
              }}
            />
          }
        />
        <SettingsRow
          id="collapseDelay"
          highlight={highlightedRow === "collapseDelay"}
          icon={<MousePointer size={16} />}
          label={t.collapseDelay}
          description={t.collapseDelayDesc}
          isLast
          control={
            <SliderWithValue
              min={200}
              max={800}
              step={25}
              unit="ms"
              value={typeof island.collapseDelay === "number" ? island.collapseDelay : 350}
              onChange={(val) => onUpdate("island.collapseDelay", val)}
            />
          }
        />
      </SettingsCard>

      {/* Physics, Motion & Mascot */}
      <SettingsCard title="Motion & Personality" description="Configure transition curves, full-screen masking, and mascot animations">
        <SettingsRow
          id="animationSpeed"
          highlight={highlightedRow === "animationSpeed"}
          icon={<Zap size={16} />}
          label={t.animationSpeed}
          description={t.animationSpeedDesc}
          control={
            <SegmentedControl
              options={[
                { label: "Gentle", value: "gentle" },
                { label: "Normal", value: "normal" },
                { label: "Fast", value: "fast" },
              ]}
              value={island.animationSpeed || "normal"}
              onChange={(val) => onUpdate("island.animationSpeed", val)}
            />
          }
        />
        <SettingsRow
          id="reduceMotion"
          highlight={highlightedRow === "reduceMotion"}
          icon={<EyeOff size={16} />}
          label={t.reduceMotion}
          description={t.reduceMotionDesc}
          control={
            <ToggleSwitch
              checked={Boolean(island.reduceMotion)}
              onChange={(val) => onUpdate("island.reduceMotion", val)}
            />
          }
        />
        <SettingsRow
          id="autoHideFullscreen"
          highlight={highlightedRow === "autoHideFullscreen"}
          icon={<Maximize2 size={16} />}
          label={t.autoHideFullscreen}
          description={t.autoHideFullscreenDesc}
          control={
            <ToggleSwitch
              checked={island.autoHideFullscreen !== false}
              onChange={(val) => onUpdate("island.autoHideFullscreen", val)}
            />
          }
        />
        <SettingsRow
          id="mascotEyes"
          highlight={highlightedRow === "mascotEyes"}
          icon={<Eye size={16} />}
          label={t.mascotEyes}
          description={t.mascotEyesDesc}
          isLast
          control={
            <ToggleSwitch
              checked={island.mascotEyes !== false}
              onChange={(val) => onUpdate("island.mascotEyes", val)}
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
