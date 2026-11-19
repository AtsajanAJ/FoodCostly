"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/features/i18n/i18n-provider";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const dict = useDictionary();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    await authClient.signOut();
    setPending(false);
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => void onSignOut()}
    >
      {pending ? dict.auth.signingOut : dict.auth.signOut}
    </Button>
  );
}
