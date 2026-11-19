import Link from "next/link";
import { DownloadCsvButton } from "@/features/reports/download-csv-button";
import { formatMessage } from "@/i18n/format";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as reportService from "@/server/services/report-service";

export const instant = false;

export default async function InventoryReportPage() {
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const report = await reportService.getInventoryValuationReport(tenant);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/reports" className="underline underline-offset-4">
            {dict.reports.title}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.reports.inventory}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatMessage(dict.reports.mwacBalancesMeta, {
            currency: report.currency,
            timeZone: report.timeZone,
          })}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          {dict.reports.totalValue}:{" "}
          <span className="font-semibold">{report.totalValue.toString()}</span>
        </p>
        <DownloadCsvButton
          filename="inventory-valuation.csv"
          headers={[
            dict.common.ingredient,
            dict.common.unit,
            dict.reports.qtyBaseHeader,
            dict.inventory.unitCost,
            dict.common.value,
            dict.reports.csvLowStock,
          ]}
          rows={report.rows.map((row) => [
            row.ingredientName,
            row.unitCode,
            row.quantityBase.toString(),
            row.unitCost.toString(),
            row.valueTotal.toString(),
            row.isLowStock ? dict.common.yes : "no",
          ])}
        />
      </div>

      {report.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {dict.reports.noStockBalances}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">{dict.common.ingredient}</th>
                <th className="px-3 py-2 font-medium">{dict.common.qty}</th>
                <th className="px-3 py-2 font-medium">{dict.inventory.unitCost}</th>
                <th className="px-3 py-2 font-medium">{dict.common.value}</th>
                <th className="px-3 py-2 font-medium">{dict.inventory.lowStock}</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr
                  key={row.ingredientId}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2">{row.ingredientName}</td>
                  <td className="px-3 py-2">
                    {row.quantityBase.toString()} {row.unitCode}
                  </td>
                  <td className="px-3 py-2">{row.unitCost.toString()}</td>
                  <td className="px-3 py-2">{row.valueTotal.toString()}</td>
                  <td className="px-3 py-2">
                    {row.isLowStock ? dict.common.yes : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}