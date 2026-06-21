use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::Stream;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

pub struct AudioState(pub Mutex<Option<Stream>>);

#[tauri::command]
pub fn start_audio_loopback(app: AppHandle, state: tauri::State<'_, AudioState>) -> Result<(), String> {
    let host = cpal::default_host();
    
    // For WASAPI loopback, we bind an input stream to the default output device
    let device = host
        .default_output_device()
        .ok_or("No default output device available")?;
        
    let config = device
        .default_output_config()
        .map_err(|e| format!("Failed to get default output config: {}", e))?;
        
    let err_fn = |err| eprintln!("An error occurred on the audio stream: {}", err);
    
    let stream = match config.sample_format() {
        cpal::SampleFormat::F32 => device.build_input_stream(
            config.config(),
            move |data: &[f32], _: &_| {
                // Forward the raw f32 frames to the React frontend.
                // Note: In production, downsample or chunk this to avoid IPC bottlenecks.
                if let Err(e) = app.emit("audio-loopback-chunk", data.to_vec()) {
                    eprintln!("Failed to emit audio chunk to frontend: {}", e);
                }
            },
            err_fn,
            None,
        ),
        // Additional formats like I16, U16 would be handled here
        _ => return Err("Only F32 sample format is supported in this stub".into()),
    }.map_err(|e| format!("Failed to build input stream: {}", e))?;
    
    stream.play().map_err(|e| format!("Failed to play stream: {}", e))?;
    
    // Persist the stream internally so it isn't immediately dropped
    *state.0.lock().unwrap() = Some(stream);
    
    println!("System audio loopback capture started!");
    Ok(())
}

#[tauri::command]
pub fn stop_audio_loopback(state: tauri::State<'_, AudioState>) -> Result<(), String> {
    let mut stream_guard = state.0.lock().unwrap();
    if let Some(stream) = stream_guard.take() {
        let _ = stream.pause();
        println!("System audio loopback capture stopped.");
    }
    Ok(())
}
