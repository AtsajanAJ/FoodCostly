import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { getSession } from "@/server/auth/session";

export const instant = false;

export default async function HomePage() {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  const dict = await getDictionary(locale);
  const appHref = session
    ? session.session.activeOrganizationId
      ? "/dashboard"
      : "/onboarding"
    : "/demo";

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{dict.brand}</p>
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {dict.home.headline}
        </h1>
        <p className="max-w-lg text-base leading-7 text-muted-foreground">
          {dict.home.body}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button render={<Link href={appHref} />} nativeButton={false} size="lg">
          {session ? dict.home.goDashboard : dict.home.tryDemo}
        </Button>
        {!session ? (
          <>
            <Button
              variant="outline"
              size="lg"
              render={<Link href="/sign-up" />}
              nativeButton={false}
            >
              {dict.home.createAccount}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              render={<Link href="/sign-in" />}
              nativeButton={false}
            >
              {dict.home.signIn}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
