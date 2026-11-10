import React from "react";

export default function AuraLogo({ size = 16, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 10,
        height: size + 10,
        borderRadius: 6,
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
      title="Aura Island"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="auraGlow" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0a84ff" />
            <stop offset="1" stopColor="#bf5af2" />
          </linearGradient>
        </defs>
        {/* Outer glowing orbital ring */}
        <circle cx="12" cy="12" r="9.5" stroke="url(#auraGlow)" strokeWidth="2.2" opacity="0.9" />
        {/* Inner island notch dot/core */}
        <ellipse cx="12" cy="12" rx="4.5" ry="3" fill="#ffffff" />
      </svg>
    </div>
  );
}
