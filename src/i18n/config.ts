export const locales = ["en", "th"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeCookieName = "fc_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "th";
}
