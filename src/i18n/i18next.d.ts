// Augment i18next's types so that t('any_invalid_key') is a compile error.
// This gives full type safety to every t() call site project-wide.
import type { en } from "./locales/en";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
  }
}
