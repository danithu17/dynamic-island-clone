import React, { useState, useEffect } from "react";
import { FileEdit, Copy, Trash2, Check } from "lucide-react";

export default function NotesDropdown({ onClose }) {
  const [note, setNote] = useState(() => {
    try {
      return localStorage.getItem("aura_quick_note") || "";
    } catch (_) {
      return "";
    }
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("aura_quick_note", note);
    } catch (_) {}
  }, [note]);

  const handleCopy = () => {
    if (note && window.electronAPI?.writeClipboardText) {
      window.electronAPI.writeClipboardText(note);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setNote("");
  };

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;
  const charCount = note.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 290 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FileEdit size={14} color="#ffd60a" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Quick Note</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {note.length > 0 && (
            <>
              <button
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "transparent",
                  border: "none",
                  color: copied ? "#30d158" : "rgba(255, 255, 255, 0.75)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                title="Copy note"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? "Copied" : "Copy"}
              </button>

              <button
                onClick={handleClear}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 69, 58, 0.75)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                title="Clear note"
              >
                <Trash2 size={11} /> Clear
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Textarea */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Type a quick thought, link, or scratchpad note..."
        autoFocus
        rows={6}
        style={{
          width: "100%",
          boxSizing: "border-box",
          borderRadius: 8,
          background: "rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#ffffff",
          fontSize: 12,
          lineHeight: 1.45,
          padding: "8px 10px",
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
        }}
      />

      {/* Footer stats */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 6px", fontSize: 10, opacity: 0.5 }}>
        <span>{wordCount} words</span>
        <span>{charCount} characters</span>
      </div>
    </div>
  );
}
