import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/auth/session";

export const instant = false;

export default async function HomePage() {
  const session = await getSession();
  const appHref = session
    ? session.session.activeOrganizationId
      ? "/dashboard"
      : "/onboarding"
    : "/demo";

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">FoodCostly</p>
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Restaurant cost and inventory, clearly tracked.
        </h1>
        <p className="max-w-lg text-base leading-7 text-muted-foreground">
          Record purchases, manage stock, cost recipes, and understand
          contribution margin across sales channels. Try the demo first — no
          account required.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button render={<Link href={appHref} />} nativeButton={false} size="lg">
          {session ? "Go to dashboard" : "Try demo"}
        </Button>
        {!session ? (
          <>
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/sign-up" />}
              nativeButton={false}
            >
              Create account
            </Button>
            <Button
              variant="ghost"
              size="lg"
              render={<Link href="/sign-in" />}
              nativeButton={false}
            >
              Sign in
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
