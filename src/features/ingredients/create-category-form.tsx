"use client";

import { useState } from "react";
import { createCategoryAction } from "@/features/ingredients/actions";
import { useDictionary } from "@/features/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateCategoryForm() {
  const dict = useDictionary();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await createCategoryAction({ name });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setName("");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor="category-name">{dict.ingredients.newCategory}</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Dairy"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? dict.common.saving : dict.ingredients.addCategory}
      </Button>
      {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
    </form>
  );
}