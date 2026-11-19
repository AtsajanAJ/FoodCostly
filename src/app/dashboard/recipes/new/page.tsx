import Link from "next/link";
import { CreateRecipeForm } from "@/features/recipes/create-recipe-form";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as ingredientService from "@/server/services/ingredient-service";
import * as unitRepository from "@/server/repositories/unit-repository";

export const metadata = { title: "New recipe" };
export const instant = false;

export default async function NewRecipePage() {
  const tenant = await requireTenantContext();
  const [ingredients, units] = await Promise.all([
    ingredientService.listIngredientsForTenant(tenant),
    unitRepository.listUnits(),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/recipes" className="underline underline-offset-4">
            Recipes
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">New recipe</h1>
        <p className="text-sm text-muted-foreground">
          Yield % is edible yield at recipe-item level (MVP assumption).
        </p>
      </div>

      {ingredients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add ingredients before creating a recipe.
        </p>
      ) : (
        <CreateRecipeForm
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
