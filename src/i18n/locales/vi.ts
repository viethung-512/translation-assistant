// Vietnamese UI strings — enforces same keys as `en` at compile time
import type { TranslationKeys } from "./en";

export const vi: Record<TranslationKeys, string> = {
  // Status badge
  status_disconnected: "Ngắt kết nối",
  status_connecting: "Đang kết nối…",
  status_connected: "Trực tiếp",
  status_error: "Lỗi",

  // Top bar ARIA labels
  aria_view_history: "Xem lịch sử phiên",
  aria_switch_light: "Chuyển sang chế độ sáng",
  aria_switch_dark: "Chuyển sang chế độ tối",
  aria_open_settings: "Mở cài đặt",
  aria_close_settings: "Đóng cài đặt",
  aria_close_history: "Đóng lịch sử",

  // Settings panel
  settings_title: "Cài đặt",
  settings_api_key_label: "Khóa API Soniox",
  settings_api_key_stored: "Đã lưu",
  settings_api_key_placeholder_stored: "••••••••••••",
  settings_api_key_placeholder_empty: "Nhập khóa API của bạn",
  settings_save_key: "Lưu khóa",
  settings_saving: "Đang lưu…",
  settings_delete_key: "Xóa",
  settings_lang_a: "Ngôn ngữ A",
  settings_lang_b: "Ngôn ngữ B",
  settings_auto_detect: "Tự động nhận diện",
  settings_auto_detect_hint: "Tự động nhận diện ngôn ngữ đang nói",
  settings_output_mode: "Chế độ xuất",
  settings_text_only: "Chỉ văn bản",
  settings_voice_output: "Đầu ra giọng nói",
  settings_ui_language: "Ngôn ngữ giao diện",

  // Bottom controls
  controls_switch: "Chuyển",
  controls_pause: "Tạm dừng",
  controls_resume: "Tiếp tục",
  controls_stop: "Dừng",
  controls_clear_transcript: "Xóa bản ghi",
  aria_start: "Bắt đầu lắng nghe",
  aria_pause: "Tạm dừng lắng nghe",
  aria_resume: "Tiếp tục lắng nghe",
  aria_stop: "Dừng và lưu",
  aria_clear_transcript: "Xóa bản ghi hiện tại",

  // History sheet
  history_title: "Lịch sử phiên",
  history_loading: "Đang tải…",
  history_empty: "Chưa có phiên nào. Bắt đầu ghi âm để tạo một phiên.",

  // Session item
  session_unknown_date: "Ngày không xác định",
  session_empty_preview: "(trống)",
  session_loading: "Đang tải…",
  session_copy: "Sao chép",
  session_copied: "Đã sao chép!",
  session_share: "Chia sẻ",
  session_delete: "Xóa",
  session_cancel: "Hủy",
  session_delete_title: "Xóa phiên?",
  session_delete_description: "Thao tác này sẽ xóa vĩnh viễn bản ghi này.",
  session_delete_confirm: "Xóa",

  // Translation display placeholders
  renderer_placeholder_original: "Ngôn ngữ gốc",
  renderer_placeholder_translated: "Ngôn ngữ đích",

  // Microphone permission
  mic_denied_title: "Quyền truy cập microphone bị từ chối",
  mic_denied_body:
    "Quyền microphone bị từ chối. Để sử dụng ứng dụng này, hãy bật quyền truy cập microphone trong cài đặt thiết bị.",
  mic_unavailable_title: "Microphone không khả dụng",
  mic_unavailable_body:
    "Không tìm thấy thiết bị microphone. Vui lòng kết nối microphone và thử lại.",
  mic_open_settings: "Mở cài đặt",

  // v2 Main Screen
  v2_main_auto_detect: "Tự động nhận diện ngôn ngữ",
  v2_status_ready: "Sẵn sàng",
  v2_status_listening: "Đang nghe…",
  v2_status_paused_label: "Đã tạm dừng",
  v2_status_translating: "Đang dịch…",
  v2_status_stopped: "Đã dừng",
  v2_status_missing_key: "Thiếu khoá API",
  v2_btn_pause: "Tạm dừng",
  v2_btn_resume: "Tiếp tục",
  v2_btn_start: "Bắt đầu",
  v2_btn_stop: "Dừng",
  v2_output_text: "Văn bản",
  v2_output_voice: "Giọng nói",
  v2_empty_start_title: "Nhấn BẮT ĐẦU để dịch",
  v2_empty_start_body:
    "Nói bằng bất kỳ ngôn ngữ nào. Mỗi giọng nói được tự động gán nhãn và tô màu.",
  v2_speaker: "Người nói {{n}}",
  v2_unknown_speaker: "Người nói không xác định",
  v2_jump_to_live: "Nhảy đến đoạn trực tiếp",

  // v2 Lang Sheet
  v2_lang_select_title: "Chọn ngôn ngữ",
  v2_lang_search_placeholder: "Tìm kiếm ngôn ngữ",
  v2_lang_section_common: "Phổ biến",
  v2_lang_section_results: "Kết quả",
  v2_lang_section_all: "Tất cả ngôn ngữ",

  // v2 Settings
  v2_settings_title: "Cài đặt",
  v2_settings_section_languages: "Ngôn ngữ",
  v2_settings_lang_a: "Ngôn ngữ mặc định A",
  v2_settings_lang_b: "Ngôn ngữ mặc định B",
  v2_settings_auto_detect: "Tự động nhận diện ngôn ngữ",
  v2_settings_auto_detect_hint:
    "Định tuyến từng người nói đến bản dịch phù hợp",
  v2_settings_section_translation: "Dịch thuật",
  v2_settings_output_mode: "Chế độ xuất mặc định",
  v2_settings_speaking_voice: "Giọng nói",
  v2_settings_output_device: "Thiết bị đầu ra",
  v2_settings_section_appearance: "Giao diện",
  v2_settings_theme: "Chủ đề",
  v2_settings_app_language: "Ngôn ngữ ứng dụng",
  v2_settings_section_privacy: "Quyền riêng tư",
  v2_settings_auto_save: "Tự động lưu cuộc trò chuyện",
  v2_settings_clear_history: "Xóa tất cả lịch sử",
  v2_settings_section_about: "Giới thiệu",
  v2_settings_app_version: "Phiên bản ứng dụng",
  v2_settings_privacy_policy: "Chính sách quyền riêng tư",
  v2_settings_terms: "Điều khoản dịch vụ",
  v2_settings_footer: "HeyGracie · Xây dựng cho sàn nhà máy",
  v2_settings_voice_neutral: "Trung tính",
  v2_settings_voice_female: "Nữ",
  v2_settings_voice_male: "Nam",
  v2_settings_device_speaker: "Loa điện thoại",
  v2_settings_device_earpiece: "Tai nghe trong",
  v2_settings_device_bluetooth: "Bluetooth",
  v2_settings_theme_light: "Sáng",
  v2_settings_theme_dark: "Tối",
  v2_settings_theme_system: "Hệ thống",
  v2_settings_sheet_output_mode: "Chế độ xuất",
  v2_settings_sheet_speaking_voice: "Giọng nói",
  v2_settings_sheet_output_device: "Thiết bị đầu ra",
  v2_settings_sheet_app_language: "Ngôn ngữ ứng dụng",

  // v2 API Key Settings
  v2_settings_section_api: "API",
  v2_settings_api_key: "Khoá API Soniox",
  v2_settings_api_key_configured: "Đã cấu hình",
  v2_settings_api_key_not_set: "Chưa cài đặt",
  v2_api_key_dialog_title: "Khoá API Soniox",
  v2_api_key_dialog_placeholder_empty: "Nhập khoá API của bạn",
  v2_api_key_dialog_placeholder_stored: "••••••••••••",
  v2_api_key_dialog_save: "Lưu",
  v2_api_key_dialog_saving: "Đang lưu…",
  v2_api_key_dialog_delete: "Xoá khoá",
  v2_api_key_dialog_cancel: "Huỷ",
  // v2 No API Key Dialog
  v2_no_key_dialog_title: "Yêu cầu khoá API",
  v2_no_key_dialog_body: "Thêm khoá API Soniox trong Cài đặt để bắt đầu dịch.",
  v2_no_key_dialog_go_settings: "Đến Cài đặt",
  v2_no_key_dialog_cancel: "Huỷ",

  // v2 History
  v2_history_title: "Lịch sử",
  v2_history_sessions: "{{count}} phiên",
  v2_history_speakers: "{{count}} NGƯỜI NÓI",
  v2_history_empty_title: "Chưa có cuộc trò chuyện",
  v2_history_empty_body: "Bắt đầu phiên đầu tiên của bạn",
  v2_history_btn_cancel: "Hủy",
  v2_history_btn_delete_selected: "Xóa đã chọn",
  v2_history_btn_delete_count: "Xóa đã chọn ({{count}})",
  v2_history_confirm_title: "Xóa {{count}} phiên?",
  v2_history_confirm_body: "Hành động này không thể hoàn tác.",
  v2_history_confirm_delete: "Xóa",

  // v2 Detail
  v2_detail_share: "Chia sẻ bản ghi",
  v2_detail_export: "Xuất",
  v2_detail_rename_speaker: "Đổi tên người nói",
  v2_detail_rename_hint: "Áp dụng trong toàn bộ phiên này",
  v2_detail_rename_placeholder: "Tên người nói",
  v2_detail_btn_cancel: "Hủy",
  v2_detail_btn_save: "Lưu",
  v2_detail_filter_all: "Tất cả",

  // v2 Dialog
  v2_dialog_clear_title: "Xóa tất cả lịch sử?",
  v2_dialog_clear_body: "Hành động này không thể hoàn tác.",
  v2_dialog_delete: "Xóa",
} as const;
