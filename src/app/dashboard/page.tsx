import { Suspense } from "react";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { DashboardNav } from "@/features/dashboard/dashboard-nav";
import { OrganizationSwitcher } from "@/features/organizations/organization-switcher";
import { ContributionChart } from "@/features/reports/contribution-chart";
import { ReportFilters } from "@/features/reports/report-filters";
import { channelLabel } from "@/i18n/channel-label";
import { formatMessage } from "@/i18n/format";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as reportService from "@/server/services/report-service";
import * as saleService from "@/server/services/sale-service";

export const instant = false;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; channelId?: string }>;
}) {
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
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
    { label: dict.dashboard.netRevenue, value: Number(kpis.netRevenue.toString()) },
    { label: dict.dashboard.foodCost, value: Number(kpis.foodCostTotal.toString()) },
    { label: dict.dashboard.fees, value: Number(kpis.channelFeeAmount.toString()) },
    {
      label: dict.dashboard.contribution,
      value: Number(kpis.contributionMargin.toString()),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {dict.dashboard.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tenant.organizationName} · {kpis.currency} · {dict.dashboard.timezone}{" "}
            {kpis.timeZone}
          </p>
        </div>
        <SignOutButton />
      </div>

      <OrganizationSwitcher activeOrganizationId={tenant.organizationId} />

      <DashboardNav dict={dict} />

      <Suspense fallback={null}>
        <ReportFilters
          fromDate={kpis.fromDate}
          toDate={kpis.toDate}
          channelId={params.channelId}
          channels={channels.map((channel) => ({
            id: channel.id,
            name: channelLabel(dict, channel.code, channel.name),
          }))}
        />
      </Suspense>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label={dict.dashboard.netRevenue}
          value={kpis.netRevenue.toString()}
          hint={formatMessage(dict.dashboard.postedSales, {
            count: kpis.saleCount,
          })}
        />
        <Kpi
          label={dict.dashboard.foodCostPercent}
          value={`${kpis.foodCostPercent.toString()}%`}
          hint={`${dict.dashboard.foodCost} ${kpis.foodCostTotal.toString()}`}
        />
        <Kpi
          label={dict.dashboard.contributionMargin}
          value={kpis.contributionMargin.toString()}
          hint={dict.dashboard.contributionHint}
        />
        <Kpi
          label={dict.dashboard.inventoryValue}
          value={kpis.inventoryValue.toString()}
          hint={formatMessage(dict.dashboard.purchasesInRange, {
            amount: kpis.purchaseSpend.toString(),
          })}
        />
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium">
          {dict.dashboard.contributionBreakdown}
        </h2>
        <ContributionChart data={chartData} />
        <p className="text-sm text-muted-foreground">
          {dict.dashboard.contributionExplain}
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
