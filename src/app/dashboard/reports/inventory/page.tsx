import Link from "next/link";
import { DownloadCsvButton } from "@/features/reports/download-csv-button";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as reportService from "@/server/services/report-service";

export const metadata = { title: "Inventory valuation" };
export const instant = false;

export default async function InventoryReportPage() {
  const tenant = await requireTenantContext();
  const report = await reportService.getInventoryValuationReport(tenant);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/reports" className="underline underline-offset-4">
            Reports
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Inventory valuation
        </h1>
        <p className="text-sm text-muted-foreground">
          Current MWAC balances · {report.currency} · {report.timeZone}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Total value:{" "}
          <span className="font-semibold">{report.totalValue.toString()}</span>
        </p>
        <DownloadCsvButton
          filename="inventory-valuation.csv"
          headers={[
            "Ingredient",
            "Unit",
            "Qty base",
            "Unit cost",
            "Value",
            "Low stock",
          ]}
          rows={report.rows.map((row) => [
            row.ingredientName,
            row.unitCode,
            row.quantityBase.toString(),
            row.unitCost.toString(),
            row.valueTotal.toString(),
            row.isLowStock ? "yes" : "no",
          ])}
        />
      </div>

      {report.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No stock balances.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">Ingredient</th>
                <th className="px-3 py-2 font-medium">Qty</th>
                <th className="px-3 py-2 font-medium">Unit cost</th>
                <th className="px-3 py-2 font-medium">Value</th>
                <th className="px-3 py-2 font-medium">Low stock</th>
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
                  <td className="px-3 py-2">{row.isLowStock ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
