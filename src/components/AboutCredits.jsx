import React, { useState } from "react";
import { Info, ExternalLink, ShieldCheck, Heart, Code2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

export default function AboutCredits({ textColor = "#ffffff", appVersion = "5.5.1" }) {
  const [showLicense, setShowLicense] = useState(false);

  const openUrl = (url) => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        height: "100%",
        padding: "2px 4px",
        boxSizing: "border-box",
        overflowY: "auto",
        scrollbarWidth: "none",
        color: textColor,
        fontFamily: 'OpenRunde, -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: 12,
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #0a84ff 0%, #5e5ce6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 10px rgba(10, 132, 255, 0.35)",
            }}
          >
            <Sparkles size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.2px" }}>Aura Island</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 6,
                  background: "rgba(10, 132, 255, 0.22)",
                  color: "#6ea8fe",
                  border: "1px solid rgba(10, 132, 255, 0.35)",
                }}
              >
                v{appVersion}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 11, opacity: 0.72, marginTop: 2 }}>
              An elegant, island-style notch widget for Windows
            </p>
          </div>
        </div>

        <button
          onClick={() => openUrl("https://github.com/danithu17/dynamic-island-clone")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            borderRadius: 8,
            border: "1px solid rgba(255, 255, 255, 0.16)",
            background: "rgba(255, 255, 255, 0.08)",
            color: "#ffffff",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Code2 size={12} />
          GitHub
        </button>
      </div>

      {/* Credits Card */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "#6ea8fe" }}>
          <Heart size={13} fill="#6ea8fe" />
          <span>Credits & Open Source Acknowledgement</span>
        </div>
        <p style={{ margin: 0, fontSize: 11, lineHeight: 1.45, opacity: 0.85 }}>
          <strong>Aura Island</strong> is developed and built upon the open-source{" "}
          <strong style={{ color: "#ffffff" }}>Quick-Pill</strong> project by{" "}
          <strong>Abrar Nabil</strong> (<code>nabil24024004</code> / Piko Can Fly). We extend our sincere gratitude to the original author and contributors for providing the foundational MIT-licensed codebase.
        </p>

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            onClick={() => openUrl("https://github.com/nabil24024004/Quick-Pill-Dynamic-Island-for-Windows")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 9px",
              borderRadius: 6,
              border: "1px solid rgba(255, 255, 255, 0.14)",
              background: "rgba(255, 255, 255, 0.06)",
              color: "#ffffff",
              fontSize: 10.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ExternalLink size={11} />
            Original Quick-Pill Repo
          </button>
        </div>
      </div>

      {/* MIT License Section */}
      <div
        style={{
          padding: "8px 14px",
          borderRadius: 12,
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          onClick={() => setShowLicense(!showLicense)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700 }}>
            <ShieldCheck size={14} color="#34c759" />
            <span>MIT License Notice</span>
          </div>
          {showLicense ? <ChevronUp size={14} opacity={0.7} /> : <ChevronDown size={14} opacity={0.7} />}
        </div>

        {showLicense && (
          <div
            style={{
              marginTop: 4,
              padding: "8px 10px",
              borderRadius: 8,
              background: "rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              fontSize: 9.5,
              lineHeight: 1.4,
              fontFamily: "monospace",
              opacity: 0.8,
              whiteSpace: "pre-wrap",
            }}
          >
{`MIT License

Copyright (c) 2025 Piko Can Fly
Copyright (c) 2026 Aura Island Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.`}
          </div>
        )}
      </div>
    </div>
  );
}
