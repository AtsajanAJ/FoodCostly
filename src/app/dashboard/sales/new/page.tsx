import Link from "next/link";
import { CreateSaleForm } from "@/features/sales/create-sale-form";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as menuService from "@/server/services/menu-service";
import * as saleService from "@/server/services/sale-service";

export const metadata = { title: "New sale" };
export const instant = false;

export default async function NewSalePage() {
  const tenant = await requireTenantContext();
  const [channels, menuItems] = await Promise.all([
    saleService.listChannelsForTenant(tenant),
    menuService.listMenuItemsForTenant(tenant),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/sales" className="underline underline-offset-4">
            Sales
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">New sale</h1>
        <p className="text-sm text-muted-foreground">
          Stock is deducted immediately when the sale is saved.
        </p>
      </div>

      {menuItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Create a menu item with channel prices before posting a sale.
        </p>
      ) : (
        <CreateSaleForm
          channels={channels.map((channel) => ({
            id: channel.id,
            name: channel.name,
            code: channel.code,
          }))}
          menuItems={menuItems.map((item) => ({
            id: item.id,
            name: item.name,
            priceInStore: item.priceInStore?.toString() ?? null,
            priceDelivery: item.priceDelivery?.toString() ?? null,
          }))}
        />
      )}
    </div>
  );
}
