import Link from "next/link";
import { CreateSaleForm } from "@/features/sales/create-sale-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as menuService from "@/server/services/menu-service";
import * as saleService from "@/server/services/sale-service";

export const instant = false;

export default async function NewSalePage() {
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const [channels, menuItems] = await Promise.all([
    saleService.listChannelsForTenant(tenant),
    menuService.listMenuItemsForTenant(tenant),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/sales" className="underline underline-offset-4">
            {dict.sales.title}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.sales.new}</h1>
        <p className="text-sm text-muted-foreground">{dict.sales.stockImmediate}</p>
      </div>

      {menuItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">{dict.sales.needMenu}</p>
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