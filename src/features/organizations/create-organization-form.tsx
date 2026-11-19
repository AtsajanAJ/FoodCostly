"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function CreateOrganizationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const slug = useMemo(() => slugify(name), [name]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    if (!slug) {
      setPending(false);
      setError("Enter a valid organization name");
      return;
    }

    const result = await authClient.organization.create({
      name,
      slug,
      currency: "THB",
      timezone: "Asia/Bangkok",
      locale: "en",
    } as {
      name: string;
      slug: string;
      currency: string;
      timezone: string;
      locale: string;
    });

    if (result.error) {
      setPending(false);
      setError(result.error.message ?? "Unable to create organization");
      return;
    }

    await authClient.organization.setActive({
      organizationId: result.data.id,
    });

    setPending(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="organization-name">Restaurant / business name</Label>
        <Input
          id="organization-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Harbor Bakery"
        />
        {slug ? (
          <p className="text-xs text-muted-foreground">Slug: {slug}</p>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending || !slug}>
        {pending ? "Creating…" : "Create organization"}
      </Button>
    </form>
  );
}
