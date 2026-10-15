# AplusCity Companion — UI Blueprint

Status: agreed product direction; implement the interface and page flow before expanding the AI engine.

## Brand system
- Product name: **AplusCity Companion**
- Tagline: **Your AI. Your Memory. Your Companion.**
- Chinese line: **记住重要的事，陪你走自己的路。**
- Visual identity: black/charcoal wordmark, red brand accent, green Companion accent, warm white surfaces.
- App icon: compact AC/AplusCity symbol; do not cram the full wordmark into a tiny icon.
- Mobile-first PWA. Preserve the current deployed app route `/app.html`, existing auth flow, chat API, Supabase project, and per-user isolation.

## Screen map

### 1. Welcome / Memory Code entry
- First screen on launch when signed out.
- AplusCity Companion logo and one-line value proposition.
- Two clear modes: **Log in** and **Create Memory Code**.
- Create flow generates a code, provides copy action, then PIN and confirmation.
- Explain that the code and PIN must be kept safe.
- Clear success/error states; no false success before Supabase confirms.
- Keep the screen calm, short, and thumb-friendly.

### 2. Main chat
- Opens directly after successful login.
- Compact brand header, connection/account control, conversation area, fixed bottom composer.
- Empty-state prompts: “Talk about today”, “Help me think something through”, “Continue where we left off”.
- Enter sends; Shift+Enter adds a line.
- Loading, retry, network error, and empty-history states.
- Chat is the primary experience; avoid dashboard clutter.

### 3. Conversation history
- Accessible from chat navigation.
- List conversations by recent activity, with preview and date.
- Open a conversation and continue it.
- Rename/delete controls only when the backend supports them; never show inert controls.

### 4. Memory Center
- Explain what the Companion has saved and why.
- Group memory items into profile, preferences, important people/events, goals and ongoing topics.
- Allow review, edit, and delete only when implemented end-to-end.
- Provide an explicit memory consent/explanation and “I control my memories” messaging.
- Strictly scope all memory reads/writes/deletes to the authenticated user.

### 5. Personal account & privacy
- Show the signed-in identity in a safe, non-sensitive way.
- Explain private data, sign-out, and recovery limitations.
- Provide sign-out and privacy information.
- Never expose internal auth email, tokens, keys, or backend identifiers.

### 6. Settings
- Language (English / 简体中文), appearance, message preferences and optional reminders.
- Only display a setting as enabled once it has real behavior and persistence.
- No notifications without explicit opt-in.

### 7. About, help & safety
- Brand statement and app version.
- Privacy policy, terms, contact/help links when available.
- Clearly say the Companion is AI, not a human or emergency service.
- Explain account recovery and safe sharing of sensitive information.

## Navigation rules
- Signed out: Welcome / Memory Code entry only.
- Signed in: Chat is the default; History, Memory Center, Settings, and About are reachable from a simple account/navigation sheet.
- Keep the bottom composer visible on mobile and respect iOS safe areas.
- Use accessible labels, keyboard focus, readable contrast, and responsive layouts.
- Do not make the app feel like a business dashboard or stock-analysis tool.

## Build order
1. Finalize logo, colors, typography, mobile spacing, and navigation shell.
2. Complete the screen UI and responsive behavior using the existing backend contracts.
3. Verify every button has a real action; mark future functions as unavailable rather than pretending they work.
4. Test login/register, chat/history, memory privacy, sign-out, and installable PWA behavior.
5. Only after the page structure is stable, focus on improving the AI engine and long-term memory quality.

## Non-negotiable engineering constraints
- Keep the existing `/api/companion-config` and `/api/companion-chat` contracts unless verified changes are needed.
- Keep secrets server-side; never place `AGNES_API_KEY` in client code.
- Keep each user's conversations and memories isolated by verified Supabase user ID and RLS.
- Do not cache private API responses in the service worker.
- Do not replace the working chat engine while the UI work is underway.
