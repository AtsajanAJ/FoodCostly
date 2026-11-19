import Link from "next/link";
import { CreatePurchaseForm } from "@/features/purchases/create-purchase-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as ingredientService from "@/server/services/ingredient-service";
import * as supplierService from "@/server/services/supplier-service";
import * as unitRepository from "@/server/repositories/unit-repository";

export const instant = false;

export default async function NewPurchasePage() {
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const [suppliers, ingredients, units] = await Promise.all([
    supplierService.listSuppliersForTenant(tenant),
    ingredientService.listIngredientsForTenant(tenant),
    unitRepository.listUnits(),
  ]);

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
          {dict.purchases.new}
        </h1>
        <p className="text-sm text-muted-foreground">
          {dict.purchases.allocationNote}
        </p>
      </div>

      {suppliers.length === 0 || ingredients.length === 0 ? (
        <p className="text-sm text-muted-foreground">{dict.purchases.needData}</p>
      ) : (
        <CreatePurchaseForm
          suppliers={suppliers.map((supplier) => ({
            id: supplier.id,
            name: supplier.name,
          }))}
          ingredients={ingredients.map((ingredient) => ({
            id: ingredient.id,
            name: ingredient.name,
          }))}
          units={units.map((unit) => ({
            id: unit.id,
            name: unit.name,
            code: unit.code,
          }))}
        />
      )}
    </div>
  );
}