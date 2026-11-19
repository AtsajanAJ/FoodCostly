import Link from "next/link";
import {
  AdjustmentForm,
  StockCountForm,
  WasteForm,
} from "@/features/inventory/inventory-forms";
import { Button } from "@/components/ui/button";
import { formatMessage } from "@/i18n/format";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as ingredientService from "@/server/services/ingredient-service";
import * as inventoryService from "@/server/services/inventory-service";
import * as unitRepository from "@/server/repositories/unit-repository";

export const instant = false;

export default async function InventoryPage() {
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
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
  const lowStockHint =
    lowStockCount > 0
      ? ` · ${
          lowStockCount === 1
            ? dict.inventory.lowStockItem
            : formatMessage(dict.inventory.lowStockItems, {
                count: lowStockCount,
              })
        }`
      : "";

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
            {dict.inventory.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tenant.organizationName}
            {lowStockHint}
          </p>
        </div>
        <Button
          variant="outline"
          render={<Link href="/dashboard/inventory/ledger" />}
          nativeButton={false}
        >
          {dict.inventory.viewLedger}
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">{dict.inventory.stockOnHand}</h2>
        {stock.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {dict.inventory.emptyStockHint}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-3 py-2 font-medium">{dict.common.ingredient}</th>
                  <th className="px-3 py-2 font-medium">{dict.inventory.qtyBase}</th>
                  <th className="px-3 py-2 font-medium">{dict.common.value}</th>
                  <th className="px-3 py-2 font-medium">{dict.common.min}</th>
                  <th className="px-3 py-2 font-medium">{dict.common.status}</th>
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