import Link from "next/link";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as inventoryService from "@/server/services/inventory-service";

export const metadata = { title: "Inventory ledger" };
export const instant = false;

export default async function InventoryLedgerPage() {
  const tenant = await requireTenantContext();
  const entries = await inventoryService.listLedgerForTenant(tenant);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link
            href="/dashboard/inventory"
            className="underline underline-offset-4"
          >
            Inventory
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Inventory ledger
        </h1>
        <p className="text-sm text-muted-foreground">
          {tenant.organizationName} · immutable movement history
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No ledger entries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Ingredient</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Qty</th>
                <th className="px-3 py-2 font-medium">Unit cost</th>
                <th className="px-3 py-2 font-medium">Balance after</th>
                <th className="px-3 py-2 font-medium">Reason</th>
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
