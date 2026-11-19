import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChannelFeeForm } from "@/features/sales/channel-fee-form";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as saleService from "@/server/services/sale-service";

export const metadata = { title: "Sales" };
export const instant = false;

export default async function SalesPage() {
  const tenant = await requireTenantContext();
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
              Dashboard
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground">
            {tenant.organizationName} · contribution margin is not net profit
          </p>
        </div>
        <Button
          render={<Link href="/dashboard/sales/new" />}
          nativeButton={false}
        >
          New sale
        </Button>
      </div>

      <ChannelFeeForm
        channels={channels.map((channel) => ({
          id: channel.id,
          name: channel.name,
          feeType: channel.feeType,
          feeValue: channel.feeValue.toString(),
        }))}
      />

      {sales.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sales yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Channel</th>
                <th className="px-3 py-2 font-medium">Gross</th>
                <th className="px-3 py-2 font-medium">Food cost</th>
                <th className="px-3 py-2 font-medium">Fee</th>
                <th className="px-3 py-2 font-medium">Contribution</th>
                <th className="px-3 py-2 font-medium">Status</th>
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
                  <td className="px-3 py-2">{sale.channel.name}</td>
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
