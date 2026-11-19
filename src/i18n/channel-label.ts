import type { Dictionary } from "@/i18n/dictionaries/en";

export function channelLabel(
  dict: Dictionary,
  code: string,
  fallbackName: string,
) {
  if (code === "INSTORE") return dict.channels.instore;
  if (code === "DELIVERY") return dict.channels.delivery;
  return fallbackName;
}
