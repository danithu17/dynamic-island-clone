# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-13

### Added
- **DPI Device Pixel Snapping**: Whole physical device pixel rendering across 100%, 125%, 150%, 175%, and 200% displays with subpixel ear flare alignment.
- **Unified Design Tokens**: Centralized type scale (11/13/15/28px), 8px grid spacing, radii, and spring physics in `designTokens.js`.
- **Interactive State Standards**: Enforced 32px minimum hit targets and `whileTap={{ scale: 0.96 }}` press feedback across all controls.
- **Clock 12/24-Hour Formats & Tabular Numbers**: Tabular font metrics and 12h/24h formatting support.
- **Clipboard History Disk Persistence**: Retains clipboard history across application restarts in `%APPDATA%\AuraIsland\clipboard_history.json`.
- **System Crash Watchdog**: Automatic renderer recovery up to 3 restarts per minute with crash loop suppression.
- **Log Rotation & Secret Redaction**: 5 MB multi-generation log rotation in `%APPDATA%\AuraIsland\logs` with token and API key redaction.
- **Explorer Crash Recovery**: Hooked Win32 `WM_TASKBARCREATED` to restore Windows AppBar strip when `explorer.exe` restarts.
- **Focus Restoration**: Bound Win32 `SetForegroundWindow` on island collapse/dismiss to return focus to previous application.
- **Power & Sleep Pausing**: Polling and intervals suspend during screen lock and system sleep.
- **Comprehensive Quality Audit**: Created `AUDIT.md` with complete DoD verification across all 15 modules.

## [1.0.0] - 2026-11-12

### Added
- **macOS System Settings Shell**: Dedicated 880x620 settings window with Mica backdrop, dark title bar, 240px sidebar, and 15 structured pages.
- **Control Kit**: Standardized UI components including 51x31 switches, segmented controls, sliders with tabular value pills, steppers, color dots, popover dropdowns, hotkey recorders with conflict detection, and slide-up confirm sheets.
- **First-Run Setup in the Notch**: Complete 7-screen guided interactive onboarding occurring directly inside the notch without popup windows.
- **Dual Island Styles**: Live morphing between top-docked Notch (with concave ear fillets) and Floating capsule.
- **Mascot Eyes**: Animated blinking eyes in the idle pill resting state.
- **Live Interactive Preview**: Interactive hover-testing strip on the Island settings card.
- **Instant Live Apply**: IPC synchronization ensuring all setting changes reflect immediately without requiring a save button.
- **Atomic Persistence & Backup**: Storage in `%APPDATA%\AuraIsland\settings.json` with temporary file atomic rename, `.bak` backup creation, and corrupt-file fallback with calm user notification.
- **Self-Test Flag**: Added `--selftest` CLI flag for headless CI/CD smoke testing.
- **GitHub Actions Release CI**: Automated build, lint, test, smoke install test, SHA256 checksums, and GitHub Release drafting.

### Changed
- Rebranded to **Aura Island** while preserving full backwards-compatibility with upstream Quick-Pill integrations.
- Clamped and guarded numeric ranges for hover delay (120–400ms), collapse delay (200–800ms), and alert durations (1–15s).

### Fixed
- Fixed click-through event forwarding during modal settings interactions.
- Addressed window boundary constraints on multi-monitor DPI transitions.
- Resolved password manager clipboard recording with automatic process filters.
