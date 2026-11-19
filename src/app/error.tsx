"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/features/i18n/i18n-provider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dict = useDictionary();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col justify-center gap-4 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.common.somethingWrong}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {dict.error.unexpected}
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>{dict.common.tryAgain}</Button>
        <Button
          variant="outline"
          render={<Link href="/" />}
          nativeButton={false}
        >
          {dict.common.goHome}
        </Button>
      </div>
    </div>
  );
}
