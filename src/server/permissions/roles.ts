import type { OrganizationRole } from "@/server/auth/permissions";
import { TenantAccessError } from "@/server/permissions/tenant-context";

const writeRoles = new Set<OrganizationRole>(["owner", "admin", "member"]);

export function assertCanWriteMasterData(role: OrganizationRole) {
  if (!writeRoles.has(role)) {
    throw new TenantAccessError("Viewer role cannot modify master data");
  }
}
