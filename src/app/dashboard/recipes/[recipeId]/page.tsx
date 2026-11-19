import Link from "next/link";
import { notFound } from "next/navigation";
import { PublishVersionButton } from "@/features/recipes/publish-version-button";
import { formatMessage } from "@/i18n/format";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as recipeService from "@/server/services/recipe-service";

export const instant = false;

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const recipe = await recipeService.getRecipeForTenant(tenant, recipeId);

  if (!recipe) {
    notFound();
  }

  const liveCost = await recipeService.computeLiveRecipeCost(tenant, recipeId);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/recipes" className="underline underline-offset-4">
            {dict.recipes.title}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{recipe.name}</h1>
        <p className="text-sm text-muted-foreground">
          {recipe.portionCount.toString()} {dict.recipes.liveMwac}
        </p>
      </div>

      <section className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">{dict.recipes.liveTotal}</p>
          <p className="text-xl font-semibold">{liveCost.totalCost.toString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{dict.recipes.livePerPortion}</p>
          <p className="text-xl font-semibold">
            {liveCost.costPerPortion.toString()}
          </p>
        </div>
      </section>

      <PublishVersionButton recipeId={recipe.id} />

      <section className="space-y-3">
        <h2 className="text-sm font-medium">{dict.recipes.currentIngredients}</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">{dict.common.ingredient}</th>
                <th className="px-3 py-2 font-medium">{dict.common.qty}</th>
                <th className="px-3 py-2 font-medium">{dict.recipes.yieldPercent}</th>
                <th className="px-3 py-2 font-medium">{dict.recipes.requiredBase}</th>
                <th className="px-3 py-2 font-medium">{dict.recipes.unitCost}</th>
                <th className="px-3 py-2 font-medium">{dict.recipes.lineCost}</th>
              </tr>
            </thead>
            <tbody>
              {liveCost.lines.map((line, index) => {
                const item = recipe.items[index]!;
                return (
                  <tr
                    key={`${line.ingredientId}-${index}`}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-2">{item.ingredient.name}</td>
                    <td className="px-3 py-2">
                      {line.quantity.toString()} {item.unit.code}
                    </td>
                    <td className="px-3 py-2">{line.yieldPercent.toString()}</td>
                    <td className="px-3 py-2">
                      {line.requiredBaseQuantity.toString()}
                    </td>
                    <td className="px-3 py-2">{line.unitCost.toString()}</td>
                    <td className="px-3 py-2">{line.lineCost.toString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">{dict.recipes.versions}</h2>
        {recipe.versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dict.recipes.noVersions}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recipe.versions.map((version) => (
              <li
                key={version.id}
                className="rounded-lg border border-border px-3 py-2"
              >
                {formatMessage(dict.recipes.versionSummary, {
                  version: version.versionNumber,
                  total: version.totalCost.toString(),
                  perPortion: version.costPerPortion.toString(),
                  createdAt: version.createdAt.toISOString().slice(0, 19),
                })}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}