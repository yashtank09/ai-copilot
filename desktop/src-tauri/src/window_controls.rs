use tauri::{command, AppHandle, Manager};

/// Dynamically adjust the native window opacity.
///
/// The `opacity` value is clamped to `[0.1, 1.0]` to prevent the window
/// from becoming fully transparent (and therefore un-recoverable).
#[command]
pub fn set_window_opacity(app: AppHandle, opacity: f64) -> Result<String, String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Could not find the main window".to_string())?;

    // Clamp to safe range
    let clamped = opacity.clamp(0.1, 1.0);

    set_opacity(&window, clamped)?;

    println!("[WindowControls] Opacity set to {:.0}%", clamped * 100.0);
    Ok(format!("Opacity set to {:.0}%", clamped * 100.0))
}

#[cfg(target_os = "windows")]
fn set_opacity(window: &tauri::WebviewWindow, opacity: f64) -> Result<(), String> {
    use windows::Win32::Foundation::{HWND, COLORREF};
    use windows::Win32::UI::WindowsAndMessaging::{
        GetWindowLongPtrW, SetWindowLongPtrW, SetLayeredWindowAttributes,
        GWL_EXSTYLE, WS_EX_LAYERED, LWA_ALPHA,
    };

    let hwnd = window
        .hwnd()
        .map_err(|e| format!("Failed to obtain HWND: {}", e))?;

    let hwnd_raw = HWND(hwnd.0 as _);

    unsafe {
        let ex_style = GetWindowLongPtrW(hwnd_raw, GWL_EXSTYLE);
        
        SetWindowLongPtrW(hwnd_raw, GWL_EXSTYLE, ex_style | WS_EX_LAYERED.0 as isize);
        
        let alpha = (opacity * 255.0) as u8;
        
        SetLayeredWindowAttributes(hwnd_raw, COLORREF(0), alpha, LWA_ALPHA)
            .map_err(|e| format!("Failed to set layered window attributes: {}", e))?;
    }

    Ok(())
}

#[cfg(target_os = "macos")]
fn set_opacity(window: &tauri::WebviewWindow, opacity: f64) -> Result<(), String> {
    use objc2::msg_send;
    use objc2::runtime::AnyObject;

    let ns_window = window
        .ns_window()
        .map_err(|e| format!("Failed to obtain NSWindow: {}", e))?;

    unsafe {
        let ns_win: *mut AnyObject = ns_window as *mut AnyObject;
        let _: () = msg_send![ns_win, setAlphaValue: opacity];
    }

    Ok(())
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn set_opacity(_window: &tauri::WebviewWindow, _opacity: f64) -> Result<(), String> {
    eprintln!("[WindowControls] Dynamically setting window opacity is not supported on this platform.");
    Ok(())
}
