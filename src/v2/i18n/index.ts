// v2 i18n — re-uses the shared i18next instance from src/i18n.
// Import this file (not src/i18n directly) inside src/v2/ for consistency.
import i18n from "@/i18n";
export { useTranslation as useV2T } from "react-i18next";
export default i18n;
