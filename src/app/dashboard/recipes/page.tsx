import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as recipeService from "@/server/services/recipe-service";

export const metadata = { title: "Recipes" };
export const instant = false;

export default async function RecipesPage() {
  const tenant = await requireTenantContext();
  const recipes = await recipeService.listRecipesForTenant(tenant);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard" className="underline underline-offset-4">
              Dashboard
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Recipes</h1>
          <p className="text-sm text-muted-foreground">
            {tenant.organizationName}
          </p>
        </div>
        <Button
          render={<Link href="/dashboard/recipes/new" />}
          nativeButton={false}
        >
          New recipe
        </Button>
      </div>

      {recipes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recipes yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Portions</th>
                <th className="px-3 py-2 font-medium">Items</th>
                <th className="px-3 py-2 font-medium">Latest version</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr
                  key={recipe.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/dashboard/recipes/${recipe.id}`}
                      className="underline underline-offset-4"
                    >
                      {recipe.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {recipe.portionCount.toString()}
                  </td>
                  <td className="px-3 py-2">{recipe.items.length}</td>
                  <td className="px-3 py-2">
                    {recipe.versions[0]
                      ? `v${recipe.versions[0].versionNumber} · ${recipe.versions[0].costPerPortion.toString()}/portion`
                      : "None"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
