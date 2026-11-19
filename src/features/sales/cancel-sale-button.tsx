"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelSaleAction } from "@/features/sales/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDictionary } from "@/features/i18n/i18n-provider";

export function CancelSaleButton({ saleId }: { saleId: string }) {
  const dict = useDictionary();
  const router = useRouter();
  const [reason, setReason] = useState<string>(dict.sales.cancelReasonDefault);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCancel() {
    if (!window.confirm(dict.sales.cancelConfirm)) return;
    setPending(true);
    setError(null);
    const result = await cancelSaleAction({
      saleId,
      cancelReason: reason,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <Input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder={dict.sales.cancelReason}
      />
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => void onCancel()}
      >
        {pending ? dict.sales.cancelling : dict.sales.cancelSale}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
