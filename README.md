# Aura Island

**The elegant, Dynamic Island productivity hub for Windows 10 & 11**

Aura Island brings the refined Dynamic Island experience to Windows. It rests quietly at the top of your display as an unobtrusive notch or floating capsule, morphing fluidly into an expansive notification hub, media controller, file staging shelf, and widget dashboard when you need it.

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v1.0.0-green.svg)](https://github.com/nabil24024004/Quick-Pill-Dynamic-Island-for-Windows/releases)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-lightgrey.svg)](https://www.microsoft.com/windows)

https://github.com/user-attachments/assets/bd057d18-f65e-4cf4-bf66-a5d107f18658

</div>

---

## Highlights & Features

### 1. Dual Geometry & Personality
- **Seamless Bezel Notch**: Docked flush against the top display bezel with smooth concave ear fillets.
- **Floating Pill**: A detached stadium pill floating elegantly just below the top bezel.
- **Interactive Mascot Eyes**: Subtle, animated blinking eyes that keep you company in idle mode.
- **Sub-Pixel Spring Physics**: High-fidelity Framer Motion physics (`stiffness: 350, damping: 28`) tuned for zero-jitter morphing.

### 2. First-Run Setup in the Notch
- **No Popup Windows**: The entire 7-step onboarding happens directly inside the notch with smooth blur-in transitions.
- **Live Style Selection**: Preview and morph the real island in real time.
- **Drag & Drop Swallow**: Learn file drag-and-drop staging interactively.

### 3. Dedicated Settings App (macOS System Settings Style)
- **Standalone Window**: Opened via `Ctrl+Alt+,`, tray icon, or the island header; single-instance focused.
- **Windows 11 Mica & Immersive Dark Mode**: Native taskbar entry, dark title bar, and acrylic/mica backdrop.
- **15 Structured Sections**: General, Island, Appearance, Alerts, Home & Dock, Clipboard, Tray, Notes & Snippets, Accounts, Focus & Timer, Shortcuts, Privacy, Updates, Advanced, and About.
- **Global Instant Search**: Search any setting row with automatic scrolling and highlight pulse.
- **Instant Live Apply**: All preference updates apply immediately over IPC without a Save button.

### 4. Smart Alerts & Live Activities
- **Per-Event Tuning**: Configurable durations and mute options for Battery/Power, Screenshots, Browser Downloads, Timers, Gmail, AI Assistant, USB Devices, and Volume HUD.
- **Do Not Disturb**: Schedule quiet hours to silence non-critical notifications.
- **Drag-to-Shelf Swallow Mouth**: Drag any file to the top of your monitor to stage it on the Shelf, attach to Mail, or beam to Phone.

### 5. Privacy by Design
- **100% Local Processing**: No remote telemetry, no external trackers, no keystroke tracking.
- **Password Manager Guard**: Automatically ignores clips copied from 1Password, Bitwarden, and KeePass.
- **Credential Protection**: Google OAuth tokens and AI API keys are stored in the Windows Credential Store (DPAPI / safeStorage); never saved in plain JSON.
- **Atomic Persistence**: Configurations saved with atomic temporary files and `.bak` corrupt fallbacks.

---

## Installation

### Method 1: Installer (Recommended)
1. Download `AuraIsland-Setup-1.0.0.exe` from [GitHub Releases](https://github.com/nabil24024004/Quick-Pill-Dynamic-Island-for-Windows/releases).
2. Run the installer. Aura Island installs cleanly to `C:\Program Files\Aura Island` and automatically starts in first-run guided mode.

> [!NOTE]
> **Windows SmartScreen Note for Unsigned Builds:**
> If Windows SmartScreen displays *"Windows protected your PC"*, click **"More info"** and then select **"Run anyway"**. Aura Island is 100% open-source software and contains zero telemetry or trackers.

### Method 2: Portable ZIP
1. Download `AuraIsland-1.0.0-portable.zip`.
2. Extract to your preferred location and run `aura-island.exe`.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>,</kbd> | Open / Focus Aura Island Settings Window |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Space</kbd> | Wake and expand Dynamic Island dashboard |
| <kbd>Alt</kbd> + <kbd>F</kbd> | Focus active application menu dropdown |
| <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>N</kbd> | Open quick scratchpad note editor |
| <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>V</kbd> | Open clipboard history picker |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | Capture screenshot snip |

---

## Frequently Asked Questions (FAQ)

#### Q: Does Aura Island steal focus when notifications arrive?
**A:** No. Aura Island uses Win32 non-activating window flags and `showInactive()` to float on screen without stealing focus from your active apps or games.

#### Q: How do I change between the Notch and Floating style?
**A:** Open Settings (<kbd>Ctrl+Alt+,</kbd>) > **Island** > **Island Style** and select either **Notch** or **Floating**. The island morphs immediately.

#### Q: How do I completely wipe my saved data?
**A:** Open Settings > **Privacy** > click **"Delete All My Data"** and confirm in the slide-up sheet. This erases all clipboard clips, scratchpad notes, shelf files, and resets settings.

---

## Reporting Issues & Feedback

Encountered a bug or have a feature request?
1. Check the [Issue Tracker](https://github.com/nabil24024004/Quick-Pill-Dynamic-Island-for-Windows/issues) to see if it has already been reported.
2. Open a new issue with your Windows version (e.g. Windows 11 23H2), display scaling (e.g. 125%), and attach `aura-island.log` from `%APPDATA%\AuraIsland\`.

---

## Credits & Acknowledgements

- **Original Base Project**: Developed upon the foundational open-source [Quick-Pill](https://github.com/nabil24024004/Quick-Pill-Dynamic-Island-for-Windows) project by **Abrar Nabil** (`nabil24024004` / Piko Can Fly).
- **C FFI Engine**: [koffi](https://github.com/Koromix/koffi) by Damien Erambert.
- **Icons**: [Lucide React](https://lucide.dev/).
- **Animation Physics**: [Framer Motion](https://www.framer.com/motion/).

---

## License

Licensed under the [MIT License](LICENSE). Copyright © 2026 Aura Island Contributors.
