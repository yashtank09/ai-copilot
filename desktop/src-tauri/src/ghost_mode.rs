use tauri::{command, AppHandle, Manager};

/// Toggle "Ghost Mode" — hides the window from screen-capture software
/// and removes it from the OS taskbar / dock.
///
/// - **Windows**: Uses `SetWindowDisplayAffinity` via Win32.
///   Primary: `WDA_EXCLUDEFROMCAPTURE` (Win10 2004+).
///   Fallback: `WDA_MONITOR` (older builds — blacks out in capture).
/// - **macOS**: Sets `NSWindow.sharingType = .none` via Cocoa.
/// - Both platforms: `set_skip_taskbar(enabled)` + `set_always_on_top(enabled)`.
#[command]
pub fn toggle_ghost_mode(app: AppHandle, enabled: bool) -> Result<String, String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Could not find the main window".to_string())?;

    // ── 1. Always-on-top: keep the window visible to the LOCAL user ──
    window
        .set_always_on_top(enabled)
        .map_err(|e| format!("Failed to set always_on_top: {}", e))?;

    // ── 2. Taskbar / Dock visibility ─────────────────────────────────
    window
        .set_skip_taskbar(enabled)
        .map_err(|e| format!("Failed to set skip_taskbar: {}", e))?;

    // ── 3. Screen-capture exclusion (platform-specific) ──────────────
    set_capture_exclusion(&window, enabled)?;

    let status = if enabled { "enabled" } else { "disabled" };
    println!("[GhostMode] Ghost Mode {}", status);
    Ok(format!("Ghost Mode {}", status))
}

// ─────────────────────────────────────────────────────────────────────
// Windows: SetWindowDisplayAffinity with hardened fallback
// ─────────────────────────────────────────────────────────────────────
#[cfg(target_os = "windows")]
fn set_capture_exclusion(
    window: &tauri::WebviewWindow,
    enabled: bool,
) -> Result<(), String> {
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{
        SetWindowDisplayAffinity, WINDOW_DISPLAY_AFFINITY,
    };

    // Display affinity constants
    const WDA_NONE: u32 = 0x0000_0000;
    const WDA_MONITOR: u32 = 0x0000_0001;           // Blacks out in capture (all Win10)
    const WDA_EXCLUDEFROMCAPTURE: u32 = 0x0000_0011; // Full exclusion (Win10 2004+)

    let hwnd = window
        .hwnd()
        .map_err(|e| format!("Failed to obtain HWND: {}", e))?;

    if !enabled {
        // Disable: always reset to WDA_NONE
        unsafe {
            SetWindowDisplayAffinity(HWND(hwnd.0 as _), WINDOW_DISPLAY_AFFINITY(WDA_NONE))
                .map_err(|e| format!("SetWindowDisplayAffinity(WDA_NONE) failed: {}", e))?;
        }
        println!("[GhostMode] Display affinity reset to WDA_NONE");
        return Ok(());
    }

    // Enable: try WDA_EXCLUDEFROMCAPTURE first, fall back to WDA_MONITOR
    let result = unsafe {
        SetWindowDisplayAffinity(
            HWND(hwnd.0 as _),
            WINDOW_DISPLAY_AFFINITY(WDA_EXCLUDEFROMCAPTURE),
        )
    };

    match result {
        Ok(()) => {
            println!("[GhostMode] Applied WDA_EXCLUDEFROMCAPTURE (full exclusion)");
            Ok(())
        }
        Err(primary_err) => {
            eprintln!(
                "[GhostMode] WDA_EXCLUDEFROMCAPTURE not supported ({}), falling back to WDA_MONITOR",
                primary_err
            );
            unsafe {
                SetWindowDisplayAffinity(
                    HWND(hwnd.0 as _),
                    WINDOW_DISPLAY_AFFINITY(WDA_MONITOR),
                )
                .map_err(|e| format!("SetWindowDisplayAffinity fallback failed: {}", e))?;
            }
            println!("[GhostMode] Applied WDA_MONITOR (black-out in capture)");
            Ok(())
        }
    }
}

// ─────────────────────────────────────────────────────────────────────
// macOS: NSWindow setSharingType
// ─────────────────────────────────────────────────────────────────────
#[cfg(target_os = "macos")]
fn set_capture_exclusion(
    window: &tauri::WebviewWindow,
    enabled: bool,
) -> Result<(), String> {
    use objc2::msg_send;
    use objc2::runtime::AnyObject;

    // NSWindowSharingType: .none = 0, .readOnly = 1
    let sharing_type: u64 = if enabled { 0 } else { 1 };

    let ns_window = window
        .ns_window()
        .map_err(|e| format!("Failed to obtain NSWindow: {}", e))?;

    unsafe {
        let ns_win: *mut AnyObject = ns_window as *mut AnyObject;
        let _: () = msg_send![ns_win, setSharingType: sharing_type];
    }

    let mode = if enabled { "NSWindowSharingNone" } else { "NSWindowSharingReadOnly" };
    println!("[GhostMode] macOS sharing type set to {}", mode);
    Ok(())
}

// ─────────────────────────────────────────────────────────────────────
// Linux / other: no-op (graceful fallback)
// ─────────────────────────────────────────────────────────────────────
#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn set_capture_exclusion(
    _window: &tauri::WebviewWindow,
    _enabled: bool,
) -> Result<(), String> {
    eprintln!("[GhostMode] Screen-capture exclusion is not supported on this platform.");
    Ok(())
}
