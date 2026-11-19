import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  TenantAccessError,
  assertOrganizationAccessForUser,
} from "@/server/permissions/tenant-context";

const ids = {
  userA: "test_user_a_tenant_isolation",
  userB: "test_user_b_tenant_isolation",
  orgA: "test_org_a_tenant_isolation",
  orgB: "test_org_b_tenant_isolation",
  memberA: "test_member_a_tenant_isolation",
  memberB: "test_member_b_tenant_isolation",
};

describe("tenant isolation", () => {
  beforeAll(async () => {
    await cleanup();

    await prisma.user.createMany({
      data: [
        {
          id: ids.userA,
          name: "User A",
          email: "user-a-tenant-isolation@example.com",
          emailVerified: true,
        },
        {
          id: ids.userB,
          name: "User B",
          email: "user-b-tenant-isolation@example.com",
          emailVerified: true,
        },
      ],
    });

    await prisma.organization.createMany({
      data: [
        {
          id: ids.orgA,
          name: "Org A",
          slug: "org-a-tenant-isolation",
          createdAt: new Date(),
        },
        {
          id: ids.orgB,
          name: "Org B",
          slug: "org-b-tenant-isolation",
          createdAt: new Date(),
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
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it("allows a member to access their own organization", async () => {
    const access = await assertOrganizationAccessForUser(ids.userA, ids.orgA);
    expect(access.role).toBe("owner");
  });

  it("rejects cross-tenant organization access", async () => {
    await expect(
      assertOrganizationAccessForUser(ids.userA, ids.orgB),
    ).rejects.toBeInstanceOf(TenantAccessError);

    await expect(
      assertOrganizationAccessForUser(ids.userB, ids.orgA),
    ).rejects.toBeInstanceOf(TenantAccessError);
  });
});

async function cleanup() {
  await prisma.member.deleteMany({
    where: {
      id: { in: [ids.memberA, ids.memberB] },
    },
  });
  await prisma.organization.deleteMany({
    where: {
      id: { in: [ids.orgA, ids.orgB] },
    },
  });
  await prisma.user.deleteMany({
    where: {
      id: { in: [ids.userA, ids.userB] },
    },
  });
}
