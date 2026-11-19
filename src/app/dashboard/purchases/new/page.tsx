import Link from "next/link";
import { CreatePurchaseForm } from "@/features/purchases/create-purchase-form";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as ingredientService from "@/server/services/ingredient-service";
import * as supplierService from "@/server/services/supplier-service";
import * as unitRepository from "@/server/repositories/unit-repository";

export const metadata = { title: "New purchase" };
export const instant = false;

export default async function NewPurchasePage() {
  const tenant = await requireTenantContext();
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
            Purchases
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">New purchase</h1>
        <p className="text-sm text-muted-foreground">
          Header discount/tax/shipping are allocated by line value share
          (MVP assumption).
        </p>
      </div>

      {suppliers.length === 0 || ingredients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add at least one supplier and one active ingredient before creating a
          purchase.
        </p>
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
