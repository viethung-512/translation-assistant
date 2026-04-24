use std::fs;
use std::time::UNIX_EPOCH;

use serde::Serialize;
use tauri::Manager;

#[derive(Serialize)]
pub struct TranscriptMeta {
    pub name: String,
    pub path: String,
    pub created_at: String,
}

fn transcript_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let docs = app.path().document_dir().map_err(|e| e.to_string())?;
    Ok(docs.join("HeyGracie"))
}

/// Write transcript content atomically to the documents dir.
#[tauri::command]
pub async fn write_transcript(
    app: tauri::AppHandle,
    filename: String,
    content: String,
) -> Result<(), String> {
    let dir = transcript_dir(&app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let path = dir.join(&filename);
    let tmp = dir.join(format!(".{filename}.tmp"));
    fs::write(&tmp, &content).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &path).map_err(|e| e.to_string())
}

/// List all transcript files in the documents dir.
#[tauri::command]
pub async fn list_transcripts(app: tauri::AppHandle) -> Result<Vec<TranscriptMeta>, String> {
    let dir = transcript_dir(&app)?;
    if !dir.exists() {
        return Ok(vec![]);
    }

    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    let mut results = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden/temp files
        if name.starts_with('.') {
            continue;
        }

        let created_at = entry
            .metadata()
            .ok()
            .and_then(|m| m.created().ok())
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs().to_string())
            .unwrap_or_default();

        results.push(TranscriptMeta {
            name,
            path: path.to_string_lossy().to_string(),
            created_at,
        });
    }

    results.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(results)
}

/// Read the full text content of a single transcript file.
#[tauri::command]
pub async fn read_transcript(
    app: tauri::AppHandle,
    filename: String,
) -> Result<String, String> {
    let dir = transcript_dir(&app)?;
    let path = dir.join(&filename);
    // Guard against path traversal (e.g. filename = "../../etc/passwd")
    if !path.starts_with(&dir) {
        return Err("Invalid filename".to_string());
    }
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Delete a transcript file. Irreversible — caller must confirm before invoking.
#[tauri::command]
pub async fn delete_transcript(
    app: tauri::AppHandle,
    filename: String,
) -> Result<(), String> {
    let dir = transcript_dir(&app)?;
    let path = dir.join(&filename);
    // Guard against path traversal
    if !path.starts_with(&dir) {
        return Err("Invalid filename".to_string());
    }
    fs::remove_file(&path).map_err(|e| e.to_string())
}

/// Write audio recording to the recordings subdirectory.
#[tauri::command]
pub async fn write_audio(
    app: tauri::AppHandle,
    filename: String,
    data: Vec<u8>,
) -> Result<(), String> {
    let docs = app.path().document_dir().map_err(|e| e.to_string())?;
    let dir = docs.join("HeyGracie").join("recordings");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let path = dir.join(&filename);
    println!("[write_audio] Saving to: {:?}", path);
    fs::write(&path, &data).map_err(|e| e.to_string())
}

/// Read audio recording file.
#[tauri::command]
pub async fn read_audio(
    app: tauri::AppHandle,
    filename: String,
) -> Result<Vec<u8>, String> {
    let docs = app.path().document_dir().map_err(|e| e.to_string())?;
    let recordings_dir = docs.join("HeyGracie").join("recordings");
    let path = recordings_dir.join(&filename);

    println!("[read_audio] Looking for: {:?}, exists: {}", path, path.exists());

    // Guard against path traversal
    if !path.starts_with(&recordings_dir) {
        return Err("Invalid filename".to_string());
    }

    fs::read(&path).map_err(|e| e.to_string())
}

/// Delete audio recording file.
#[tauri::command]
pub async fn delete_audio(
    app: tauri::AppHandle,
    filename: String,
) -> Result<(), String> {
    let docs = app.path().document_dir().map_err(|e| e.to_string())?;
    let recordings_dir = docs.join("HeyGracie").join("recordings");
    let path = recordings_dir.join(&filename);

    // Guard against path traversal
    if !path.starts_with(&recordings_dir) {
        return Err("Invalid filename".to_string());
    }

    // Allow missing file (no error if already deleted)
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}
