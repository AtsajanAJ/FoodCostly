import Link from "next/link";
import { Suspense } from "react";
import { DownloadCsvButton } from "@/features/reports/download-csv-button";
import { ReportFilters } from "@/features/reports/report-filters";
import { formatMessage } from "@/i18n/format";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { channelLabel } from "@/i18n/channel-label";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as reportService from "@/server/services/report-service";
import * as saleService from "@/server/services/sale-service";

export const instant = false;

export default async function MenuProfitabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; channelId?: string }>;
}) {
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const params = await searchParams;
  const [report, channels] = await Promise.all([
    reportService.getMenuProfitabilityReport(tenant, {
      fromDate: params.from,
      toDate: params.to,
      channelId: params.channelId,
    }),
    saleService.listChannelsForTenant(tenant),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/reports" className="underline underline-offset-4">
            {dict.reports.title}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.reports.menuProfit}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatMessage(dict.reports.grossMarginMeta, {
            currency: report.currency,
            timeZone: report.timeZone,
          })}
        </p>
      </div>

      <Suspense fallback={null}>
        <ReportFilters
          fromDate={report.fromDate}
          toDate={report.toDate}
          channelId={params.channelId}
          channels={channels.map((channel) => ({
            id: channel.id,
            name: channelLabel(dict, channel.code, channel.name),
          }))}
        />
      </Suspense>

      <p className="text-sm text-muted-foreground">{report.note}</p>

      <div className="flex justify-end">
        <DownloadCsvButton
          filename={`menu-profitability-${report.fromDate}-${report.toDate}.csv`}
          headers={[
            dict.sales.menuItem,
            dict.common.qty,
            dict.sales.revenue,
            dict.sales.foodCost,
            dict.reports.foodPercent,
            dict.reports.grossMargin,
          ]}
          rows={report.rows.map((row) => [
            row.name,
            row.quantity.toString(),
            row.revenue.toString(),
            row.foodCost.toString(),
            row.foodCostPercent.toString(),
            row.grossMargin.toString(),
          ])}
        />
      </div>

      {report.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{dict.reports.noSalesInRange}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">{dict.sales.menuItem}</th>
                <th className="px-3 py-2 font-medium">{dict.common.qty}</th>
                <th className="px-3 py-2 font-medium">{dict.sales.revenue}</th>
                <th className="px-3 py-2 font-medium">{dict.sales.foodCost}</th>
                <th className="px-3 py-2 font-medium">{dict.reports.foodPercent}</th>
                <th className="px-3 py-2 font-medium">{dict.reports.grossMargin}</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr
                  key={row.menuItemId}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.quantity.toString()}</td>
                  <td className="px-3 py-2">{row.revenue.toString()}</td>
                  <td className="px-3 py-2">{row.foodCost.toString()}</td>
                  <td className="px-3 py-2">
                    {row.foodCostPercent.toString()}%
                  </td>
                  <td className="px-3 py-2">{row.grossMargin.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}