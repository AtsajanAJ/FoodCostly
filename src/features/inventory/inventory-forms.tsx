"use client";

import { useState } from "react";
import {
  recordAdjustmentAction,
  recordStockCountAction,
  recordWasteAction,
} from "@/features/inventory/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; name: string; code?: string };

function useFormState() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  return { error, setError, pending, setPending, success, setSuccess };
}

export function WasteForm({
  ingredients,
  units,
}: {
  ingredients: Option[];
  units: Option[];
}) {
  const state = useFormState();
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? "");
  const [unitId, setUnitId] = useState(
    units.find((unit) => unit.code === "g")?.id ?? units[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    state.setPending(true);
    state.setError(null);
    state.setSuccess(null);
    const result = await recordWasteAction({
      ingredientId,
      unitId,
      quantity,
      reason,
    });
    state.setPending(false);
    if (!result.ok) {
      state.setError(result.error);
      return;
    }
    state.setSuccess("Waste recorded");
    setQuantity("");
    setReason("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <h2 className="text-sm font-medium">Record waste</h2>
      <InventoryFields
        ingredients={ingredients}
        units={units}
        ingredientId={ingredientId}
        setIngredientId={setIngredientId}
        unitId={unitId}
        setUnitId={setUnitId}
        quantity={quantity}
        setQuantity={setQuantity}
        reason={reason}
        setReason={setReason}
        quantityLabel="Quantity"
      />
      <StatusMessages {...state} />
      <Button type="submit" disabled={state.pending || ingredients.length === 0}>
        {state.pending ? "Saving…" : "Record waste"}
      </Button>
    </form>
  );
}

export function AdjustmentForm({
  ingredients,
  units,
}: {
  ingredients: Option[];
  units: Option[];
}) {
  const state = useFormState();
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? "");
  const [unitId, setUnitId] = useState(
    units.find((unit) => unit.code === "g")?.id ?? units[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [direction, setDirection] = useState<"IN" | "OUT">("OUT");
  const [unitCost, setUnitCost] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    state.setPending(true);
    state.setError(null);
    state.setSuccess(null);
    const result = await recordAdjustmentAction({
      ingredientId,
      unitId,
      quantity,
      reason,
      direction,
      unitCost: unitCost || null,
    });
    state.setPending(false);
    if (!result.ok) {
      state.setError(result.error);
      return;
    }
    state.setSuccess("Adjustment recorded");
    setQuantity("");
    setReason("");
    setUnitCost("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <h2 className="text-sm font-medium">Stock adjustment</h2>
      <div className="space-y-1">
        <Label htmlFor="direction">Direction</Label>
        <select
          id="direction"
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
          value={direction}
          onChange={(event) =>
            setDirection(event.target.value as "IN" | "OUT")
          }
        >
          <option value="OUT">Decrease</option>
          <option value="IN">Increase</option>
        </select>
      </div>
      <InventoryFields
        ingredients={ingredients}
        units={units}
        ingredientId={ingredientId}
        setIngredientId={setIngredientId}
        unitId={unitId}
        setUnitId={setUnitId}
        quantity={quantity}
        setQuantity={setQuantity}
        reason={reason}
        setReason={setReason}
        quantityLabel="Quantity"
      />
      {direction === "IN" ? (
        <div className="space-y-1">
          <Label htmlFor="unit-cost">Unit cost (optional, base unit)</Label>
          <Input
            id="unit-cost"
            inputMode="decimal"
            value={unitCost}
            onChange={(event) => setUnitCost(event.target.value)}
            placeholder="defaults to current MWAC"
          />
        </div>
      ) : null}
      <StatusMessages {...state} />
      <Button type="submit" disabled={state.pending || ingredients.length === 0}>
        {state.pending ? "Saving…" : "Record adjustment"}
      </Button>
    </form>
  );
}

export function StockCountForm({
  ingredients,
  units,
}: {
  ingredients: Option[];
  units: Option[];
}) {
  const state = useFormState();
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? "");
  const [unitId, setUnitId] = useState(
    units.find((unit) => unit.code === "g")?.id ?? units[0]?.id ?? "",
  );
  const [countedQuantity, setCountedQuantity] = useState("");
  const [reason, setReason] = useState("Stock count");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    state.setPending(true);
    state.setError(null);
    state.setSuccess(null);
    const result = await recordStockCountAction({
      ingredientId,
      unitId,
      countedQuantity,
      reason,
    });
    state.setPending(false);
    if (!result.ok) {
      state.setError(result.error);
      return;
    }
    state.setSuccess("Stock count applied");
    setCountedQuantity("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <h2 className="text-sm font-medium">Stock count</h2>
      <InventoryFields
        ingredients={ingredients}
        units={units}
        ingredientId={ingredientId}
        setIngredientId={setIngredientId}
        unitId={unitId}
        setUnitId={setUnitId}
        quantity={countedQuantity}
        setQuantity={setCountedQuantity}
        reason={reason}
        setReason={setReason}
        quantityLabel="Counted quantity"
      />
      <StatusMessages {...state} />
      <Button type="submit" disabled={state.pending || ingredients.length === 0}>
        {state.pending ? "Saving…" : "Apply count"}
      </Button>
    </form>
  );
}

function InventoryFields({
  ingredients,
  units,
  ingredientId,
  setIngredientId,
  unitId,
  setUnitId,
  quantity,
  setQuantity,
  reason,
  setReason,
  quantityLabel,
}: {
  ingredients: Option[];
  units: Option[];
  ingredientId: string;
  setIngredientId: (value: string) => void;
  unitId: string;
  setUnitId: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  quantityLabel: string;
}) {
  return (
    <>
      <div className="space-y-1">
        <Label>Ingredient</Label>
        <select
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
          value={ingredientId}
          onChange={(event) => setIngredientId(event.target.value)}
          required
        >
          {ingredients.map((ingredient) => (
            <option key={ingredient.id} value={ingredient.id}>
              {ingredient.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>{quantityLabel}</Label>
          <Input
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Unit</Label>
          <select
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
            value={unitId}
            onChange={(event) => setUnitId(event.target.value)}
            required
          >
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.code}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Reason</Label>
        <Input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
        />
      </div>
    </>
  );
}

function StatusMessages({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
  pending: boolean;
  setError: (value: string | null) => void;
  setPending: (value: boolean) => void;
  setSuccess: (value: string | null) => void;
}) {
  return (
    <>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-muted-foreground">{success}</p> : null}
    </>
  );
}
