"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { receivePurchaseAction } from "@/features/purchases/actions";
import { useDictionary } from "@/features/i18n/i18n-provider";
import { Button } from "@/components/ui/button";

export function ReceivePurchaseButton({ purchaseId }: { purchaseId: string }) {
  const dict = useDictionary();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onReceive() {
    setPending(true);
    setError(null);
    const result = await receivePurchaseAction({ purchaseId });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button type="button" disabled={pending} onClick={() => void onReceive()}>
        {pending ? dict.purchases.receiving : dict.purchases.receive}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}