import Link from "next/link";
import {
  AdjustmentForm,
  StockCountForm,
  WasteForm,
} from "@/features/inventory/inventory-forms";
import { Button } from "@/components/ui/button";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as ingredientService from "@/server/services/ingredient-service";
import * as inventoryService from "@/server/services/inventory-service";
import * as unitRepository from "@/server/repositories/unit-repository";

export const metadata = { title: "Inventory" };
export const instant = false;

export default async function InventoryPage() {
  const tenant = await requireTenantContext();
  const [stock, ingredients, units] = await Promise.all([
    inventoryService.listStockForTenant(tenant),
    ingredientService.listIngredientsForTenant(tenant),
    unitRepository.listUnits(),
  ]);

  const ingredientOptions = ingredients.map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
  }));
  const unitOptions = units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    code: unit.code,
  }));

  const lowStockCount = stock.filter((row) => row.isLowStock).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard" className="underline underline-offset-4">
              Dashboard
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            {tenant.organizationName}
            {lowStockCount > 0
              ? ` · ${lowStockCount} low-stock item${lowStockCount === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        <Button
          variant="outline"
          render={<Link href="/dashboard/inventory/ledger" />}
          nativeButton={false}
        >
          View ledger
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Stock on hand</h2>
        {stock.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No stock balances yet. Receive a purchase to create the first
            ledger entries.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-3 py-2 font-medium">Ingredient</th>
                  <th className="px-3 py-2 font-medium">Qty (base)</th>
                  <th className="px-3 py-2 font-medium">Value</th>
                  <th className="px-3 py-2 font-medium">Min</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-2">{row.ingredient.name}</td>
                    <td className="px-3 py-2">
                      {row.quantityBase.toString()} {row.ingredient.baseUnit.code}
                    </td>
                    <td className="px-3 py-2">{row.valueTotal.toString()}</td>
                    <td className="px-3 py-2">
                      {row.ingredient.minimumStock?.toString() ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {row.isOutOfStock
                        ? "OUT"
                        : row.isLowStock
                          ? "LOW"
                          : "OK"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <WasteForm ingredients={ingredientOptions} units={unitOptions} />
        <AdjustmentForm ingredients={ingredientOptions} units={unitOptions} />
        <StockCountForm ingredients={ingredientOptions} units={unitOptions} />
      </div>
    </div>
  );
}
