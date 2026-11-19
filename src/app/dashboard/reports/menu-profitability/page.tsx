import Link from "next/link";
import { Suspense } from "react";
import { DownloadCsvButton } from "@/features/reports/download-csv-button";
import { ReportFilters } from "@/features/reports/report-filters";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as reportService from "@/server/services/report-service";
import * as saleService from "@/server/services/sale-service";

export const metadata = { title: "Menu profitability" };
export const instant = false;

export default async function MenuProfitabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; channelId?: string }>;
}) {
  const tenant = await requireTenantContext();
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
            Reports
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Menu profitability
        </h1>
        <p className="text-sm text-muted-foreground">
          Gross margin = revenue − food cost · {report.currency} ·{" "}
          {report.timeZone}
        </p>
      </div>

      <Suspense fallback={null}>
        <ReportFilters
          fromDate={report.fromDate}
          toDate={report.toDate}
          channelId={params.channelId}
          channels={channels.map((channel) => ({
            id: channel.id,
            name: channel.name,
          }))}
        />
      </Suspense>

      <p className="text-sm text-muted-foreground">{report.note}</p>

      <div className="flex justify-end">
        <DownloadCsvButton
          filename={`menu-profitability-${report.fromDate}-${report.toDate}.csv`}
          headers={[
            "Menu item",
            "Qty",
            "Revenue",
            "Food cost",
            "Food cost %",
            "Gross margin",
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
        <p className="text-sm text-muted-foreground">No sales in range.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">Menu item</th>
                <th className="px-3 py-2 font-medium">Qty</th>
                <th className="px-3 py-2 font-medium">Revenue</th>
                <th className="px-3 py-2 font-medium">Food cost</th>
                <th className="px-3 py-2 font-medium">Food %</th>
                <th className="px-3 py-2 font-medium">Gross margin</th>
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
