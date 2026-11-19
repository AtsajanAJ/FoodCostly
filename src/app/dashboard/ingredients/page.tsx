import Link from "next/link";
import { CreateCategoryForm } from "@/features/ingredients/create-category-form";
import { CreateIngredientForm } from "@/features/ingredients/create-ingredient-form";
import { IngredientList } from "@/features/ingredients/ingredient-list";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as categoryService from "@/server/services/category-service";
import * as ingredientService from "@/server/services/ingredient-service";
import * as unitRepository from "@/server/repositories/unit-repository";

export const metadata = {
  title: "Ingredients",
};

export const instant = false;

export default async function IngredientsPage() {
  const tenant = await requireTenantContext();
  const [units, categories, ingredients] = await Promise.all([
    unitRepository.listUnits(),
    categoryService.listIngredientCategories(tenant),
    ingredientService.listIngredientsForTenant(tenant, {
      includeArchived: true,
    }),
  ]);

  const baseUnits = units.filter((unit) => unit.isBase);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard" className="underline underline-offset-4">
              Dashboard
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Ingredients</h1>
          <p className="text-sm text-muted-foreground">
            {tenant.organizationName} · each ingredient has exactly one base
            unit (g, ml, or pcs)
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Categories</h2>
        <CreateCategoryForm />
        {categories.length > 0 ? (
          <ul className="flex flex-wrap gap-2 text-sm">
            {categories.map((category) => (
              <li
                key={category.id}
                className="rounded-md border border-border px-2 py-1"
              >
                {category.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        )}
      </section>

      <CreateIngredientForm
        units={baseUnits.map((unit) => ({
          id: unit.id,
          name: unit.name,
          code: unit.code,
        }))}
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Ingredient list</h2>
        <IngredientList
          ingredients={ingredients.map((ingredient) => ({
            id: ingredient.id,
            name: ingredient.name,
            status: ingredient.status,
            minimumStock:
              ingredient.minimumStock?.toString() ?? null,
            baseUnit: {
              code: ingredient.baseUnit.code,
              name: ingredient.baseUnit.name,
            },
            category: ingredient.category
              ? { name: ingredient.category.name }
              : null,
          }))}
        />
      </section>

      <section className="space-y-2 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium">Available units</h2>
        <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          {units.map((unit) => (
            <li key={unit.id}>
              {unit.code} · {unit.name} · {unit.dimension}
              {unit.isBase ? " · base" : ` · ×${unit.toBaseFactor.toString()} to base`}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
