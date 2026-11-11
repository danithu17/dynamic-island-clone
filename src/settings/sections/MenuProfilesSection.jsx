import React, { useState, useEffect } from "react";
import { SettingsCard, SettingsRow, SettingsButton } from "../components/SettingsUI";
import { Code, Check, AlertCircle, RotateCcw } from "lucide-react";

export default function MenuProfilesSection() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [jsonContent, setJsonContent] = useState("");
  const [jsonError, setJsonError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    if (window.electronAPI?.getAppMenuProfiles) {
      window.electronAPI.getAppMenuProfiles().then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setProfiles(list);
          const first = list[0];
          setSelectedProfileId(first.id);
          setJsonContent(JSON.stringify(first.data, null, 2));
        }
      });
    }
  };

  const handleSelectProfile = (id) => {
    setSelectedProfileId(id);
    const found = profiles.find((p) => p.id === id);
    if (found) {
      setJsonContent(JSON.stringify(found.data, null, 2));
      setJsonError(null);
      setSaveSuccess(false);
    }
  };

  const handleJsonChange = (e) => {
    const text = e.target.value;
    setJsonContent(text);
    setSaveSuccess(false);
    try {
      JSON.parse(text);
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (window.electronAPI?.saveAppMenuProfile) {
        window.electronAPI.saveAppMenuProfile({ id: selectedProfileId, data: parsed }).then((ok) => {
          if (ok) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
            loadProfiles();
          }
        });
      }
    } catch (err) {
      setJsonError("Cannot save: " + err.message);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all custom menu profiles to built-in factory defaults?")) {
      if (window.electronAPI?.resetAppMenuProfiles) {
        window.electronAPI.resetAppMenuProfiles().then(() => {
          loadProfiles();
        });
      }
    }
  };

  return (
    <div>
      <SettingsCard
        title="Per-App Menu Profiles"
        description="Curated menus with keyboard shortcuts dispatched directly via SendInput to active applications"
      >
        <SettingsRow
          icon={<Code size={16} />}
          label="Application Profile"
          description="Choose an application profile to inspect and customize"
          control={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select
                value={selectedProfileId}
                onChange={(e) => handleSelectProfile(e.target.value)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  fontSize: 12,
                  outline: "none",
                  cursor: "pointer",
                  minWidth: 160,
                }}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} style={{ background: "#222" }}>
                    {p.data?.app || p.id}
                  </option>
                ))}
              </select>

              <SettingsButton
                label="Reset Defaults"
                icon={<RotateCcw size={12} />}
                onClick={handleResetDefaults}
              />
            </div>
          }
        />

        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, color: "rgba(255, 255, 255, 0.55)" }}>
              Format: <code>&#123; app, processNames: [...], menus: [&#123; label, items: [&#123; label, shortcut, action &#125;] &#125;] &#125;</code>
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {saveSuccess && (
                <span style={{ fontSize: 11.5, color: "#30d158", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Check size={12} /> Saved!
                </span>
              )}
              {jsonError && (
                <span style={{ fontSize: 11.5, color: "#ff453a", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <AlertCircle size={12} /> Invalid JSON
                </span>
              )}
              <SettingsButton
                label="Save Profile"
                variant="primary"
                disabled={Boolean(jsonError)}
                onClick={handleSave}
              />
            </div>
          </div>

          <textarea
            value={jsonContent}
            onChange={handleJsonChange}
            rows={15}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#101114",
              color: "#e2e8f0",
              border: jsonError ? "1px solid #ff453a" : "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 8,
              padding: 12,
              fontFamily: 'Consolas, "Fira Code", monospace',
              fontSize: 12,
              lineHeight: 1.45,
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>
      </SettingsCard>
    </div>
  );
}
