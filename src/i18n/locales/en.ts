// English UI strings — default locale
export const en = {
  // Status badge
  status_disconnected: 'Disconnected',
  status_connecting: 'Connecting…',
  status_connected: 'Live',
  status_error: 'Error',

  // Top bar ARIA labels
  aria_view_history: 'View session history',
  aria_switch_light: 'Switch to light mode',
  aria_switch_dark: 'Switch to dark mode',
  aria_open_settings: 'Open settings',
  aria_close_settings: 'Close settings',
  aria_close_history: 'Close history',

  // Settings panel
  settings_title: 'Settings',
  settings_api_key_label: 'Soniox API Key',
  settings_api_key_stored: 'Stored',
  settings_api_key_placeholder_stored: '••••••••••••',
  settings_api_key_placeholder_empty: 'Enter your API key',
  settings_save_key: 'Save Key',
  settings_saving: 'Saving…',
  settings_delete_key: 'Delete',
  settings_lang_a: 'Language A',
  settings_lang_b: 'Language B',
  settings_auto_detect: 'Auto-detect',
  settings_auto_detect_hint: 'Auto-detect which language is spoken',
  settings_output_mode: 'Output mode',
  settings_text_only: 'Text only',
  settings_voice_output: 'Voice output',
  settings_ui_language: 'Interface language',

  // Bottom controls
  controls_switch: 'Switch',
  controls_pause: 'Pause',
  controls_resume: 'Resume',
  controls_stop: 'Stop',
  controls_clear_transcript: 'Clear transcript',
  aria_start: 'Start listening',
  aria_pause: 'Pause listening',
  aria_resume: 'Resume listening',
  aria_stop: 'Stop and save',
  aria_clear_transcript: 'Clear current transcript',

  // History sheet
  history_title: 'Session History',
  history_loading: 'Loading…',
  history_empty: 'No sessions yet. Start a recording to create one.',

  // Session item
  session_unknown_date: 'Unknown date',
  session_empty_preview: '(empty)',
  session_loading: 'Loading…',
  session_copy: 'Copy',
  session_copied: 'Copied!',
  session_share: 'Share',
  session_delete: 'Delete',
  session_cancel: 'Cancel',
  session_delete_title: 'Delete session?',
  session_delete_description: 'This will permanently remove this transcript.',
  session_delete_confirm: 'Delete',

  // Translation display placeholders
  renderer_placeholder_original: 'Original language',
  renderer_placeholder_translated: 'Translated language',

  // Microphone permission
  mic_denied_title: 'Microphone Access Denied',
  mic_denied_body: 'Microphone permission was denied. To use this app, enable microphone access in your device settings.',
  mic_unavailable_title: 'Microphone Unavailable',
  mic_unavailable_body: 'No microphone device found. Please connect a microphone and try again.',
  mic_open_settings: 'Open Settings',
} as const;

export type TranslationKeys = keyof typeof en;
