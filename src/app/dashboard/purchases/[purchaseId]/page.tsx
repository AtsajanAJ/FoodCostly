import Link from "next/link";
import { notFound } from "next/navigation";
import { Decimal } from "decimal.js";
import { ReceivePurchaseButton } from "@/features/purchases/receive-purchase-button";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as purchaseService from "@/server/services/purchase-service";

export const instant = false;

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) {
  const { purchaseId } = await params;
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const purchase = await purchaseService.getPurchaseForTenant(
    tenant,
    purchaseId,
  );

  if (!purchase) {
    notFound();
  }

  const linesTotal = purchase.lines.reduce(
    (sum, line) => sum.plus(line.allocatedCost.toString()),
    new Decimal(0),
  );

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link
            href="/dashboard/purchases"
            className="underline underline-offset-4"
          >
            {dict.purchases.title}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.purchases.detail} {purchase.purchasedAt.toISOString().slice(0, 10)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {purchase.supplier.name} · {purchase.status} · {purchase.currency}
        </p>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">{dict.common.invoice}</dt>
          <dd className="font-medium">{purchase.invoiceNumber ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {dict.purchases.discountTaxShipping}
          </dt>
          <dd className="font-medium">
            {purchase.discountAmount.toString()} /{" "}
            {purchase.taxAmount.toString()} /{" "}
            {purchase.shippingAmount.toString()}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{dict.purchases.allocatedTotal}</dt>
          <dd className="font-medium">{linesTotal.toFixed(6)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {dict.purchases.receivedAtLabel}
          </dt>
          <dd className="font-medium">
            {purchase.receivedAt
              ? purchase.receivedAt.toISOString()
              : dict.purchases.notReceived}
          </dd>
        </div>
      </dl>

      {purchase.status === "DRAFT" ? (
        <ReceivePurchaseButton purchaseId={purchase.id} />
      ) : (
        <p className="text-sm text-muted-foreground">
          {dict.purchases.immutableNote}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">{dict.common.ingredient}</th>
              <th className="px-3 py-2 font-medium">{dict.common.qty}</th>
              <th className="px-3 py-2 font-medium">{dict.common.unit}</th>
              <th className="px-3 py-2 font-medium">{dict.purchases.unitPrice}</th>
              <th className="px-3 py-2 font-medium">{dict.purchases.baseQty}</th>
              <th className="px-3 py-2 font-medium">
                {dict.purchases.allocatedCost}
              </th>
              <th className="px-3 py-2 font-medium">
                {dict.purchases.baseUnitCost}
              </th>
            </tr>
          </thead>
          <tbody>
            {purchase.lines.map((line) => (
              <tr
                key={line.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-3 py-2">{line.ingredient.name}</td>
                <td className="px-3 py-2">{line.quantity.toString()}</td>
                <td className="px-3 py-2">{line.unit.code}</td>
                <td className="px-3 py-2">{line.unitPrice.toString()}</td>
                <td className="px-3 py-2">{line.baseQuantity.toString()}</td>
                <td className="px-3 py-2">{line.allocatedCost.toString()}</td>
                <td className="px-3 py-2">
                  {line.baseUnitCost?.toString() ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}