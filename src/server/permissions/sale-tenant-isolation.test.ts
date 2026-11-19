import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import * as saleRepository from "@/server/repositories/sale-repository";

const ids = {
  userA: "test_user_a_sale_iso",
  userB: "test_user_b_sale_iso",
  orgA: "test_org_a_sale_iso",
  orgB: "test_org_b_sale_iso",
  memberA: "test_member_a_sale_iso",
  memberB: "test_member_b_sale_iso",
  channelB: "test_channel_b_sale_iso",
  saleB: "test_sale_b_sale_iso",
};

describe("sale tenant isolation", () => {
  beforeAll(async () => {
    await cleanup();

    await prisma.user.createMany({
      data: [
        {
          id: ids.userA,
          name: "User A",
          email: "user-a-sale-iso@example.com",
          emailVerified: true,
        },
        {
          id: ids.userB,
          name: "User B",
          email: "user-b-sale-iso@example.com",
          emailVerified: true,
        },
      ],
    });

    await prisma.organization.createMany({
      data: [
        {
          id: ids.orgA,
          name: "Org A",
          slug: "org-a-sale-iso",
          createdAt: new Date(),
          currency: "THB",
        },
        {
          id: ids.orgB,
          name: "Org B",
          slug: "org-b-sale-iso",
          createdAt: new Date(),
          currency: "THB",
        },
      ],
    });

    await prisma.member.createMany({
      data: [
        {
          id: ids.memberA,
          organizationId: ids.orgA,
          userId: ids.userA,
          role: "owner",
          createdAt: new Date(),
        },
        {
          id: ids.memberB,
          organizationId: ids.orgB,
          userId: ids.userB,
          role: "owner",
          createdAt: new Date(),
        },
      ],
    });

    await prisma.saleChannel.create({
      data: {
        id: ids.channelB,
        organizationId: ids.orgB,
        code: "INSTORE",
        name: "In-store",
        feeType: "NONE",
        feeValue: "0",
      },
    });

    await prisma.sale.create({
      data: {
        id: ids.saleB,
        organizationId: ids.orgB,
        channelId: ids.channelB,
        status: "POSTED",
        soldAt: new Date(),
        idempotencyKey: "sale-iso-key-b",
        currency: "THB",
        grossRevenue: "10",
        discountAmount: "0",
        packagingCost: "0",
        channelFeeAmount: "0",
        foodCostTotal: "2",
        contributionMargin: "8",
      },
    });
  });

  afterAll(async () => {
    await cleanup();
  });

  it("lists only the active organization sales", async () => {
    const orgASales = await saleRepository.listSales(ids.orgA);
    expect(orgASales.map((sale) => sale.id)).not.toContain(ids.saleB);

    const orgBSales = await saleRepository.listSales(ids.orgB);
    expect(orgBSales.map((sale) => sale.id)).toContain(ids.saleB);
  });

  it("cannot load another organization sale by id", async () => {
    const stolen = await saleRepository.getSaleForOrg(ids.orgA, ids.saleB);
    expect(stolen).toBeNull();
  });
});

async function cleanup() {
  await prisma.sale.deleteMany({
    where: { id: { in: [ids.saleB] } },
  });
  await prisma.saleChannel.deleteMany({
    where: { id: { in: [ids.channelB] } },
  });
  await prisma.member.deleteMany({
    where: { id: { in: [ids.memberA, ids.memberB] } },
  });
  await prisma.organization.deleteMany({
    where: { id: { in: [ids.orgA, ids.orgB] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [ids.userA, ids.userB] } },
  });
}
