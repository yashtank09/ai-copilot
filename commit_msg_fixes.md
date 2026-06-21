# Fix: Tauri Audio Compilation & Native UI Artifacts

## Desktop App (Tauri v2 + React)
- **Rust Audio Fix:** Upgraded `windows-core` dependencies to `v0.62.2` via `cargo update` to resolve `cpal` interface trait mismatch (`E0277`). Swapped `&config.into()` to `config.config()` to resolve `E0308` type inference failure during input stream building.
- **Custom Native Titlebar:** Disabled default OS window decorations in `tauri.conf.json` and implemented a custom frameless React titlebar featuring `data-tauri-drag-region` for smooth OS dragging.
- **Titlebar Capabilities:** Injected `allow-close`, `allow-minimize`, and `allow-toggle-maximize` permissions into `capabilities/default.json` to securely whitelist the custom window controls against Tauri's IPC sandbox.
- **Flicker & Render Fixes:** Disabled `transparent: true` in `tauri.conf.json` and stripped the global CSS `transition-colors` root tag in `App.tsx` to stop hardware-accelerated DWM rendering artifacts when hovering or moving the cursor across the WebView bounding box.
- **Scroll Isolation:** Applied strict `overflow-hidden` to `html`/`body` root tags in `index.css` to prevent full application-level page scrolling, ensuring scrolling is accurately bounded exclusively to inner Chat and Insights views.
