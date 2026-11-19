import Link from "next/link";
import { Suspense } from "react";
import { DownloadCsvButton } from "@/features/reports/download-csv-button";
import { ReportFilters } from "@/features/reports/report-filters";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as reportService from "@/server/services/report-service";

export const metadata = { title: "Purchase report" };
export const instant = false;

export default async function PurchaseReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const tenant = await requireTenantContext();
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
            Reports
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Purchase report
        </h1>
        <p className="text-sm text-muted-foreground">
          Received purchases · {report.currency} · {report.timeZone}
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
          Total spend:{" "}
          <span className="font-semibold">{report.totalSpend.toString()}</span>
        </p>
        <DownloadCsvButton
          filename={`purchases-${report.fromDate}-${report.toDate}.csv`}
          headers={["Received at", "Supplier", "Lines", "Total cost"]}
          rows={report.rows.map((row) => [
            row.receivedAt.toISOString(),
            row.supplierName,
            row.lineCount,
            row.totalCost.toString(),
          ])}
        />
      </div>

      {report.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No purchases in range.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">Received</th>
                <th className="px-3 py-2 font-medium">Supplier</th>
                <th className="px-3 py-2 font-medium">Lines</th>
                <th className="px-3 py-2 font-medium">Total cost</th>
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
