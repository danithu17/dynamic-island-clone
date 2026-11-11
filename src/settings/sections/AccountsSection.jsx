import React, { useState } from "react";
import { SettingsCard, SettingsRow, SettingsButton } from "../components/SettingsUI";
import { Mail, Calendar, Github, Shield, CheckCircle2, XCircle } from "lucide-react";

export default function AccountsSection({ settings, onUpdate }) {
  const accounts = settings.accounts || {};
  const [connectingService, setConnectingService] = useState(null);

  const handleToggleConnect = (service) => {
    const isConn = Boolean(accounts[service]?.connected);
    if (isConn) {
      if (window.confirm(`Disconnect ${service} account?`)) {
        onUpdate(`accounts.${service}`, { connected: false, email: "", username: "" });
      }
    } else {
      setConnectingService(service);
      const promptVal = window.prompt(`Enter your ${service} username/email to link:`);
      if (promptVal && promptVal.trim()) {
        const val = promptVal.trim();
        if (service === "github") {
          onUpdate(`accounts.${service}`, { connected: true, username: val });
        } else {
          onUpdate(`accounts.${service}`, { connected: true, email: val });
        }
      }
      setConnectingService(null);
    }
  };

  return (
    <div>
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
          lineHeight: 1.4,
        }}
      >
        <Shield size={16} style={{ flexShrink: 0 }} />
        <span>
          Security Note: Authentication tokens and secrets are never stored in plain JSON settings; they are protected by the Windows OS Credential Store.
        </span>
      </div>

      <SettingsCard title="Connected Integrations" description="Link online services to receive real-time Dynamic Island updates">
        {/* Gmail */}
        <SettingsRow
          icon={<Mail size={16} />}
          label="Google Mail (Gmail)"
          description={
            accounts.gmail?.connected
              ? `Connected as ${accounts.gmail.email}`
              : "Receive live pill alerts for high-priority incoming emails"
          }
          control={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: accounts.gmail?.connected ? "#30d158" : "rgba(255, 255, 255, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {accounts.gmail?.connected ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {accounts.gmail?.connected ? "Active" : "Not connected"}
              </span>
              <SettingsButton
                label={accounts.gmail?.connected ? "Disconnect" : "Connect"}
                variant={accounts.gmail?.connected ? "danger" : "default"}
                onClick={() => handleToggleConnect("gmail")}
              />
            </div>
          }
        />

        {/* Google Calendar */}
        <SettingsRow
          icon={<Calendar size={16} />}
          label="Google Calendar"
          description={
            accounts.googleCalendar?.connected
              ? `Connected as ${accounts.googleCalendar.email}`
              : "Sync upcoming events and 5-minute meeting reminder alerts"
          }
          control={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: accounts.googleCalendar?.connected ? "#30d158" : "rgba(255, 255, 255, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {accounts.googleCalendar?.connected ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {accounts.googleCalendar?.connected ? "Active" : "Not connected"}
              </span>
              <SettingsButton
                label={accounts.googleCalendar?.connected ? "Disconnect" : "Connect"}
                variant={accounts.googleCalendar?.connected ? "danger" : "default"}
                onClick={() => handleToggleConnect("googleCalendar")}
              />
            </div>
          }
        />

        {/* GitHub */}
        <SettingsRow
          icon={<Github size={16} />}
          label="GitHub"
          description={
            accounts.github?.connected
              ? `Connected as @${accounts.github.username}`
              : "Review notifications, pull request mentions, and CI build status"
          }
          control={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: accounts.github?.connected ? "#30d158" : "rgba(255, 255, 255, 0.4)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {accounts.github?.connected ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {accounts.github?.connected ? "Active" : "Not connected"}
              </span>
              <SettingsButton
                label={accounts.github?.connected ? "Disconnect" : "Connect"}
                variant={accounts.github?.connected ? "danger" : "default"}
                onClick={() => handleToggleConnect("github")}
              />
            </div>
          }
        />
      </SettingsCard>
    </div>
  );
}
