# Aura Island Release Checklist

Before tagging and publishing any public release, verify every item below across test environments:

### 1. Operating System Compatibility
- [ ] Clean Windows 11 23H2 VM testing passed.
- [ ] Clean Windows 10 22H2 VM testing passed.
- [ ] App launches without administrative elevation prompt.

### 2. Display & DPI Scaling
- [ ] 100% DPI scaling: Notch geometry and text render crisp without blur.
- [ ] 125% DPI scaling: Pixel snapping aligns flush to top screen bezel.
- [ ] 150% DPI scaling: All SVG icons and controls render without clipping.
- [ ] 200% DPI scaling: Settings window and island controls scale properly.
- [ ] Multi-monitor test: Island displays on chosen target monitor.
- [ ] Hot-unplug secondary monitor: Island safely falls back to primary display without crashing.

### 3. Power, Sleep & Fullscreen Behavior
- [ ] System sleep & resume: Island restores socket listeners and media timers immediately upon wake.
- [ ] Fullscreen video (e.g. YouTube / VLC): Island auto-hides cleanly when configured.
- [ ] Fullscreen DirectX game: Island conceals and does not trap mouse or keyboard input.
- [ ] Offline mode: App operates with 100% functionality when disconnected from Wi-Fi / Ethernet.
- [ ] Low battery alert: Triggers warning alert at 20% and 10% battery thresholds.

### 4. Upgrade & Data Migration
- [ ] Upgrade from previous version (`5.5.1` / legacy): Notes, shelf files, and preferences persist intact.
- [ ] Atomic persistence: Killing process mid-save leaves no corrupted JSON (`.bak` fallback works).
- [ ] Factory reset: "Delete All My Data" removes clips, notes, and resets settings completely.

### 5. Installer & Cleanliness
- [ ] NSIS installer runs silently (`Setup.exe /S /D=C:\AuraTest`).
- [ ] Packaged build executes `--selftest` and exits with code 0.
- [ ] Silent uninstallation (`Uninstall.exe /S`) cleans directory and leaves no orphaned background processes.
- [ ] Windows Defender Antivirus scan: 0 threats detected.
- [ ] VirusTotal scan on `AuraIsland-Setup-1.0.0.exe`: 0 detections.
