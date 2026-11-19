"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createRecipeAction } from "@/features/recipes/actions";
import { useDictionary } from "@/features/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; name: string; code?: string };
type LineState = {
  ingredientId: string;
  quantity: string;
  unitId: string;
  yieldPercent: string;
};

export function CreateRecipeForm({
  ingredients,
  units,
}: {
  ingredients: Option[];
  units: Option[];
}) {
  const dict = useDictionary();
  const router = useRouter();
  const defaultUnitId = useMemo(
    () => units.find((unit) => unit.code === "g")?.id ?? units[0]?.id ?? "",
    [units],
  );
  const [name, setName] = useState("");
  const [portionCount, setPortionCount] = useState("1");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<LineState[]>([
    {
      ingredientId: ingredients[0]?.id ?? "",
      quantity: "1",
      unitId: defaultUnitId,
      yieldPercent: "100",
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await createRecipeAction({
      name,
      description: description || null,
      portionCount,
      lines,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/dashboard/recipes/${result.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="recipe-name">{dict.common.name}</Label>
          <Input
            id="recipe-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="portions">{dict.recipes.portions}</Label>
          <Input
            id="portions"
            inputMode="decimal"
            value={portionCount}
            onChange={(event) => setPortionCount(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">{dict.common.description}</Label>
        <Input
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">{dict.recipes.ingredientsHeading}</h2>
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
                  yieldPercent: "100",
                },
              ])
            }
          >
            {dict.recipes.addLine}
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
                setLines((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, ingredientId: event.target.value }
                      : item,
                  ),
                )
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
                setLines((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, quantity: event.target.value }
                      : item,
                  ),
                )
              }
              placeholder={dict.common.qty}
              required
            />
            <select
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
              value={line.unitId}
              onChange={(event) =>
                setLines((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, unitId: event.target.value }
                      : item,
                  ),
                )
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
              value={line.yieldPercent}
              onChange={(event) =>
                setLines((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, yieldPercent: event.target.value }
                      : item,
                  ),
                )
              }
              placeholder={dict.recipes.yieldPercent}
              required
            />
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        type="submit"
        disabled={pending || ingredients.length === 0}
      >
        {pending ? dict.common.saving : dict.recipes.create}
      </Button>
    </form>
  );
}