import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/server/auth/auth";
import type { OrganizationRole } from "@/server/auth/permissions";

export class TenantAccessError extends Error {
  readonly status = 403;

  constructor(message = "You do not have access to this organization") {
    super(message);
    this.name = "TenantAccessError";
  }
}

export type TenantContext = {
  userId: string;
  userEmail: string;
  userName: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: OrganizationRole;
  sessionId: string;
};

/**
 * Resolve the active organization from the authenticated server session
 * and verify membership. Never trust a client-supplied organizationId.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return null;
  }

  const membership = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
    include: {
      organization: true,
    },
  });

  if (!membership) {
    return null;
  }

  return {
    userId: session.user.id,
    userEmail: session.user.email,
    userName: session.user.name,
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    organizationSlug: membership.organization.slug,
    role: membership.role as OrganizationRole,
    sessionId: session.session.id,
  };
}

export async function requireTenantContext(): Promise<TenantContext> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (!session.session.activeOrganizationId) {
    redirect("/onboarding");
  }

  const context = await getTenantContext();

  if (!context) {
    redirect("/onboarding");
  }

  return context;
}

/**
 * Authorize access to a specific organization for the current user.
 * Use this whenever an organizationId arrives from request input.
 */
export async function assertOrganizationAccess(
  organizationId: string,
  userId?: string,
): Promise<{ role: OrganizationRole }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const resolvedUserId = userId ?? session?.user.id;

  if (!resolvedUserId) {
    throw new TenantAccessError("Authentication required");
  }

  // Ignore any other organizationId the client might prefer; the caller
  // must pass the id they intend to access, and membership is verified here.
  const membership = await prisma.member.findFirst({
    where: {
      userId: resolvedUserId,
      organizationId,
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    throw new TenantAccessError();
  }

  return { role: membership.role as OrganizationRole };
}

export async function assertOrganizationAccessForUser(
  userId: string,
  organizationId: string,
): Promise<{ role: OrganizationRole }> {
  const membership = await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
    },
    select: {
      role: true,
    },
  });

  if (!membership) {
    throw new TenantAccessError();
  }

  return { role: membership.role as OrganizationRole };
}
