import React from "react";
import { Timer, Music, Play, Pause } from "lucide-react";

export default function StatusChips({
  mediaTrack,
  timerRunning,
  timerSecondsLeft,
  onChipClick,
}) {
  const isPlaying = mediaTrack?.state === "playing";
  const hasTimer = timerRunning && timerSecondsLeft > 0;

  if (!isPlaying && !hasTimer) return null;

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      {/* Focus Timer Chip */}
      {hasTimer && (
        <div
          onClick={() => onChipClick?.("timer")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 7px",
            borderRadius: 12,
            background: "rgba(255, 159, 10, 0.18)",
            border: "1px solid rgba(255, 159, 10, 0.4)",
            color: "#ff9f0a",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            userSelect: "none",
            transition: "all 0.12s ease",
          }}
          title="Active Timer - Click to view"
        >
          <Timer size={11} />
          <span>{formatTimer(timerSecondsLeft)}</span>
        </div>
      )}

      {/* Now Playing Chip */}
      {isPlaying && (
        <div
          onClick={() => onChipClick?.("media")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 7px",
            borderRadius: 12,
            background: "rgba(10, 132, 255, 0.18)",
            border: "1px solid rgba(10, 132, 255, 0.35)",
            color: "#6ea8fe",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            userSelect: "none",
            maxWidth: 140,
            overflow: "hidden",
            transition: "all 0.12s ease",
          }}
          title={`${mediaTrack.title || "Playing"} - ${mediaTrack.artist || ""}`}
        >
          {/* Animated sound bars */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 10, flexShrink: 0 }}>
            <span style={{ width: 2, height: 7, background: "#6ea8fe", borderRadius: 1 }} />
            <span style={{ width: 2, height: 10, background: "#6ea8fe", borderRadius: 1 }} />
            <span style={{ width: 2, height: 5, background: "#6ea8fe", borderRadius: 1 }} />
          </div>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {mediaTrack.title || "Playing"}
          </span>
        </div>
      )}
    </div>
  );
}
