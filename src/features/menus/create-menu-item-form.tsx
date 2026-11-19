"use client";

import { useState } from "react";
import { createMenuItemAction } from "@/features/recipes/actions";
import { useDictionary } from "@/features/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RecipeOption = { id: string; name: string; hasVersion: boolean };

export function CreateMenuItemForm({ recipes }: { recipes: RecipeOption[] }) {
  const dict = useDictionary();
  const [name, setName] = useState("");
  const [recipeId, setRecipeId] = useState(recipes[0]?.id ?? "");
  const [priceInStore, setPriceInStore] = useState("");
  const [priceDelivery, setPriceDelivery] = useState("");
  const [pinLatestVersion, setPinLatestVersion] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    const result = await createMenuItemAction({
      name,
      recipeId,
      pinLatestVersion,
      priceInStore: priceInStore || null,
      priceDelivery: priceDelivery || null,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(dict.menus.created);
    setName("");
    setPriceInStore("");
    setPriceDelivery("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <h2 className="text-sm font-medium">{dict.menus.add}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="menu-name">{dict.common.name}</Label>
          <Input
            id="menu-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="recipe">{dict.menus.recipe}</Label>
          <select
            id="recipe"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
            value={recipeId}
            onChange={(event) => setRecipeId(event.target.value)}
            required
          >
            {recipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
                {recipe.hasVersion ? "" : ` ${dict.menus.noVersion}`}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="price-in-store">{dict.menus.priceInStore}</Label>
          <Input
            id="price-in-store"
            inputMode="decimal"
            value={priceInStore}
            onChange={(event) => setPriceInStore(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="price-delivery">{dict.menus.priceDelivery}</Label>
          <Input
            id="price-delivery"
            inputMode="decimal"
            value={priceDelivery}
            onChange={(event) => setPriceDelivery(event.target.value)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={pinLatestVersion}
          onChange={(event) => setPinLatestVersion(event.target.checked)}
        />
        {dict.menus.pinVersion}
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-muted-foreground">{success}</p> : null}
      <Button type="submit" disabled={pending || recipes.length === 0}>
        {pending ? dict.common.saving : dict.menus.createMenuItem}
      </Button>
    </form>
  );
}