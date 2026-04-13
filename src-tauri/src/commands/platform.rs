/// Build-time host OS so the UI can open the correct system privacy URLs.
#[tauri::command]
pub fn host_os_id() -> String {
    let id = if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "ios") {
        "ios"
    } else if cfg!(target_os = "android") {
        "android"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "other"
    };
    id.to_string()
}
