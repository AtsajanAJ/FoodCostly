"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocaleAction } from "@/features/i18n/actions";
import { useDictionary, useI18n } from "@/features/i18n/i18n-provider";
import type { Locale } from "@/i18n/config";

export function LocaleSwitcher() {
  const router = useRouter();
  const { locale } = useI18n();
  const dict = useDictionary();
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    startTransition(async () => {
      await setLocaleAction(next as Locale);
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="sr-only">{dict.locale.label}</span>
      <select
        className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
        value={locale}
        disabled={pending}
        onChange={(event) => onChange(event.target.value)}
        aria-label={dict.locale.label}
      >
        <option value="en">{dict.locale.en}</option>
        <option value="th">{dict.locale.th}</option>
      </select>
    </label>
  );
}
