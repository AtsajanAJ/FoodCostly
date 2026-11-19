"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelSaleAction } from "@/features/sales/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CancelSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("Customer cancellation");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCancel() {
    if (!window.confirm("Cancel this sale and reverse stock?")) return;
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
        placeholder="Cancel reason"
      />
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => void onCancel()}
      >
        {pending ? "Cancelling…" : "Cancel sale"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
