import React from "react";
import { Play, Pause, SkipBack, SkipForward, Music } from "lucide-react";
import { motion } from "framer-motion";
import designTokens from "../styles/designTokens";

export default function MediaControls({ track, onPlayPause, onNext, onPrev, textColor = "#ffffff" }) {
  const isPlaying = track?.state === "playing";
  const title = track?.title || "Nothing Playing";
  const artist = track?.artist || "Play music on Spotify or media player";
  const artwork = track?.artwork;
  const duration = track?.duration || 0;
  const position = track?.position || 0;

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        height: "100%",
        padding: "8px 14px",
        boxSizing: "border-box",
        userSelect: "none",
        color: textColor,
        fontFamily: designTokens.typography.fontFamily,
        WebkitFontSmoothing: "antialiased",
        textRendering: "optimizeLegibility",
      }}
    >
      {/* Album Artwork */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: "rgba(255, 255, 255, 0.08)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {artwork ? (
          <img
            src={artwork}
            alt="Album Art"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              imageRendering: "-webkit-optimize-contrast",
            }}
          />
        ) : (
          <Music size={20} strokeWidth={1.75} color="rgba(255, 255, 255, 0.5)" />
        )}
      </div>

      {/* Metadata & Controls */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, gap: 4 }}>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: designTokens.typography.weightBold,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: designTokens.typography.weightMedium,
              color: designTokens.colors.textSecondary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {artist}
          </span>
        </div>

        {/* Scrubber bar */}
        {duration > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: designTokens.typography.weightMedium,
                fontVariantNumeric: "tabular-nums",
                opacity: 0.65,
                width: 26,
                textAlign: "right",
              }}
            >
              {formatTime(position)}
            </span>
            <div
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: "rgba(255, 255, 255, 0.15)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "#ffffff",
                  borderRadius: 2,
                  transition: "width 0.25s linear",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: designTokens.typography.weightMedium,
                fontVariantNumeric: "tabular-nums",
                opacity: 0.65,
                width: 26,
              }}
            >
              {formatTime(duration)}
            </span>
          </div>
        )}
      </div>

      {/* Playback Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.96 }}
          onClick={(e) => {
            e.stopPropagation();
            onPrev?.();
          }}
          style={{
            background: "none",
            border: "none",
            color: textColor,
            cursor: "pointer",
            width: 32,
            height: 32,
            minWidth: 32,
            minHeight: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
          title="Previous Track"
        >
          <SkipBack size={18} strokeWidth={1.75} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={(e) => {
            e.stopPropagation();
            onPlayPause?.();
          }}
          style={{
            width: 34,
            height: 34,
            minWidth: 34,
            minHeight: 34,
            borderRadius: "50%",
            background: "#ffffff",
            border: "none",
            color: "#000000",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.25)",
            padding: 0,
          }}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={18} strokeWidth={1.75} fill="#000000" />
          ) : (
            <Play size={18} strokeWidth={1.75} fill="#000000" style={{ marginLeft: 2 }} />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.96 }}
          onClick={(e) => {
            e.stopPropagation();
            onNext?.();
          }}
          style={{
            background: "none",
            border: "none",
            color: textColor,
            cursor: "pointer",
            width: 32,
            height: 32,
            minWidth: 32,
            minHeight: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
          title="Next Track"
        >
          <SkipForward size={18} strokeWidth={1.75} />
        </motion.button>
      </div>
    </div>
  );
}
