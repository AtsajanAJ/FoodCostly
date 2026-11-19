"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  isLocale,
  localeCookieName,
  type Locale,
} from "@/i18n/config";

export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) {
    return { ok: false as const, error: "Unsupported locale" };
  }

  const jar = await cookies();
  jar.set(localeCookieName, locale as Locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { ok: true as const };
}
