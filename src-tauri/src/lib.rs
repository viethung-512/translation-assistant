mod commands;
use commands::transcript::{list_transcripts, write_transcript};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![write_transcript, list_transcripts])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
