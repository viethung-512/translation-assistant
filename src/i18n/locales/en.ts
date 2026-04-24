// English UI strings — default locale
export const en = {
  // Status badge
  status_disconnected: "Disconnected",
  status_connecting: "Connecting…",
  status_connected: "Live",
  status_error: "Error",

  // Top bar ARIA labels
  aria_view_history: "View session history",
  aria_switch_light: "Switch to light mode",
  aria_switch_dark: "Switch to dark mode",
  aria_open_settings: "Open settings",
  aria_close_settings: "Close settings",
  aria_close_history: "Close history",

  // Settings panel
  settings_title: "Settings",
  settings_api_key_label: "Soniox API Key",
  settings_api_key_stored: "Stored",
  settings_api_key_placeholder_stored: "••••••••••••",
  settings_api_key_placeholder_empty: "Enter your API key",
  settings_save_key: "Save Key",
  settings_saving: "Saving…",
  settings_delete_key: "Delete",
  settings_lang_a: "Language A",
  settings_lang_b: "Language B",
  settings_auto_detect: "Auto-detect",
  settings_auto_detect_hint: "Auto-detect which language is spoken",
  settings_output_mode: "Output mode",
  settings_text_only: "Text only",
  settings_voice_output: "Voice output",
  settings_ui_language: "Interface language",

  // Bottom controls
  controls_switch: "Switch",
  controls_pause: "Pause",
  controls_resume: "Resume",
  controls_stop: "Stop",
  controls_clear_transcript: "Clear transcript",
  aria_start: "Start listening",
  aria_pause: "Pause listening",
  aria_resume: "Resume listening",
  aria_stop: "Stop and save",
  aria_clear_transcript: "Clear current transcript",

  // History sheet
  history_title: "Session History",
  history_loading: "Loading…",
  history_empty: "No sessions yet. Start a recording to create one.",

  // Session item
  session_unknown_date: "Unknown date",
  session_empty_preview: "(empty)",
  session_loading: "Loading…",
  session_copy: "Copy",
  session_copied: "Copied!",
  session_share: "Share",
  session_delete: "Delete",
  session_cancel: "Cancel",
  session_delete_title: "Delete session?",
  session_delete_description: "This will permanently remove this transcript.",
  session_delete_confirm: "Delete",

  // Translation display placeholders
  renderer_placeholder_original: "Original language",
  renderer_placeholder_translated: "Translated language",

  // Microphone permission
  mic_denied_title: "Microphone Access Denied",
  mic_denied_body:
    "Microphone permission was denied. To use this app, enable microphone access in your device settings.",
  mic_unavailable_title: "Microphone Unavailable",
  mic_unavailable_body:
    "No microphone device found. Please connect a microphone and try again.",
  mic_open_settings: "Open Settings",

  // v2 Main Screen
  v2_main_auto_detect: "Auto-detect language",
  v2_status_ready: "Ready",
  v2_status_listening: "Listening…",
  v2_status_paused_label: "Paused",
  v2_status_translating: "Translating…",
  v2_status_stopped: "Stopped",
  v2_status_missing_key: "Missing API Key",
  v2_btn_pause: "Pause",
  v2_btn_resume: "Resume",
  v2_btn_start: "Start",
  v2_btn_stop: "Stop",
  v2_output_text: "Text",
  v2_output_voice: "Voice",
  v2_empty_start_title: "Tap START to begin translating",
  v2_empty_start_body:
    "Speak in any language. Each voice is auto-labeled and color-coded.",
  v2_speaker: "Speaker {{n}}",
  v2_unknown_speaker: "Unknown Speaker",
  v2_jump_to_live: "Jump to live",

  // v2 Lang Sheet
  v2_lang_select_title: "Select Language",
  v2_lang_search_placeholder: "Search languages",
  v2_lang_section_common: "Common",
  v2_lang_section_results: "Results",
  v2_lang_section_all: "All languages",

  // v2 Settings
  v2_settings_title: "Settings",
  v2_settings_section_languages: "Languages",
  v2_settings_lang_a: "Default Language A",
  v2_settings_lang_b: "Default Language B",
  v2_settings_auto_detect: "Auto-detect language",
  v2_settings_auto_detect_hint: "Route each speaker to the right translation",
  v2_settings_section_translation: "Translation",
  v2_settings_output_mode: "Default output mode",
  v2_settings_speaking_voice: "Speaking voice",
  v2_settings_output_device: "Output device",
  v2_settings_section_appearance: "Appearance",
  v2_settings_theme: "Theme",
  v2_settings_app_language: "App language",
  v2_settings_section_privacy: "Privacy",
  v2_settings_auto_save: "Auto-save conversations",
  v2_settings_clear_history: "Clear all history",
  v2_settings_section_about: "About",
  v2_settings_app_version: "App version",
  v2_settings_privacy_policy: "Privacy Policy",
  v2_settings_terms: "Terms of Service",
  v2_settings_footer: "HeyGracie · Built for the factory floor",
  v2_settings_voice_neutral: "Neutral",
  v2_settings_voice_female: "Female",
  v2_settings_voice_male: "Male",
  v2_settings_device_speaker: "iPhone Speaker",
  v2_settings_device_earpiece: "Earpiece",
  v2_settings_device_bluetooth: "Bluetooth",
  v2_settings_theme_light: "Light",
  v2_settings_theme_dark: "Dark",
  v2_settings_theme_system: "System",
  v2_settings_sheet_output_mode: "Output Mode",
  v2_settings_sheet_speaking_voice: "Speaking Voice",
  v2_settings_sheet_output_device: "Output Device",
  v2_settings_sheet_app_language: "App Language",

  // v2 API Key Settings
  v2_settings_section_api: "API",
  v2_settings_api_key: "Soniox API Key",
  v2_settings_api_key_configured: "Configured",
  v2_settings_api_key_not_set: "Not set",
  v2_api_key_dialog_title: "Soniox API Key",
  v2_api_key_dialog_placeholder_empty: "Enter your API key",
  v2_api_key_dialog_placeholder_stored: "••••••••••••",
  v2_api_key_dialog_save: "Save",
  v2_api_key_dialog_saving: "Saving…",
  v2_api_key_dialog_delete: "Delete Key",
  v2_api_key_dialog_cancel: "Cancel",
  // v2 No API Key Dialog
  v2_no_key_dialog_title: "API Key Required",
  v2_no_key_dialog_body: "Add your Soniox API key in Settings to start translating.",
  v2_no_key_dialog_go_settings: "Go to Settings",
  v2_no_key_dialog_cancel: "Cancel",

  // v2 Record Sessions
  v2_settings_record_sessions: "Record translation sessions",
  v2_settings_record_sessions_hint: "Save audio recordings for later review",
  v2_settings_mic_permission_denied: "Microphone permission required to record sessions",
  v2_settings_storage_permission_denied: "Storage permission required to save recordings",

  // v2 History
  v2_history_title: "History",
  v2_history_sessions: "{{count}} sessions",
  v2_history_speakers: "{{count}} SPEAKERS",
  v2_history_empty_title: "No conversations yet",
  v2_history_empty_body: "Start your first session",
  v2_history_btn_cancel: "Cancel",
  v2_history_btn_delete_selected: "Delete selected",
  v2_history_btn_delete_count: "Delete selected ({{count}})",
  v2_history_confirm_title: "Delete {{count}} session(s)?",
  v2_history_confirm_body: "This action cannot be undone.",
  v2_history_confirm_delete: "Delete",

  // v2 Detail
  v2_detail_share: "Share Transcript",
  v2_detail_export: "Export",
  v2_detail_rename_speaker: "Rename speaker",
  v2_detail_rename_hint: "Applied across this session",
  v2_detail_rename_placeholder: "Speaker name",
  v2_detail_btn_cancel: "Cancel",
  v2_detail_btn_save: "Save",
  v2_detail_filter_all: "All",

  // v2 Dialog
  v2_dialog_clear_title: "Clear all history?",
  v2_dialog_clear_body: "This action cannot be undone.",
  v2_dialog_delete: "Delete",
} as const;

export type TranslationKeys = keyof typeof en;
