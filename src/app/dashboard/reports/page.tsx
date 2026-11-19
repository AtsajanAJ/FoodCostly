import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";

export const instant = false;

export default async function ReportsIndexPage() {
  await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="underline underline-offset-4">
            {dict.common.dashboard}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.reports.title}
        </h1>
        <p className="text-sm text-muted-foreground">{dict.reports.hint}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          render={<Link href="/dashboard/reports/purchases" />}
          nativeButton={false}
        >
          {dict.nav.purchases}
        </Button>
        <Button
          variant="outline"
          render={<Link href="/dashboard/reports/inventory" />}
          nativeButton={false}
        >
          {dict.reports.inventory}
        </Button>
        <Button
          variant="outline"
          render={<Link href="/dashboard/reports/menu-profitability" />}
          nativeButton={false}
        >
          {dict.reports.menuProfit}
        </Button>
      </div>
    </div>
  );
}
