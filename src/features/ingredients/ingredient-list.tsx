"use client";

import { useState } from "react";
import { archiveIngredientAction } from "@/features/ingredients/actions";
import { useDictionary } from "@/features/i18n/i18n-provider";
import { Button } from "@/components/ui/button";

type IngredientRow = {
  id: string;
  name: string;
  status: string;
  minimumStock: string | null;
  baseUnit: { code: string; name: string };
  category: { name: string } | null;
};

export function IngredientList({ ingredients }: { ingredients: IngredientRow[] }) {
  const dict = useDictionary();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function onArchive(ingredientId: string) {
    setPendingId(ingredientId);
    setError(null);
    const result = await archiveIngredientAction({ ingredientId });
    setPendingId(null);
    if (!result.ok) {
      setError(result.error);
    }
  }

  if (ingredients.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{dict.ingredients.emptyHint}</p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">{dict.common.name}</th>
              <th className="px-3 py-2 font-medium">{dict.ingredients.baseUnit}</th>
              <th className="px-3 py-2 font-medium">{dict.ingredients.category}</th>
              <th className="px-3 py-2 font-medium">{dict.ingredients.minStock}</th>
              <th className="px-3 py-2 font-medium">{dict.common.status}</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ingredient) => (
              <tr key={ingredient.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">{ingredient.name}</td>
                <td className="px-3 py-2">{ingredient.baseUnit.code}</td>
                <td className="px-3 py-2">
                  {ingredient.category?.name ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {ingredient.minimumStock ?? "—"}
                </td>
                <td className="px-3 py-2">{ingredient.status}</td>
                <td className="px-3 py-2 text-right">
                  {ingredient.status === "ACTIVE" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pendingId === ingredient.id}
                      onClick={() => void onArchive(ingredient.id)}
                    >
                      {dict.ingredients.archive}
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}