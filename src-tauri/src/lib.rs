mod commands;

use commands::platform::host_os_id;
use commands::transcript::{delete_transcript, list_transcripts, read_transcript, write_transcript};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            write_transcript,
            list_transcripts,
            read_transcript,
            delete_transcript,
            host_os_id,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
