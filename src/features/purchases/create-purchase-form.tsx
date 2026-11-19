"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPurchaseAction } from "@/features/purchases/actions";
import { useDictionary } from "@/features/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; name: string; code?: string };

type LineState = {
  ingredientId: string;
  quantity: string;
  unitId: string;
  unitPrice: string;
};

export function CreatePurchaseForm({
  suppliers,
  ingredients,
  units,
}: {
  suppliers: Option[];
  ingredients: Option[];
  units: Option[];
}) {
  const dict = useDictionary();
  const router = useRouter();
  const defaultUnitId = useMemo(
    () => units.find((unit) => unit.code === "kg")?.id ?? units[0]?.id ?? "",
    [units],
  );

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [purchasedAt, setPurchasedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [taxAmount, setTaxAmount] = useState("0");
  const [shippingAmount, setShippingAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineState[]>([
    {
      ingredientId: ingredients[0]?.id ?? "",
      quantity: "1",
      unitId: defaultUnitId,
      unitPrice: "0",
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function updateLine(index: number, patch: Partial<LineState>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await createPurchaseAction({
      supplierId,
      purchasedAt,
      invoiceNumber: invoiceNumber || null,
      discountAmount,
      taxAmount,
      shippingAmount,
      notes: notes || null,
      lines,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push(`/dashboard/purchases/${result.purchaseId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="supplier">{dict.purchases.supplier}</Label>
          <select
            id="supplier"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
            required
          >
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="purchased-at">{dict.purchases.purchasedAt}</Label>
          <Input
            id="purchased-at"
            type="date"
            value={purchasedAt}
            onChange={(event) => setPurchasedAt(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="invoice">{dict.purchases.invoiceRef}</Label>
          <Input
            id="invoice"
            value={invoiceNumber}
            onChange={(event) => setInvoiceNumber(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="notes">{dict.common.notes}</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="discount">{dict.purchases.discount}</Label>
          <Input
            id="discount"
            inputMode="decimal"
            value={discountAmount}
            onChange={(event) => setDiscountAmount(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tax">{dict.purchases.tax}</Label>
          <Input
            id="tax"
            inputMode="decimal"
            value={taxAmount}
            onChange={(event) => setTaxAmount(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="shipping">{dict.purchases.shipping}</Label>
          <Input
            id="shipping"
            inputMode="decimal"
            value={shippingAmount}
            onChange={(event) => setShippingAmount(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">{dict.common.lines}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setLines((current) => [
                ...current,
                {
                  ingredientId: ingredients[0]?.id ?? "",
                  quantity: "1",
                  unitId: defaultUnitId,
                  unitPrice: "0",
                },
              ])
            }
          >
            {dict.purchases.addLine}
          </Button>
        </div>

        {lines.map((line, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-4"
          >
            <select
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
              value={line.ingredientId}
              onChange={(event) =>
                updateLine(index, { ingredientId: event.target.value })
              }
              required
            >
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </option>
              ))}
            </select>
            <Input
              inputMode="decimal"
              value={line.quantity}
              onChange={(event) =>
                updateLine(index, { quantity: event.target.value })
              }
              placeholder={dict.common.qty}
              required
            />
            <select
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
              value={line.unitId}
              onChange={(event) =>
                updateLine(index, { unitId: event.target.value })
              }
              required
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.code}
                </option>
              ))}
            </select>
            <Input
              inputMode="decimal"
              value={line.unitPrice}
              onChange={(event) =>
                updateLine(index, { unitPrice: event.target.value })
              }
              placeholder={dict.purchases.unitPrice}
              required
            />
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        type="submit"
        disabled={pending || suppliers.length === 0 || ingredients.length === 0}
      >
        {pending ? dict.common.saving : dict.purchases.saveDraft}
      </Button>
    </form>
  );
}