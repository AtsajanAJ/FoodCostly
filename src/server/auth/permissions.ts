import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * MVP roles (PLAN.md): Owner, Admin, Staff, Viewer.
 * Better Auth stores role keys as lowercase strings.
 * `member` is exposed in the product as Staff.
 */
const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  ...ownerAc.statements,
});

export const admin = ac.newRole({
  ...adminAc.statements,
});

/** Staff — write-capable member without org ownership controls */
export const member = ac.newRole({
  ...memberAc.statements,
});

/** Viewer — read-only organization membership (base read is implicit) */
export const viewer = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
});

export const organizationRoles = {
  owner,
  admin,
  member,
  viewer,
} as const;

export type OrganizationRole = keyof typeof organizationRoles;
