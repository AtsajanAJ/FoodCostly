"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { publishRecipeVersionAction } from "@/features/recipes/actions";
import { Button } from "@/components/ui/button";

export function PublishVersionButton({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPublish() {
    setPending(true);
    setError(null);
    const result = await publishRecipeVersionAction({
      recipeId,
      notes: "Published cost snapshot",
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button type="button" disabled={pending} onClick={() => void onPublish()}>
        {pending ? "Publishing…" : "Publish cost version"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
