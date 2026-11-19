import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChannelFeeForm } from "@/features/sales/channel-fee-form";
import { channelLabel } from "@/i18n/channel-label";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as saleService from "@/server/services/sale-service";

export const instant = false;

export default async function SalesPage() {
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const [sales, channels] = await Promise.all([
    saleService.listSalesForTenant(tenant),
    saleService.listChannelsForTenant(tenant),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard" className="underline underline-offset-4">
              {dict.common.dashboard}
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {dict.sales.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tenant.organizationName} · {dict.sales.contributionNote}
          </p>
        </div>
        <Button
          render={<Link href="/dashboard/sales/new" />}
          nativeButton={false}
        >
          {dict.sales.new}
        </Button>
      </div>

      <ChannelFeeForm
        channels={channels.map((channel) => ({
          id: channel.id,
          name: channelLabel(dict, channel.code, channel.name),
          feeType: channel.feeType,
          feeValue: channel.feeValue.toString(),
        }))}
      />

      {sales.length === 0 ? (
        <p className="text-sm text-muted-foreground">{dict.sales.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">{dict.common.when}</th>
                <th className="px-3 py-2 font-medium">{dict.common.channel}</th>
                <th className="px-3 py-2 font-medium">{dict.sales.gross}</th>
                <th className="px-3 py-2 font-medium">{dict.sales.foodCost}</th>
                <th className="px-3 py-2 font-medium">{dict.sales.fee}</th>
                <th className="px-3 py-2 font-medium">
                  {dict.sales.contribution}
                </th>
                <th className="px-3 py-2 font-medium">{dict.common.status}</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/dashboard/sales/${sale.id}`}
                      className="underline underline-offset-4"
                    >
                      {sale.soldAt.toISOString().slice(0, 19)}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {channelLabel(dict, sale.channel.code, sale.channel.name)}
                  </td>
                  <td className="px-3 py-2">{sale.grossRevenue.toString()}</td>
                  <td className="px-3 py-2">{sale.foodCostTotal.toString()}</td>
                  <td className="px-3 py-2">
                    {sale.channelFeeAmount.toString()}
                  </td>
                  <td className="px-3 py-2">
                    {sale.contributionMargin.toString()}
                  </td>
                  <td className="px-3 py-2">{sale.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
