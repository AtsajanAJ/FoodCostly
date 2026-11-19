import Link from "next/link";
import { CreateMenuItemForm } from "@/features/menus/create-menu-item-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as menuService from "@/server/services/menu-service";
import * as recipeService from "@/server/services/recipe-service";

export const instant = false;

export default async function MenusPage() {
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const [menuItems, recipes] = await Promise.all([
    menuService.listMenuItemsForTenant(tenant),
    recipeService.listRecipesForTenant(tenant),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="underline underline-offset-4">
            {dict.common.dashboard}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.menus.title}</h1>
        <p className="text-sm text-muted-foreground">
          {tenant.organizationName} · {dict.menus.channelNote}
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
        <p className="text-sm text-muted-foreground">{dict.menus.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">{dict.common.name}</th>
                <th className="px-3 py-2 font-medium">{dict.menus.recipe}</th>
                <th className="px-3 py-2 font-medium">{dict.menus.pinnedCost}</th>
                <th className="px-3 py-2 font-medium">{dict.menus.priceInStore}</th>
                <th className="px-3 py-2 font-medium">{dict.menus.priceDelivery}</th>
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