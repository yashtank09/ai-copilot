# Feat: Phase 2 AI Copilot Integration & Desktop UI Enhancements

## Desktop (Tauri + React)
- **Settings Panel:** Built a modular settings tab using `tauri-plugin-store` to persist display themes and API Keys locally.
- **Dynamic UI:** Implemented multi-mode action pills (General, Action Items, Summary, Code) and enhanced markdown rendering inside the chat bubble via `react-markdown` and `remark-gfm`.
- **Audio Capture Stub:** Added `cpal` to `src-tauri` and created `audio.rs` stub for system loopback capture via WASAPI.
- **Copy Actions:** Added native clipboard copy buttons for chat responses.
- **Tailwind v4 Fixes:** Re-configured `index.css` with `@custom-variant dark` to support manual toggle hooks over OS `prefers-color-scheme`.

## Backend (NestJS)
- **Secure WebSockets:** Refactored `audio.gateway.ts` to dynamically accept and pass the API Key from the client's payload.
- **Gemini SDK Upgrade:** Replaced deprecated libraries with the official `@google/genai` unified SDK inside the new `gemini.service.ts`.
- **Auto-Upgrade Interceptor:** Built dynamic backend payload interceptor to automatically convert legacy model strings (e.g. `gemini-pro`) to `gemini-2.5-flash` natively, resolving 404 SDK issues.
