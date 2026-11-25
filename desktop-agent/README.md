# AplusCity Desktop Agent

A Windows-first local desktop assistant for operating approved desktop applications. This project is intentionally isolated from the existing Vercel website so it does not change or break the current business studio or companion web app.

## Product scope

- **WeChat Desktop**: launch the installed app, locate a contact or group, inspect the visible conversation, draft replies, and send only with the configured permission.
- **Zoom**: launch/join meetings the user is authorized to attend, operate meeting controls, and use Zoom's visible/local recording controls where the account and host permissions allow it.
- **Computer**: open approved applications and websites, capture an on-device screenshot for user-requested visual understanding, and perform approved file workflows.
- **AI brain**: send task intent and minimized context to a trusted server-side brain adapter; keep desktop execution local.
- **Audit and safety**: visible activity log, stop button, allowlisted actions, confirmation gates, and no hidden recording.

## Architecture

1. Electron desktop shell (this directory) — UI and secure IPC boundary.
2. Local Windows execution service — planned next milestone, using Windows UI Automation / accessibility APIs for native applications and Playwright for browser workflows.
3. AplusCity brain — reuse the existing trusted server-side companion brain adapter; never put Agnes/provider keys in the desktop renderer.
4. Optional cloud sync — only user-approved summaries and task outcomes; raw screen captures and meeting recordings remain local unless explicitly exported.

## Permission modes

- **Observe**: inspect only the currently visible, user-authorized app/window; no clicks, typing, sending, or recording.
- **Assist**: prepare actions and drafts; user confirms before messages are sent or meeting recording starts.
- **Auto**: execute only pre-approved, narrow workflows. Sending messages, recording meetings, deleting/overwriting files, payments, account/security changes, and external sharing always require explicit confirmation.

Recording must be visible and must respect Zoom host controls, account capabilities, participant notices/consent, and applicable law. The agent must not bypass login, MFA, app security, or recording notices.

## Development

Requirements: Windows 10/11, Node.js 20+, npm.

```powershell
cd desktop-agent
npm install
npm start
```

The current foundation is a secure shell and capability-status screen. Native desktop automation, WeChat workflows, Zoom workflows, recording, and the AI task planner are not yet enabled. They will be added behind explicit permissions and tested on the user's Windows machine.

## Roadmap

- [x] Isolated desktop-agent project and secure Electron shell
- [ ] Local pairing/authentication and Windows execution service
- [ ] Observe mode: app detection, window listing, screenshot preview
- [ ] WeChat: contact search, visible chat reading, reply drafting, confirm-to-send
- [ ] Zoom: meeting controls and consent-aware local recording workflow
- [ ] Meeting transcription/summaries and action-item extraction
- [ ] Assist / Auto policy engine, audit log, emergency stop
- [ ] Signed Windows installer and update channel
