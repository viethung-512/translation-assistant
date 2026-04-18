// Vietnamese UI strings — enforces same keys as `en` at compile time
import type { TranslationKeys } from './en';

export const vi: Record<TranslationKeys, string> = {
  // Status badge
  status_disconnected: 'Ngắt kết nối',
  status_connecting: 'Đang kết nối…',
  status_connected: 'Trực tiếp',
  status_error: 'Lỗi',

  // Top bar ARIA labels
  aria_view_history: 'Xem lịch sử phiên',
  aria_switch_light: 'Chuyển sang chế độ sáng',
  aria_switch_dark: 'Chuyển sang chế độ tối',
  aria_open_settings: 'Mở cài đặt',
  aria_close_settings: 'Đóng cài đặt',
  aria_close_history: 'Đóng lịch sử',

  // Settings panel
  settings_title: 'Cài đặt',
  settings_api_key_label: 'Khóa API Soniox',
  settings_api_key_stored: 'Đã lưu',
  settings_api_key_placeholder_stored: '••••••••••••',
  settings_api_key_placeholder_empty: 'Nhập khóa API của bạn',
  settings_save_key: 'Lưu khóa',
  settings_saving: 'Đang lưu…',
  settings_delete_key: 'Xóa',
  settings_source_lang: 'Ngôn ngữ nguồn',
  settings_target_lang: 'Ngôn ngữ đích',
  settings_output_mode: 'Chế độ xuất',
  settings_text_only: 'Chỉ văn bản',
  settings_voice_output: 'Đầu ra giọng nói',
  settings_ui_language: 'Ngôn ngữ giao diện',

  // Bottom controls
  controls_switch: 'Chuyển',

  // History sheet
  history_title: 'Lịch sử phiên',
  history_loading: 'Đang tải…',
  history_empty: 'Chưa có phiên nào. Bắt đầu ghi âm để tạo một phiên.',

  // Session item
  session_unknown_date: 'Ngày không xác định',
  session_empty_preview: '(trống)',
  session_loading: 'Đang tải…',
  session_copy: 'Sao chép',
  session_copied: 'Đã sao chép!',
  session_share: 'Chia sẻ',
  session_delete: 'Xóa',
  session_confirm: 'Xác nhận?',
  session_cancel: 'Hủy',

  // Translation display placeholders
  renderer_placeholder_original: 'Ngôn ngữ gốc',
  renderer_placeholder_translated: 'Ngôn ngữ đích',

  // Microphone permission
  mic_denied_title: 'Quyền truy cập microphone bị từ chối',
  mic_denied_body: 'Quyền microphone bị từ chối. Để sử dụng ứng dụng này, hãy bật quyền truy cập microphone trong cài đặt thiết bị.',
  mic_unavailable_title: 'Microphone không khả dụng',
  mic_unavailable_body: 'Không tìm thấy thiết bị microphone. Vui lòng kết nối microphone và thử lại.',
  mic_open_settings: 'Mở cài đặt',
} as const;
