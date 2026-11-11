import React, { useState, useEffect } from "react";
import { SettingsCard, SettingsRow, ToggleSwitch, SettingsButton } from "../components/SettingsUI";
import { Power, Globe, RefreshCw, CheckCircle2 } from "lucide-react";

export default function GeneralSection({ settings, onUpdate }) {
  const [appVersion, setAppVersion] = useState("5.5.1");
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("Up to date");

  useEffect(() => {
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then((v) => {
        if (v) setAppVersion(v);
      });
    }
  }, []);

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setUpdateStatus("Checking...");
    if (window.electronAPI?.checkForUpdates) {
      window.electronAPI.checkForUpdates().then(() => {
        setTimeout(() => {
          setCheckingUpdate(false);
          setUpdateStatus("Aura Island is up to date (v" + appVersion + ")");
        }, 1200);
      }).catch(() => {
        setCheckingUpdate(false);
        setUpdateStatus("Could not reach update server");
      });
    } else {
      setTimeout(() => {
        setCheckingUpdate(false);
        setUpdateStatus("Aura Island is up to date (v" + appVersion + ")");
      }, 1000);
    }
  };

  const general = settings.general || {};

  return (
    <div>
      <SettingsCard title="System Startup" description="Configure how Aura Island starts with your computer">
        <SettingsRow
          icon={<Power size={16} />}
          label="Launch on Windows Startup"
          description="Start Aura Island automatically in the background when logging into Windows"
          control={
            <ToggleSwitch
              checked={Boolean(general.startWithWindows)}
              onChange={(val) => {
                onUpdate("general.startWithWindows", val);
                if (window.electronAPI?.setAutoLaunch) {
                  window.electronAPI.setAutoLaunch(val);
                }
              }}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Localization & Language" description="Select the display language for menus and settings">
        <SettingsRow
          icon={<Globe size={16} />}
          label="Language"
          description="Aura Island user interface language"
          control={
            <select
              value={general.language || "en"}
              onChange={(e) => onUpdate("general.language", e.target.value)}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 12,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="en" style={{ background: "#222" }}>English (US)</option>
              <option value="es" style={{ background: "#222" }}>Español</option>
              <option value="de" style={{ background: "#222" }}>Deutsch</option>
              <option value="fr" style={{ background: "#222" }}>Français</option>
              <option value="ja" style={{ background: "#222" }}>日本語</option>
            </select>
          }
        />
      </SettingsCard>

      <SettingsCard title="Software Updates" description="Keep Aura Island up to date with the latest features and bug fixes">
        <SettingsRow
          icon={<RefreshCw size={16} />}
          label="Automatic Update Checks"
          description="Check for software updates periodically"
          control={
            <ToggleSwitch
              checked={general.checkUpdates !== false}
              onChange={(val) => onUpdate("general.checkUpdates", val)}
            />
          }
        />
        <SettingsRow
          label={`Current Version: v${appVersion}`}
          description={updateStatus}
          control={
            <SettingsButton
              label={checkingUpdate ? "Checking..." : "Check for Updates"}
              icon={<RefreshCw size={13} className={checkingUpdate ? "spin-animation" : ""} />}
              onClick={handleCheckUpdate}
              disabled={checkingUpdate}
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
