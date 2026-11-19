import Link from "next/link";
import { Suspense } from "react";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { OrganizationSwitcher } from "@/features/organizations/organization-switcher";
import { ContributionChart } from "@/features/reports/contribution-chart";
import { ReportFilters } from "@/features/reports/report-filters";
import { Button } from "@/components/ui/button";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as reportService from "@/server/services/report-service";
import * as saleService from "@/server/services/sale-service";

export const metadata = {
  title: "Dashboard",
};

export const instant = false;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; channelId?: string }>;
}) {
  const tenant = await requireTenantContext();
  const params = await searchParams;
  const [kpis, channels] = await Promise.all([
    reportService.getDashboardKpis(tenant, {
      fromDate: params.from,
      toDate: params.to,
      channelId: params.channelId,
    }),
    saleService.listChannelsForTenant(tenant),
  ]);

  const chartData = [
    { label: "Net revenue", value: Number(kpis.netRevenue.toString()) },
    { label: "Food cost", value: Number(kpis.foodCostTotal.toString()) },
    { label: "Fees", value: Number(kpis.channelFeeAmount.toString()) },
    {
      label: "Contribution",
      value: Number(kpis.contributionMargin.toString()),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {tenant.organizationName} · {kpis.currency} · timezone{" "}
            {kpis.timeZone}
          </p>
        </div>
        <SignOutButton />
      </div>

      <OrganizationSwitcher activeOrganizationId={tenant.organizationId} />

      <div className="flex flex-wrap gap-2">
        <Button
          render={<Link href="/dashboard/ingredients" />}
          nativeButton={false}
        >
          Ingredients
        </Button>
        <Button
          variant="outline"
          render={<Link href="/dashboard/suppliers" />}
          nativeButton={false}
        >
          Suppliers
        </Button>
        <Button
          variant="outline"
          render={<Link href="/dashboard/purchases" />}
          nativeButton={false}
        >
          Purchases
        </Button>
        <Button
          variant="outline"
          render={<Link href="/dashboard/inventory" />}
          nativeButton={false}
        >
          Inventory
        </Button>
        <Button
          variant="outline"
          render={<Link href="/dashboard/recipes" />}
          nativeButton={false}
        >
          Recipes
        </Button>
        <Button
          variant="outline"
          render={<Link href="/dashboard/menus" />}
          nativeButton={false}
        >
          Menus
        </Button>
        <Button
          variant="outline"
          render={<Link href="/dashboard/sales" />}
          nativeButton={false}
        >
          Sales
        </Button>
        <Button
          variant="outline"
          render={<Link href="/dashboard/reports" />}
          nativeButton={false}
        >
          Reports
        </Button>
      </div>

      <Suspense fallback={null}>
        <ReportFilters
          fromDate={kpis.fromDate}
          toDate={kpis.toDate}
          channelId={params.channelId}
          channels={channels.map((channel) => ({
            id: channel.id,
            name: channel.name,
          }))}
        />
      </Suspense>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Net revenue"
          value={kpis.netRevenue.toString()}
          hint={`${kpis.saleCount} posted sales`}
        />
        <Kpi
          label="Food cost %"
          value={`${kpis.foodCostPercent.toString()}%`}
          hint={`Food cost ${kpis.foodCostTotal.toString()}`}
        />
        <Kpi
          label="Contribution margin"
          value={kpis.contributionMargin.toString()}
          hint="Not net profit — opex excluded"
        />
        <Kpi
          label="Inventory value"
          value={kpis.inventoryValue.toString()}
          hint={`Purchases in range ${kpis.purchaseSpend.toString()}`}
        />
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium">Contribution breakdown</h2>
        <ContributionChart data={chartData} />
        <p className="text-sm text-muted-foreground">
          Contribution margin = net revenue − food cost − packaging − channel
          fees. This is not net profit.
        </p>
      </section>
    </div>
  );
}

function Kpi({
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
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
