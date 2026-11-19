import Link from "next/link";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as inventoryService from "@/server/services/inventory-service";

export const instant = false;

export default async function InventoryLedgerPage() {
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const entries = await inventoryService.listLedgerForTenant(tenant);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link
            href="/dashboard/inventory"
            className="underline underline-offset-4"
          >
            {dict.inventory.title}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.inventory.ledger}
        </h1>
        <p className="text-sm text-muted-foreground">
          {tenant.organizationName} · {dict.inventory.ledgerSubtitle}
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{dict.inventory.noLedger}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">{dict.common.when}</th>
                <th className="px-3 py-2 font-medium">{dict.common.ingredient}</th>
                <th className="px-3 py-2 font-medium">{dict.common.type}</th>
                <th className="px-3 py-2 font-medium">{dict.common.qty}</th>
                <th className="px-3 py-2 font-medium">{dict.inventory.unitCost}</th>
                <th className="px-3 py-2 font-medium">
                  {dict.inventory.balanceAfter}
                </th>
                <th className="px-3 py-2 font-medium">{dict.inventory.reason}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {entry.occurredAt.toISOString().slice(0, 19)}
                  </td>
                  <td className="px-3 py-2">{entry.ingredient.name}</td>
                  <td className="px-3 py-2">{entry.movementType}</td>
                  <td className="px-3 py-2">
                    {entry.quantityBase.toString()}{" "}
                    {entry.ingredient.baseUnit.code}
                  </td>
                  <td className="px-3 py-2">{entry.unitCost.toString()}</td>
                  <td className="px-3 py-2">
                    {entry.balanceQuantityAfter.toString()}
                  </td>
                  <td className="px-3 py-2">{entry.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}