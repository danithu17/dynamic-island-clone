import React, { useState } from "react";
import {
  SettingsCard,
  SettingsRow,
  TextField,
  SettingsButton,
  Dropdown,
} from "../components/SettingsUI";
import { FileText, Download, Upload, FolderOpen, Code } from "lucide-react";

export default function NotesSnippetsSection({ settings = {}, onUpdate, highlightedRow }) {
  const notes = settings.notesSnippets || {};
  const [notice, setNotice] = useState("");

  const defaultFolder = "%APPDATA%\\AuraIsland\\Notes";
  const author = notes.defaultVariables?.author || settings.general?.displayName || "User";
  const dateFormat = notes.defaultVariables?.date_format || "YYYY-MM-DD";

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  };

  const handleExportMarkdown = () => {
    const md = `# Aura Island Notes\nExported on ${new Date().toLocaleDateString()}\nAuthor: ${author}\n\n- Quick scratchpad note archive.`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-export-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice("Notes exported to Markdown!");
  };

  const handleExportJSON = () => {
    const data = { notes: [], exportedAt: Date.now(), author };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice("Notes exported to JSON!");
  };

  return (
    <div>
      {notice && (
        <div
          style={{
            padding: "8px 14px",
            background: "rgba(48, 209, 88, 0.15)",
            border: "1px solid rgba(48, 209, 88, 0.4)",
            borderRadius: 8,
            color: "#30d158",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          {notice}
        </div>
      )}

      <SettingsCard title="Notes Storage & Directory" description="Location where scratchpad notes and code snippets are saved">
        <SettingsRow
          id="notesFolder"
          highlight={highlightedRow === "notesFolder"}
          icon={<FolderOpen size={16} />}
          label="Notes Storage Folder"
          description="Local directory for markdown notes and snippets"
          control={
            <div style={{ display: "flex", gap: 8 }}>
              <TextField
                value={notes.folder || defaultFolder}
                onChange={(val) => onUpdate("notesSnippets.folder", val)}
                width={200}
              />
              <SettingsButton
                label="Open"
                onClick={() => {
                  if (window.electronAPI?.openPath) {
                    window.electronAPI.openPath("");
                  }
                }}
              />
            </div>
          }
        />
        <SettingsRow
          id="exportImport"
          icon={<Download size={16} />}
          label="Export & Backup Notes"
          description="Download your notes as Markdown or structured JSON"
          isLast
          control={
            <div style={{ display: "flex", gap: 8 }}>
              <SettingsButton
                icon={<Download size={13} />}
                label="Markdown (.md)"
                onClick={handleExportMarkdown}
              />
              <SettingsButton
                icon={<Download size={13} />}
                label="JSON (.json)"
                onClick={handleExportJSON}
              />
            </div>
          }
        />
      </SettingsCard>

      <SettingsCard title="Default Snippet Variables" description="Variables automatically populated in snippet templates">
        <SettingsRow
          id="authorVar"
          highlight={highlightedRow === "authorVar"}
          icon={<Code size={16} />}
          label="Author Name ({{author}})"
          description="Inserted automatically into new snippet frontmatter"
          control={
            <TextField
              value={author}
              onChange={(val) => onUpdate("notesSnippets.defaultVariables.author", val)}
              width={160}
            />
          }
        />
        <SettingsRow
          id="dateFormatVar"
          highlight={highlightedRow === "dateFormatVar"}
          label="Date Format ({{date}})"
          description="Format applied to the {{date}} variable"
          isLast
          control={
            <Dropdown
              options={[
                { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
                { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
                { label: "DD-MM-YYYY", value: "DD-MM-YYYY" },
              ]}
              value={dateFormat}
              onChange={(val) => onUpdate("notesSnippets.defaultVariables.date_format", val)}
              width={160}
            />
          }
        />
      </SettingsCard>
    </div>
  );
}
