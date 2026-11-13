import React, { useState, useEffect } from "react";
import { SettingsCard, SettingsRow, SettingsButton } from "../components/SettingsUI";
import {
  Sparkles,
  ExternalLink,
  Github,
  Bug,
  Globe,
  FileText,
  Heart,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getTranslation } from "../../locales/translations";

export default function AboutSection({ settings = {}, highlightedRow }) {
  const [appVersion, setAppVersion] = useState("5.5.1");
  const [showLicenses, setShowLicenses] = useState(false);

  const currentLang = settings.general?.language || "en";
  const t = getTranslation(currentLang).about;

  useEffect(() => {
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then((v) => {
        if (v) setAppVersion(v);
      });
    }
  }, []);

  const openUrl = (url) => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, "_blank");
    }
  };

  const licensesList = [
    {
      name: "Aura Island (Core Application)",
      license: "MIT License",
      author: "Copyright (c) 2026 Aura Island Contributors, Copyright (c) 2025 Abrar Nabil (nabil24024004 / Piko Can Fly)",
      summary: "Permission is hereby granted to use, copy, modify, merge, publish, distribute, and sell copies of the software.",
    },
    {
      name: "React & React-DOM",
      license: "MIT License",
      author: "Meta Platforms, Inc. and affiliates",
      summary: "Component rendering lifecycle, virtual DOM reconciliation, and standard UI hooks.",
    },
    {
      name: "Framer Motion",
      license: "MIT License",
      author: "Framer B.V.",
      summary: "Physics-based spring animation engine, fluid morphing, and gesture detection.",
    },
    {
      name: "Lucide React",
      license: "ISC License",
      author: "Lucide Contributors",
      summary: "Comprehensive open-source vector icon set.",
    },
    {
      name: "koffi",
      license: "MIT License",
      author: "Damien Erambert",
      summary: "Ultra-fast C FFI for native Windows AppBar work area reservation and user32 API bindings.",
    },
    {
      name: "Inter Font",
      license: "SIL Open Font License 1.1",
      author: "Rasmus Andersson",
      summary: "Clean geometric sans-serif typeface designed for high-DPI computer screens.",
    },
  ];

  return (
    <div>
      {/* Product Banner */}
      <SettingsCard style={{ padding: "20px 22px", background: "linear-gradient(135deg, #1C1C1E 0%, #252528 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              background: "linear-gradient(135deg, #0a84ff 0%, #5e5ce6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(10, 132, 255, 0.4)",
              flexShrink: 0,
            }}
          >
            <Sparkles size={30} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.3px" }}>
                Aura Island
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "rgba(10, 132, 255, 0.22)",
                  color: "#64d2ff",
                  border: "1px solid rgba(10, 132, 255, 0.35)",
                }}
              >
                v{appVersion}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255, 255, 255, 0.65)", marginTop: 4 }}>
              {t.subtitle}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.4)", marginTop: 4 }}>
              {t.copyright}
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* External Links */}
      <SettingsCard title={t.links} description="Source code, issue tracking, and official community resources">
        <SettingsRow
          icon={<Globe size={16} />}
          label={t.website}
          description="Documentation, screenshots, and community guides"
          control={
            <SettingsButton
              icon={<ExternalLink size={13} />}
              label="Visit Website"
              onClick={() => openUrl("https://github.com/nabil24024004/Quick-Pill-Dynamic-Island-for-Windows")}
            />
          }
        />
        <SettingsRow
          icon={<Github size={16} />}
          label={t.github}
          description="Inspect the open-source repository and release tags"
          control={
            <SettingsButton
              icon={<ExternalLink size={13} />}
              label="GitHub"
              onClick={() => openUrl("https://github.com/nabil24024004/Quick-Pill-Dynamic-Island-for-Windows")}
            />
          }
        />
        <SettingsRow
          icon={<Bug size={16} />}
          label={t.reportProblem}
          description="Submit feedback, feature requests, or report software defects"
          isLast
          control={
            <SettingsButton
              icon={<ExternalLink size={13} />}
              label="Open Bug Tracker"
              onClick={() => openUrl("https://github.com/nabil24024004/Quick-Pill-Dynamic-Island-for-Windows/issues")}
            />
          }
        />
      </SettingsCard>

      {/* Open Source Acknowledgement */}
      <SettingsCard title="Open Source Lineage" description="Attribution to the foundational upstream project">
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "4px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "#64d2ff" }}>
            <Heart size={14} fill="#64d2ff" />
            <span>Acknowledgements</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "rgba(255, 255, 255, 0.8)" }}>
            <strong>Aura Island</strong> is developed and built upon the open-source{" "}
            <strong>Quick-Pill</strong> project authored by <strong>Abrar Nabil</strong> (<code>nabil24024004</code> / Piko Can Fly).
            We are deeply grateful for their creative foundation and commitment to open-source software under the MIT license.
          </p>
        </div>
      </SettingsCard>

      {/* Dependency Licenses View */}
      <SettingsCard title={t.licensesTitle} description={t.licensesDesc}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "4px 0" }}>
          <button
            type="button"
            onClick={() => setShowLicenses(!showLicenses)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 8,
              padding: "10px 14px",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={16} color="#30d158" />
              <span>{showLicenses ? "Hide Dependency Licenses" : "View All Dependency Licenses"}</span>
            </div>
            {showLicenses ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showLicenses && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 8,
                maxHeight: 320,
                overflowY: "auto",
                paddingRight: 6,
              }}
            >
              {licensesList.map((lic, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(0, 0, 0, 0.35)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>{lic.name}</span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: "#30d158",
                        background: "rgba(48, 209, 88, 0.12)",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {lic.license}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.55)", marginTop: 4 }}>
                    {lic.author}
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(255, 255, 255, 0.75)", marginTop: 4, lineHeight: 1.4 }}>
                    {lic.summary}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SettingsCard>
    </div>
  );
}
