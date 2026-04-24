export interface Language {
  code: string; // BCP-47 e.g. "en", "vi"
  flag: string; // emoji flag
  name: string; // English display name
  native: string; // name in the language itself
}

/** Full list of languages supported by the Soniox API */
export const ALL_AVAILABLE_LANGUAGES: Language[] = [
  { code: "af", flag: "🇿🇦", name: "Afrikaans", native: "Afrikaans" },
  { code: "ar", flag: "🇸🇦", name: "Arabic", native: "العربية" },
  { code: "bg", flag: "🇧🇬", name: "Bulgarian", native: "Български" },
  { code: "bn", flag: "🇧🇩", name: "Bengali", native: "বাংলা" },
  { code: "ca", flag: "🇪🇸", name: "Catalan", native: "Català" },
  { code: "cs", flag: "🇨🇿", name: "Czech", native: "Čeština" },
  { code: "da", flag: "🇩🇰", name: "Danish", native: "Dansk" },
  { code: "de", flag: "🇩🇪", name: "German", native: "Deutsch" },
  { code: "el", flag: "🇬🇷", name: "Greek", native: "Ελληνικά" },
  { code: "en", flag: "🇺🇸", name: "English", native: "English" },
  { code: "es", flag: "🇪🇸", name: "Spanish", native: "Español" },
  { code: "et", flag: "🇪🇪", name: "Estonian", native: "Eesti" },
  { code: "fa", flag: "🇮🇷", name: "Persian", native: "فارسی" },
  { code: "fi", flag: "🇫🇮", name: "Finnish", native: "Suomi" },
  { code: "fr", flag: "🇫🇷", name: "French", native: "Français" },
  { code: "he", flag: "🇮🇱", name: "Hebrew", native: "עברית" },
  { code: "hi", flag: "🇮🇳", name: "Hindi", native: "हिन्दी" },
  { code: "hr", flag: "🇭🇷", name: "Croatian", native: "Hrvatski" },
  { code: "hu", flag: "🇭🇺", name: "Hungarian", native: "Magyar" },
  { code: "id", flag: "🇮🇩", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "it", flag: "🇮🇹", name: "Italian", native: "Italiano" },
  { code: "ja", flag: "🇯🇵", name: "Japanese", native: "日本語" },
  { code: "ko", flag: "🇰🇷", name: "Korean", native: "한국어" },
  { code: "lt", flag: "🇱🇹", name: "Lithuanian", native: "Lietuvių" },
  { code: "lv", flag: "🇱🇻", name: "Latvian", native: "Latviešu" },
  { code: "ms", flag: "🇲🇾", name: "Malay", native: "Bahasa Melayu" },
  { code: "nl", flag: "🇳🇱", name: "Dutch", native: "Nederlands" },
  { code: "no", flag: "🇳🇴", name: "Norwegian", native: "Norsk" },
  { code: "pl", flag: "🇵🇱", name: "Polish", native: "Polski" },
  { code: "pt", flag: "🇵🇹", name: "Portuguese", native: "Português" },
  {
    code: "pt-BR",
    flag: "🇧🇷",
    name: "Portuguese (Brazil)",
    native: "Português (Brasil)",
  },
  { code: "ro", flag: "🇷🇴", name: "Romanian", native: "Română" },
  { code: "ru", flag: "🇷🇺", name: "Russian", native: "Русский" },
  { code: "sk", flag: "🇸🇰", name: "Slovak", native: "Slovenčina" },
  { code: "sl", flag: "🇸🇮", name: "Slovenian", native: "Slovenščina" },
  { code: "sq", flag: "🇦🇱", name: "Albanian", native: "Shqip" },
  { code: "sr", flag: "🇷🇸", name: "Serbian", native: "Српски" },
  { code: "sv", flag: "🇸🇪", name: "Swedish", native: "Svenska" },
  { code: "sw", flag: "🇹🇿", name: "Swahili", native: "Kiswahili" },
  { code: "ta", flag: "🇮🇳", name: "Tamil", native: "தமிழ்" },
  { code: "th", flag: "🇹🇭", name: "Thai", native: "ภาษาไทย" },
  { code: "tl", flag: "🇵🇭", name: "Filipino", native: "Filipino" },
  { code: "tr", flag: "🇹🇷", name: "Turkish", native: "Türkçe" },
  { code: "uk", flag: "🇺🇦", name: "Ukrainian", native: "Українська" },
  { code: "ur", flag: "🇵🇰", name: "Urdu", native: "اردو" },
  { code: "vi", flag: "🇻🇳", name: "Vietnamese", native: "Tiếng Việt" },
  {
    code: "zh",
    flag: "🇨🇳",
    name: "Chinese (Simplified)",
    native: "中文 (简体)",
  },
  {
    code: "zh-TW",
    flag: "🇹🇼",
    name: "Chinese (Traditional)",
    native: "中文 (繁體)",
  },
];

/** Common factory-floor languages shown as quick chips */
export const COMMON_LANG_CODES = [
  "en",
  "vi",
  "zh",
  "ja",
  "ko",
  "fr",
  "es",
  "th",
];

export const COMMON_LANGS = COMMON_LANG_CODES.map((code) =>
  ALL_AVAILABLE_LANGUAGES.find((l) => l.code === code),
).filter(Boolean) as Language[];
