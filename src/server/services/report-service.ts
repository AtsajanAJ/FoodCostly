import { Decimal } from "decimal.js";
import { prisma } from "@/lib/db";
import type { TenantContext } from "@/server/permissions/tenant-context";
import {
  percentOf,
  resolveReportWindow,
} from "@/server/services/report-dates";

type ReportFilters = {
  fromDate?: string | null;
  toDate?: string | null;
  channelId?: string | null;
};

async function orgTimeZone(organizationId: string) {
  const org = await prisma.organization.findFirstOrThrow({
    where: { id: organizationId },
    select: { timezone: true, currency: true },
  });
  return {
    timeZone: org.timezone || "Asia/Bangkok",
    currency: org.currency || "THB",
  };
}

export async function getDashboardKpis(
  tenant: TenantContext,
  filters: ReportFilters = {},
) {
  const { timeZone, currency } = await orgTimeZone(tenant.organizationId);
  const window = resolveReportWindow({
    timeZone,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  const channelId = filters.channelId?.trim() || undefined;

  const [sales, purchases, stock] = await Promise.all([
    prisma.sale.findMany({
      where: {
        organizationId: tenant.organizationId,
        status: "POSTED",
        soldAt: { gte: window.start, lt: window.endExclusive },
        ...(channelId ? { channelId } : {}),
      },
      select: {
        grossRevenue: true,
        discountAmount: true,
        foodCostTotal: true,
        packagingCost: true,
        channelFeeAmount: true,
        contributionMargin: true,
      },
    }),
    prisma.purchase.findMany({
      where: {
        organizationId: tenant.organizationId,
        status: "RECEIVED",
        receivedAt: { gte: window.start, lt: window.endExclusive },
      },
      select: {
        lines: { select: { allocatedCost: true } },
      },
    }),
    prisma.stockBalance.findMany({
      where: { organizationId: tenant.organizationId },
      select: { valueTotal: true, quantityBase: true },
    }),
  ]);

  const grossRevenue = sales
    .reduce(
      (sum, sale) => sum.plus(sale.grossRevenue.toString()),
      new Decimal(0),
    )
    .toDecimalPlaces(6);
  const discountAmount = sales
    .reduce(
      (sum, sale) => sum.plus(sale.discountAmount.toString()),
      new Decimal(0),
    )
    .toDecimalPlaces(6);
  const netRevenue = grossRevenue.minus(discountAmount).toDecimalPlaces(6);
  const foodCostTotal = sales
    .reduce(
      (sum, sale) => sum.plus(sale.foodCostTotal.toString()),
      new Decimal(0),
    )
    .toDecimalPlaces(6);
  const packagingCost = sales
    .reduce(
      (sum, sale) => sum.plus(sale.packagingCost.toString()),
      new Decimal(0),
    )
    .toDecimalPlaces(6);
  const channelFeeAmount = sales
    .reduce(
      (sum, sale) => sum.plus(sale.channelFeeAmount.toString()),
      new Decimal(0),
    )
    .toDecimalPlaces(6);
  const contributionMargin = sales
    .reduce(
      (sum, sale) => sum.plus(sale.contributionMargin.toString()),
      new Decimal(0),
    )
    .toDecimalPlaces(6);

  const purchaseSpend = purchases
    .reduce(
      (sum, purchase) =>
        sum.plus(
          purchase.lines.reduce(
            (lineSum, line) => lineSum.plus(line.allocatedCost.toString()),
            new Decimal(0),
          ),
        ),
      new Decimal(0),
    )
    .toDecimalPlaces(6);

  const inventoryValue = stock
    .reduce(
      (sum, row) => sum.plus(row.valueTotal.toString()),
      new Decimal(0),
    )
    .toDecimalPlaces(6);

  return {
    currency,
    timeZone,
    fromDate: window.fromDate,
    toDate: window.toDate,
    saleCount: sales.length,
    grossRevenue,
    discountAmount,
    netRevenue,
    foodCostTotal,
    foodCostPercent: percentOf(foodCostTotal, netRevenue),
    packagingCost,
    channelFeeAmount,
    contributionMargin,
    /** Explicitly not net profit — opex excluded. */
    marginLabel: "contribution_margin" as const,
    purchaseSpend,
    inventoryValue,
  };
}

export async function getPurchaseReport(
  tenant: TenantContext,
  filters: ReportFilters = {},
) {
  const { timeZone, currency } = await orgTimeZone(tenant.organizationId);
  const window = resolveReportWindow({
    timeZone,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });

  const purchases = await prisma.purchase.findMany({
    where: {
      organizationId: tenant.organizationId,
      status: "RECEIVED",
      receivedAt: { gte: window.start, lt: window.endExclusive },
    },
    include: {
      supplier: true,
      lines: true,
    },
    orderBy: { receivedAt: "desc" },
  });

  const rows = purchases.map((purchase) => {
    const totalCost = purchase.lines
      .reduce(
        (sum, line) => sum.plus(line.allocatedCost.toString()),
        new Decimal(0),
      )
      .toDecimalPlaces(6);
    return {
      id: purchase.id,
      supplierName: purchase.supplier.name,
      receivedAt: purchase.receivedAt!,
      lineCount: purchase.lines.length,
      totalCost,
    };
  });

  const totalSpend = rows
    .reduce((sum, row) => sum.plus(row.totalCost), new Decimal(0))
    .toDecimalPlaces(6);

  return {
    currency,
    timeZone,
    fromDate: window.fromDate,
    toDate: window.toDate,
    totalSpend,
    rows,
  };
}

export async function getInventoryValuationReport(tenant: TenantContext) {
  const { currency, timeZone } = await orgTimeZone(tenant.organizationId);

  const balances = await prisma.stockBalance.findMany({
    where: { organizationId: tenant.organizationId },
    include: {
      ingredient: {
        include: { baseUnit: true },
      },
    },
    orderBy: { ingredient: { name: "asc" } },
  });

  const totalValue = balances
    .reduce(
      (sum, row) => sum.plus(row.valueTotal.toString()),
      new Decimal(0),
    )
    .toDecimalPlaces(6);

  return {
    currency,
    timeZone,
    totalValue,
    rows: balances.map((row) => {
      const qty = new Decimal(row.quantityBase.toString());
      const value = new Decimal(row.valueTotal.toString());
      const unitCost = qty.gt(0)
        ? value.div(qty).toDecimalPlaces(6)
        : new Decimal(0);
      return {
        ingredientId: row.ingredientId,
        ingredientName: row.ingredient.name,
        unitCode: row.ingredient.baseUnit.code,
        quantityBase: qty,
        unitCost,
        valueTotal: value,
        isLowStock:
          row.ingredient.minimumStock != null &&
          qty.gt(0) &&
          qty.lte(row.ingredient.minimumStock.toString()),
      };
    }),
  };
}

export async function getMenuProfitabilityReport(
  tenant: TenantContext,
  filters: ReportFilters = {},
) {
  const { timeZone, currency } = await orgTimeZone(tenant.organizationId);
  const window = resolveReportWindow({
    timeZone,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });
  const channelId = filters.channelId?.trim() || undefined;

  const items = await prisma.saleItem.findMany({
    where: {
      organizationId: tenant.organizationId,
      sale: {
        status: "POSTED",
        soldAt: { gte: window.start, lt: window.endExclusive },
        ...(channelId ? { channelId } : {}),
      },
    },
    select: {
      menuItemId: true,
      menuItemNameSnapshot: true,
      quantity: true,
      lineRevenue: true,
      foodCostSnapshot: true,
    },
  });

  const byMenu = new Map<
    string,
    {
      menuItemId: string;
      name: string;
      quantity: Decimal;
      revenue: Decimal;
      foodCost: Decimal;
    }
  >();

  for (const item of items) {
    const current = byMenu.get(item.menuItemId) ?? {
      menuItemId: item.menuItemId,
      name: item.menuItemNameSnapshot,
      quantity: new Decimal(0),
      revenue: new Decimal(0),
      foodCost: new Decimal(0),
    };
    current.quantity = current.quantity.plus(item.quantity.toString());
    current.revenue = current.revenue.plus(item.lineRevenue.toString());
    current.foodCost = current.foodCost.plus(item.foodCostSnapshot.toString());
    byMenu.set(item.menuItemId, current);
  }

  const rows = [...byMenu.values()]
    .map((row) => {
      const grossMargin = row.revenue.minus(row.foodCost).toDecimalPlaces(6);
      return {
        menuItemId: row.menuItemId,
        name: row.name,
        quantity: row.quantity.toDecimalPlaces(6),
        revenue: row.revenue.toDecimalPlaces(6),
        foodCost: row.foodCost.toDecimalPlaces(6),
        foodCostPercent: percentOf(row.foodCost, row.revenue),
        /** Revenue − food cost only (before packaging/fees). */
        grossMargin,
        marginLabel: "gross_margin" as const,
      };
    })
    .sort((a, b) => b.revenue.cmp(a.revenue));

  return {
    currency,
    timeZone,
    fromDate: window.fromDate,
    toDate: window.toDate,
    note: "Menu gross margin is revenue minus food cost only. Contribution margin (after fees/packaging) is on the dashboard and sales views. This is not net profit.",
    rows,
  };
}
