import React, { useState, useEffect } from "react";
import { Clipboard, Copy, Trash2, Check } from "lucide-react";

export default function ClipboardDropdown({ onClose }) {
  const [history, setHistory] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (window.electronAPI?.getClipboardHistory) {
      window.electronAPI.getClipboardHistory().then((items) => {
        if (Array.isArray(items)) setHistory(items);
      });
    }
  }, []);

  const handleCopySnippet = (item) => {
    if (window.electronAPI?.writeClipboardText) {
      window.electronAPI.writeClipboardText(item.text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const handleClearHistory = () => {
    if (window.electronAPI?.clearClipboardHistory) {
      window.electronAPI.clearClipboardHistory();
      setHistory([]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 310 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clipboard size={14} color="#0a84ff" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Clipboard History</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              background: "rgba(10, 132, 255, 0.2)",
              color: "#6ea8fe",
              padding: "1px 5px",
              borderRadius: 6,
            }}
          >
            {history.length}
          </span>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
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
            title="Clear clipboard history"
          >
            <Trash2 size={11} /> Clear
          </button>
        )}
      </div>

      <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "0 2px" }} />

      {/* Snippet list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 260, overflowY: "auto", scrollbarWidth: "none" }}>
        {history.map((item, idx) => {
          const isJustCopied = copiedId === item.id;
          return (
            <div
              key={item.id || idx}
              onClick={() => handleCopySnippet(item)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 8px",
                borderRadius: 7,
                background: isJustCopied ? "rgba(48, 209, 88, 0.18)" : "transparent",
                cursor: "pointer",
                transition: "background 0.12s ease",
              }}
              onMouseEnter={(e) => {
                if (!isJustCopied) e.currentTarget.style.background = "#0070f3";
              }}
              onMouseLeave={(e) => {
                if (!isJustCopied) e.currentTarget.style.background = "transparent";
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1, paddingRight: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={item.text}
                >
                  {item.text}
                </span>
                <span style={{ fontSize: 9.5, opacity: 0.5 }}>
                  {item.text.length} chars
                </span>
              </div>

              <div style={{ flexShrink: 0, opacity: isJustCopied ? 1 : 0.6 }}>
                {isJustCopied ? <Check size={12} color="#30d158" /> : <Copy size={12} />}
              </div>
            </div>
          );
        })}

        {history.length === 0 && (
          <div style={{ padding: "16px 8px", textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11.5, opacity: 0.7 }}>No clipboard clips yet</span>
            <span style={{ fontSize: 10, opacity: 0.4 }}>Copied text will appear here automatically</span>
          </div>
        )}
      </div>
    </div>
  );
}
