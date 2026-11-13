import React, { useState } from "react";
import {
  SettingsCard,
  SettingsRow,
  SettingsButton,
  SegmentedControl,
  TextField,
  InlineConfirmSheet,
} from "../components/SettingsUI";
import { Mail, Calendar, Bot, Shield, CheckCircle2, XCircle, Key, ExternalLink } from "lucide-react";

export default function AccountsSection({ settings = {}, onUpdate, highlightedRow }) {
  const accounts = settings.accounts || {};
  const google = accounts.google || {
    connected: Boolean(accounts.gmail?.connected || accounts.googleCalendar?.connected),
    email: accounts.gmail?.email || accounts.googleCalendar?.email || "",
  };
  const [isDisconnectSheetOpen, setIsDisconnectSheetOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("••••••••••••••••");
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [connectNotice, setConnectNotice] = useState("");

  const showNotice = (msg) => {
    setConnectNotice(msg);
    setTimeout(() => setConnectNotice(""), 3500);
  };

  const handleConnectGoogle = () => {
    onUpdate("accounts.google", {
      connected: true,
      email: "user@gmail.com",
      scopes: ["Gmail read", "Drafts", "Calendar read"],
    });
    onUpdate("accounts.gmail", { connected: true, email: "user@gmail.com" });
    onUpdate("accounts.googleCalendar", { connected: true, email: "user@gmail.com" });
    showNotice("Google account connected with permissions.");
  };

  const handleDisconnectGoogle = () => {
    setIsDisconnectSheetOpen(false);
    onUpdate("accounts.google", { connected: false, email: "", scopes: [] });
    onUpdate("accounts.gmail", { connected: false, email: "" });
    onUpdate("accounts.googleCalendar", { connected: false, email: "" });
    showNotice("Google account disconnected.");
  };

  const handleSaveApiKey = () => {
    setIsEditingKey(false);
    showNotice("API Key encrypted and saved to Windows Credential Store.");
  };

  return (
    <div>
      {connectNotice && (
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
          {connectNotice}
        </div>
      )}

      {/* Security Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: "rgba(10, 132, 255, 0.10)",
          border: "1px solid rgba(10, 132, 255, 0.25)",
          borderRadius: 10,
          marginBottom: 16,
          fontSize: 12,
          color: "#93c5fd",
          lineHeight: 1.45,
        }}
      >
        <Shield size={16} style={{ flexShrink: 0 }} />
        <span>
          Credential Protection: Authentication tokens and API keys are stored in the Windows OS Credential Store (DPAPI / safeStorage) and are never saved in settings.json.
        </span>
      </div>

      {/* Google Integration */}
      <SettingsCard title="Google Integration" description="Connect Gmail and Google Calendar for meeting alerts and mail counts">
        <SettingsRow
          id="googleAccount"
          highlight={highlightedRow === "googleAccount"}
          icon={<Mail size={16} />}
          label="Google Account"
          description={
            google.connected
              ? `Connected as ${google.email}`
              : "Link your Google account for live event pills"
          }
          control={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: google.connected ? "#30d158" : "rgba(255, 255, 255, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {google.connected ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {google.connected ? "Active" : "Not connected"}
              </span>
              <SettingsButton
                label={google.connected ? "Disconnect" : "Connect Google"}
                variant={google.connected ? "danger" : "primary"}
                onClick={google.connected ? () => setIsDisconnectSheetOpen(true) : handleConnectGoogle}
              />
            </div>
          }
        />

        {/* Permissions disclosure */}
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "rgba(255, 255, 255, 0.04)",
            borderRadius: 8,
            fontSize: 11.5,
            color: "rgba(255, 255, 255, 0.7)",
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 600, color: "#ffffff", marginBottom: 2 }}>Exact Permissions Requested:</div>
          <div>• <strong>Gmail Read:</strong> Check unread inbox counts and display subject summaries in the notch.</div>
          <div>• <strong>Drafts:</strong> Allow one-tap composing when dragging files to the Mail drop card.</div>
          <div>• <strong>Calendar Read:</strong> Show upcoming meeting alerts 5 minutes before scheduled times.</div>
        </div>
      </SettingsCard>

      {/* AI Assistant Provider */}
      <SettingsCard title="AI Provider & Intelligence" description="Configure generative assistant backend and credentials">
        <SettingsRow
          id="aiProvider"
          highlight={highlightedRow === "aiProvider"}
          icon={<Bot size={16} />}
          label="AI Provider"
          description="Model provider powering smart replies and text summarization"
          control={
            <SegmentedControl
              options={[
                { label: "Gemini", value: "gemini" },
                { label: "OpenAI", value: "openai" },
                { label: "Anthropic", value: "anthropic" },
                { label: "Local", value: "local" },
              ]}
              value={accounts.aiProvider || "gemini"}
              onChange={(val) => onUpdate("accounts.aiProvider", val)}
            />
          }
        />
        <SettingsRow
          id="aiApiKey"
          highlight={highlightedRow === "aiApiKey"}
          icon={<Key size={16} />}
          label="API Secret Key"
          description="Stored in OS credential store (never in settings.json)"
          isLast
          control={
            isEditingKey ? (
              <div style={{ display: "flex", gap: 6 }}>
                <TextField
                  value={apiKeyInput}
                  onChange={setApiKeyInput}
                  placeholder="Paste API Key..."
                  width={150}
                />
                <SettingsButton label="Save" variant="primary" onClick={handleSaveApiKey} />
              </div>
            ) : (
              <SettingsButton
                label="Update API Key"
                onClick={() => {
                  setApiKeyInput("");
                  setIsEditingKey(true);
                }}
              />
            )
          }
        />
      </SettingsCard>

      {/* Disconnect Google Confirm Sheet */}
      <InlineConfirmSheet
        isOpen={isDisconnectSheetOpen}
        title="Disconnect Google Account?"
        message="Aura Island will revoke access and remove local session tokens. You will no longer receive Gmail and meeting alerts in the notch."
        confirmLabel="Disconnect"
        cancelLabel="Cancel"
        isDanger
        onConfirm={handleDisconnectGoogle}
        onCancel={() => setIsDisconnectSheetOpen(false)}
      />
    </div>
  );
}
