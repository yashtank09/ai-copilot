mod audio;
mod ghost_mode;
mod window_controls;

use std::sync::Mutex;
use audio::{start_audio_loopback, stop_audio_loopback, AudioState};
use ghost_mode::toggle_ghost_mode;
use window_controls::set_window_opacity;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AudioState(Mutex::new(None)))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            start_audio_loopback,
            stop_audio_loopback,
            toggle_ghost_mode,
            set_window_opacity
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
