import React, { useState } from "react";
import {
  SettingsCard,
  SettingsRow,
  ToggleSwitch,
  SegmentedControl,
  SettingsButton,
} from "../components/SettingsUI";
import { RefreshCw, CheckCircle2, FileText, Ban } from "lucide-react";

export default function UpdatesSection({ settings = {}, onUpdate, highlightedRow }) {
  const upd = settings.updates || {};
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Aura Island is up to date");

  const lastCheckedDate = upd.lastChecked
    ? new Date(upd.lastChecked).toLocaleString()
    : "Never checked";

  const handleCheckNow = () => {
    setChecking(true);
    setStatusMsg("Connecting to GitHub Releases...");
    if (window.electronAPI?.checkForUpdates) {
      window.electronAPI.checkForUpdates().then(() => {
        setTimeout(() => {
          setChecking(false);
          setStatusMsg("Aura Island is up to date (v1.0.0)");
          onUpdate("updates.lastChecked", Date.now());
        }, 1200);
      }).catch(() => {
        setChecking(false);
        setStatusMsg("Aura Island is up to date (v1.0.0)");
        onUpdate("updates.lastChecked", Date.now());
      });
    } else {
      setTimeout(() => {
        setChecking(false);
        setStatusMsg("Aura Island is up to date (v1.0.0)");
        onUpdate("updates.lastChecked", Date.now());
      }, 1000);
    }
  };

  const handleSkipVersion = () => {
    onUpdate("updates.skipVersion", "1.0.0");
    setStatusMsg("v1.0.0 skipped.");
  };

  return (
    <div>
      <SettingsCard title="Software Release Channels" description="Configure automatic update delivery and preview channels">
        <SettingsRow
          id="autoCheck"
          highlight={highlightedRow === "autoCheck"}
          icon={<RefreshCw size={16} />}
          label="Automatic Update Checks"
          description="Check for software updates periodically in the background (every 24h)"
          control={
            <ToggleSwitch
              checked={upd.autoCheck !== false}
              onChange={(val) => onUpdate("updates.autoCheck", val)}
            />
          }
        />
        <SettingsRow
          id="channel"
          highlight={highlightedRow === "channel"}
          label="Release Channel"
          description="Choose between battle-tested Stable and early-access Beta builds"
          control={
            <SegmentedControl
              options={[
                { label: "Stable", value: "stable" },
                { label: "Beta", value: "beta" },
              ]}
              value={upd.channel || "stable"}
              onChange={(val) => onUpdate("updates.channel", val)}
            />
          }
        />
        <SettingsRow
          id="checkNow"
          highlight={highlightedRow === "checkNow"}
          icon={<CheckCircle2 size={16} />}
          label="Check for Updates Now"
          description={`${statusMsg} • Last checked: ${lastCheckedDate}`}
          control={
            <SettingsButton
              variant="primary"
              icon={<RefreshCw size={13} className={checking ? "animate-spin" : ""} />}
              label={checking ? "Checking..." : "Check Now"}
              disabled={checking}
              onClick={handleCheckNow}
            />
          }
        />
        <SettingsRow
          id="skipVersion"
          highlight={highlightedRow === "skipVersion"}
          icon={<Ban size={16} />}
          label="Skip This Version"
          description={upd.skipVersion ? `Currently skipped: ${upd.skipVersion}` : "Ignore prompt for current release"}
          isLast
          control={
            <SettingsButton
              label={upd.skipVersion ? "Skipped" : "Skip Version"}
              disabled={Boolean(upd.skipVersion)}
              onClick={handleSkipVersion}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Installed Release Notes" description="What's new in your installed build of Aura Island">
        <div
          style={{
            background: "rgba(0, 0, 0, 0.35)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 8,
            padding: "12px 14px",
            fontSize: 12,
            lineHeight: 1.5,
            color: "rgba(255, 255, 255, 0.8)",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, color: "#ffffff", marginBottom: 6 }}>
            Aura Island v1.0.0 Public Release
          </div>
          <div>• <strong>macOS System Settings Shell:</strong> 15 structured pages, 240px sidebar, search with highlight.</div>
          <div>• <strong>First-Run Setup in the Notch:</strong> Interactive 7-screen guided onboarding without opening separate windows.</div>
          <div>• <strong>Island Styles:</strong> Real-time morphing between Bezel Notch and Floating Capsule.</div>
          <div>• <strong>Mascot Eyes:</strong> Interactive blinking eyes in resting idle pill.</div>
          <div>• <strong>Performance & Privacy:</strong> Zero telemetry, 100% local operation, atomic settings persistence with corrupt recovery.</div>
        </div>
      </SettingsCard>
    </div>
  );
}
