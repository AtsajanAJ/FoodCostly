"use client";

import { useState } from "react";
import { createIngredientAction } from "@/features/ingredients/actions";
import { useDictionary } from "@/features/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; name: string; code?: string };

export function CreateIngredientForm({
  units,
  categories,
}: {
  units: Option[];
  categories: Option[];
}) {
  const dict = useDictionary();
  const [name, setName] = useState("");
  const [baseUnitId, setBaseUnitId] = useState(units[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await createIngredientAction({
      name,
      baseUnitId,
      categoryId: categoryId || null,
      minimumStock: minimumStock || null,
      notes: notes || null,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setName("");
    setMinimumStock("");
    setNotes("");
    setCategoryId("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <h2 className="text-sm font-medium">{dict.ingredients.addIngredient}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="ingredient-name">{dict.common.name}</Label>
          <Input
            id="ingredient-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="base-unit">{dict.ingredients.baseUnit}</Label>
          <select
            id="base-unit"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
            value={baseUnitId}
            onChange={(event) => setBaseUnitId(event.target.value)}
            required
          >
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.code} — {unit.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="category">{dict.ingredients.category}</Label>
          <select
            id="category"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">{dict.ingredients.noCategory}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="minimum-stock">
            {dict.ingredients.minimumStock} ({dict.ingredients.baseUnit})
          </Label>
          <Input
            id="minimum-stock"
            inputMode="decimal"
            value={minimumStock}
            onChange={(event) => setMinimumStock(event.target.value)}
            placeholder={dict.common.optional}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">{dict.common.notes}</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={dict.common.optional}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending || !baseUnitId}>
        {pending ? dict.common.saving : dict.ingredients.createIngredient}
      </Button>
    </form>
  );
}