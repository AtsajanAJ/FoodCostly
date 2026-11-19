import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelSaleButton } from "@/features/sales/cancel-sale-button";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as saleService from "@/server/services/sale-service";

export const metadata = { title: "Sale detail" };
export const instant = false;

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const { saleId } = await params;
  const tenant = await requireTenantContext();
  const sale = await saleService.getSaleForTenant(tenant, saleId);

  if (!sale) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/sales" className="underline underline-offset-4">
            Sales
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sale · {sale.channel.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {sale.soldAt.toISOString().slice(0, 19)} · {sale.status} ·{" "}
          {sale.currency}
        </p>
      </div>

      <section className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">Gross revenue</p>
          <p className="text-xl font-semibold">{sale.grossRevenue.toString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Discount</p>
          <p className="text-xl font-semibold">
            {sale.discountAmount.toString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Channel fee</p>
          <p className="text-xl font-semibold">
            {sale.channelFeeAmount.toString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Food cost</p>
          <p className="text-xl font-semibold">{sale.foodCostTotal.toString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Packaging</p>
          <p className="text-xl font-semibold">
            {sale.packagingCost.toString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Contribution margin</p>
          <p className="text-xl font-semibold">
            {sale.contributionMargin.toString()}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Lines</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Qty</th>
                <th className="px-3 py-2 font-medium">Unit price</th>
                <th className="px-3 py-2 font-medium">Revenue</th>
                <th className="px-3 py-2 font-medium">Food cost</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2">{item.menuItemNameSnapshot}</td>
                  <td className="px-3 py-2">{item.quantity.toString()}</td>
                  <td className="px-3 py-2">
                    {item.unitPriceSnapshot.toString()}
                  </td>
                  <td className="px-3 py-2">{item.lineRevenue.toString()}</td>
                  <td className="px-3 py-2">
                    {item.foodCostSnapshot.toString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Stock consumption</h2>
        {sale.consumptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No consumptions.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {sale.consumptions.map((row) => (
              <li key={row.id}>
                {row.ingredient.name}: {row.quantityBase.toString()} @{" "}
                {row.unitCostSnapshot.toString()} ={" "}
                {row.totalCostSnapshot.toString()}
              </li>
            ))}
          </ul>
        )}
      </section>

      {sale.status === "POSTED" ? (
        <CancelSaleButton saleId={sale.id} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Cancelled{sale.cancelReason ? `: ${sale.cancelReason}` : ""}
        </p>
      )}
    </div>
  );
}
