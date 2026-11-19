"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type OrganizationItem = {
  id: string;
  name: string;
  slug: string;
};

export function OrganizationSwitcher({
  activeOrganizationId,
}: {
  activeOrganizationId: string;
}) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await authClient.organization.list();
      if (cancelled) return;

      if (result.error) {
        setError(result.error.message ?? "Unable to load organizations");
        return;
      }

      setOrganizations(
        (result.data ?? []).map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
        })),
      );
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function onChange(organizationId: string) {
    if (organizationId === activeOrganizationId) return;

    setPending(true);
    setError(null);

    const result = await authClient.organization.setActive({
      organizationId,
    });

    setPending(false);

    if (result.error) {
      setError(result.error.message ?? "Unable to switch organization");
      return;
    }

    router.refresh();
  }

  if (organizations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="org-switcher">
        Active organization
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          id="org-switcher"
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          value={activeOrganizationId}
          disabled={pending}
          onChange={(event) => void onChange(event.target.value)}
        >
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/onboarding" />}
          nativeButton={false}
        >
          New organization
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
