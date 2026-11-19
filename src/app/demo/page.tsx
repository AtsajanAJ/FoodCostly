import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";

export const instant = false;

export default async function DemoPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
        <p className="font-medium">{dict.demo.badge}</p>
        <p className="mt-1 text-muted-foreground">{dict.demo.badgeBody}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" render={<Link href="/sign-up" />} nativeButton={false}>
            {dict.home.createAccount}
          </Button>
          <Button
            size="sm"
            variant="outline"
            render={<Link href="/sign-in" />}
            nativeButton={false}
          >
            {dict.home.signIn}
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.demo.heading}
        </h1>
        <p className="text-sm text-muted-foreground">
          {dict.demo.sampleRestaurant}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <DemoStat
          label={dict.demo.foodCost}
          value="31.4%"
          hint={dict.demo.foodCostHint}
        />
        <DemoStat
          label={dict.demo.stockValue}
          value="฿12,480"
          hint={dict.demo.stockValueHint}
        />
        <DemoStat
          label={dict.demo.contribution}
          value="฿48,220"
          hint={dict.demo.contributionHint}
        />
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium">{dict.demo.afterSignup}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>{dict.demo.after1}</li>
          <li>{dict.demo.after2}</li>
          <li>{dict.demo.after3}</li>
          <li>{dict.demo.after4}</li>
        </ul>
      </section>
    </div>
  );
}

function DemoStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
