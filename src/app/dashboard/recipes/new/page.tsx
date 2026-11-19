import Link from "next/link";
import { CreateRecipeForm } from "@/features/recipes/create-recipe-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as ingredientService from "@/server/services/ingredient-service";
import * as unitRepository from "@/server/repositories/unit-repository";

export const instant = false;

export default async function NewRecipePage() {
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const [ingredients, units] = await Promise.all([
    ingredientService.listIngredientsForTenant(tenant),
    unitRepository.listUnits(),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/recipes" className="underline underline-offset-4">
            {dict.recipes.title}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.recipes.new}</h1>
        <p className="text-sm text-muted-foreground">{dict.recipes.yieldNote}</p>
      </div>

      {ingredients.length === 0 ? (
        <p className="text-sm text-muted-foreground">{dict.recipes.needIngredients}</p>
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