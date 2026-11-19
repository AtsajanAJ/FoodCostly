import Link from "next/link";
import { CreateMenuItemForm } from "@/features/menus/create-menu-item-form";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as menuService from "@/server/services/menu-service";
import * as recipeService from "@/server/services/recipe-service";

export const metadata = { title: "Menus" };
export const instant = false;

export default async function MenusPage() {
  const tenant = await requireTenantContext();
  const [menuItems, recipes] = await Promise.all([
    menuService.listMenuItemsForTenant(tenant),
    recipeService.listRecipesForTenant(tenant),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="underline underline-offset-4">
            Dashboard
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Menu items</h1>
        <p className="text-sm text-muted-foreground">
          {tenant.organizationName} · channel prices for in-store and delivery
        </p>
      </div>

      <CreateMenuItemForm
        recipes={recipes.map((recipe) => ({
          id: recipe.id,
          name: recipe.name,
          hasVersion: recipe.versions.length > 0,
        }))}
      />

      {menuItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">No menu items yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Recipe</th>
                <th className="px-3 py-2 font-medium">Pinned cost</th>
                <th className="px-3 py-2 font-medium">In-store</th>
                <th className="px-3 py-2 font-medium">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item) => {
                const pinned = item.recipeVersion;
                const latest = item.recipe.versions[0];
                const cost =
                  pinned?.costPerPortion.toString() ??
                  latest?.costPerPortion.toString() ??
                  "—";
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2">{item.recipe.name}</td>
                    <td className="px-3 py-2">{cost}</td>
                    <td className="px-3 py-2">
                      {item.priceInStore?.toString() ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {item.priceDelivery?.toString() ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
