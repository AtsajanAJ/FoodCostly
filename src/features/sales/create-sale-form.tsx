"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSaleAction } from "@/features/sales/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChannelOption = { id: string; name: string; code: string };
type MenuOption = {
  id: string;
  name: string;
  priceInStore: string | null;
  priceDelivery: string | null;
};

export function CreateSaleForm({
  channels,
  menuItems,
}: {
  channels: ChannelOption[];
  menuItems: MenuOption[];
}) {
  const router = useRouter();
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [menuItemId, setMenuItemId] = useState(menuItems[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [packagingCost, setPackagingCost] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === channelId),
    [channels, channelId],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await createSaleAction({
      channelId,
      idempotencyKey: crypto.randomUUID(),
      discountAmount,
      packagingCost,
      lines: [{ menuItemId, quantity }],
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/dashboard/sales/${result.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="channel">Channel</Label>
          <select
            id="channel"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
            value={channelId}
            onChange={(event) => setChannelId(event.target.value)}
            required
          >
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="menu-item">Menu item</Label>
          <select
            id="menu-item"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
            value={menuItemId}
            onChange={(event) => setMenuItemId(event.target.value)}
            required
          >
            {menuItems.map((item) => {
              const price =
                selectedChannel?.code === "DELIVERY"
                  ? item.priceDelivery
                  : item.priceInStore;
              return (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {price ? ` · ${price}` : " · no price"}
                </option>
              );
            })}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="qty">Quantity</Label>
          <Input
            id="qty"
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="discount">Discount</Label>
          <Input
            id="discount"
            inputMode="decimal"
            value={discountAmount}
            onChange={(event) => setDiscountAmount(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="packaging">Packaging cost</Label>
          <Input
            id="packaging"
            inputMode="decimal"
            value={packagingCost}
            onChange={(event) => setPackagingCost(event.target.value)}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Saving posts the sale and deducts recipe stock immediately. Insufficient
        stock rejects the whole sale.
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        type="submit"
        disabled={pending || channels.length === 0 || menuItems.length === 0}
      >
        {pending ? "Posting…" : "Post sale"}
      </Button>
    </form>
  );
}
