import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireTenantContext } from "@/server/permissions/tenant-context";

export const metadata = { title: "Reports" };
export const instant = false;

export default async function ReportsIndexPage() {
  await requireTenantContext();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="underline underline-offset-4">
            Dashboard
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Figures use the organization timezone. Contribution margin is never
          labeled as net profit.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          render={<Link href="/dashboard/reports/purchases" />}
          nativeButton={false}
        >
          Purchases
        </Button>
        <Button
          variant="outline"
          render={<Link href="/dashboard/reports/inventory" />}
          nativeButton={false}
        >
          Inventory valuation
        </Button>
        <Button
          variant="outline"
          render={<Link href="/dashboard/reports/menu-profitability" />}
          nativeButton={false}
        >
          Menu profitability
        </Button>
      </div>
    </div>
  );
}
