import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelSaleButton } from "@/features/sales/cancel-sale-button";
import { formatMessage } from "@/i18n/format";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { channelLabel } from "@/i18n/channel-label";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as saleService from "@/server/services/sale-service";

export const instant = false;

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const { saleId } = await params;
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const sale = await saleService.getSaleForTenant(tenant, saleId);

  if (!sale) {
    notFound();
  }

  const channelName = channelLabel(dict, sale.channel.code, sale.channel.name);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/sales" className="underline underline-offset-4">
            {dict.sales.title}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {formatMessage(dict.sales.saleHeading, { channel: channelName })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {sale.soldAt.toISOString().slice(0, 19)} · {sale.status} ·{" "}
          {sale.currency}
        </p>
      </div>

      <section className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-sm text-muted-foreground">{dict.sales.grossRevenue}</p>
          <p className="text-xl font-semibold">{sale.grossRevenue.toString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{dict.sales.discount}</p>
          <p className="text-xl font-semibold">
            {sale.discountAmount.toString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{dict.sales.channelFee}</p>
          <p className="text-xl font-semibold">
            {sale.channelFeeAmount.toString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{dict.sales.foodCost}</p>
          <p className="text-xl font-semibold">{sale.foodCostTotal.toString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{dict.sales.packagingCost}</p>
          <p className="text-xl font-semibold">
            {sale.packagingCost.toString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            {dict.sales.contributionMargin}
          </p>
          <p className="text-xl font-semibold">
            {sale.contributionMargin.toString()}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">{dict.sales.lines}</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">{dict.common.item}</th>
                <th className="px-3 py-2 font-medium">{dict.common.qty}</th>
                <th className="px-3 py-2 font-medium">{dict.sales.unitPrice}</th>
                <th className="px-3 py-2 font-medium">{dict.sales.revenue}</th>
                <th className="px-3 py-2 font-medium">{dict.sales.foodCost}</th>
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
        <h2 className="text-sm font-medium">{dict.sales.stockConsumption}</h2>
        {sale.consumptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dict.sales.noConsumptions}</p>
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
          {dict.sales.cancelled}
          {sale.cancelReason ? `: ${sale.cancelReason}` : ""}
        </p>
      )}
    </div>
  );
}