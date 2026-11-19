import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as purchaseService from "@/server/services/purchase-service";

export const instant = false;

export default async function PurchasesPage() {
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const purchases = await purchaseService.listPurchasesForTenant(tenant);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard" className="underline underline-offset-4">
              {dict.common.dashboard}
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {dict.purchases.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tenant.organizationName}
          </p>
        </div>
        <Button
          render={<Link href="/dashboard/purchases/new" />}
          nativeButton={false}
        >
          {dict.purchases.new}
        </Button>
      </div>

      {purchases.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {dict.purchases.emptyDraftHint}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">{dict.common.date}</th>
                <th className="px-3 py-2 font-medium">{dict.purchases.supplier}</th>
                <th className="px-3 py-2 font-medium">{dict.common.invoice}</th>
                <th className="px-3 py-2 font-medium">{dict.common.status}</th>
                <th className="px-3 py-2 font-medium">{dict.common.lines}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/dashboard/purchases/${purchase.id}`}
                      className="underline underline-offset-4"
                    >
                      {purchase.purchasedAt.toISOString().slice(0, 10)}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{purchase.supplier.name}</td>
                  <td className="px-3 py-2">
                    {purchase.invoiceNumber ?? "—"}
                  </td>
                  <td className="px-3 py-2">{purchase.status}</td>
                  <td className="px-3 py-2">{purchase.lines.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}