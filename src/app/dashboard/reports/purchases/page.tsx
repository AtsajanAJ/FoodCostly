import Link from "next/link";
import { Suspense } from "react";
import { DownloadCsvButton } from "@/features/reports/download-csv-button";
import { ReportFilters } from "@/features/reports/report-filters";
import { formatMessage } from "@/i18n/format";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as reportService from "@/server/services/report-service";

export const instant = false;

export default async function PurchaseReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const params = await searchParams;
  const report = await reportService.getPurchaseReport(tenant, {
    fromDate: params.from,
    toDate: params.to,
  });

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/reports" className="underline underline-offset-4">
            {dict.reports.title}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.reports.purchaseReport}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatMessage(dict.reports.receivedPurchasesMeta, {
            currency: report.currency,
            timeZone: report.timeZone,
          })}
        </p>
      </div>

      <Suspense fallback={null}>
        <ReportFilters
          fromDate={report.fromDate}
          toDate={report.toDate}
          showChannel={false}
        />
      </Suspense>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          {dict.reports.totalSpend}:{" "}
          <span className="font-semibold">{report.totalSpend.toString()}</span>
        </p>
        <DownloadCsvButton
          filename={`purchases-${report.fromDate}-${report.toDate}.csv`}
          headers={[
            dict.reports.csvReceivedAt,
            dict.purchases.supplier,
            dict.common.lines,
            dict.reports.csvTotalCost,
          ]}
          rows={report.rows.map((row) => [
            row.receivedAt.toISOString(),
            row.supplierName,
            row.lineCount,
            row.totalCost.toString(),
          ])}
        />
      </div>

      {report.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {dict.reports.noPurchasesInRange}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">{dict.common.received}</th>
                <th className="px-3 py-2 font-medium">{dict.purchases.supplier}</th>
                <th className="px-3 py-2 font-medium">{dict.common.lines}</th>
                <th className="px-3 py-2 font-medium">{dict.common.totalCost}</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/dashboard/purchases/${row.id}`}
                      className="underline underline-offset-4"
                    >
                      {row.receivedAt.toISOString().slice(0, 19)}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{row.supplierName}</td>
                  <td className="px-3 py-2">{row.lineCount}</td>
                  <td className="px-3 py-2">{row.totalCost.toString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}