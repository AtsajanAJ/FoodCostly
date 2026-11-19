import { SignOutButton } from "@/features/auth/sign-out-button";
import { OrganizationSwitcher } from "@/features/organizations/organization-switcher";
import { requireTenantContext } from "@/server/permissions/tenant-context";

export const metadata = {
  title: "Dashboard",
};

export const instant = false;

export default async function DashboardPage() {
  const tenant = await requireTenantContext();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {tenant.userName} ({tenant.userEmail})
          </p>
        </div>
        <SignOutButton />
      </div>

      <OrganizationSwitcher activeOrganizationId={tenant.organizationId} />

      <section className="space-y-2 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium">Active tenant</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Organization</dt>
            <dd className="font-medium">{tenant.organizationName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Slug</dt>
            <dd className="font-medium">{tenant.organizationSlug}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium">{tenant.role}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Organization ID</dt>
            <dd className="break-all font-mono text-xs">{tenant.organizationId}</dd>
          </div>
        </dl>
      </section>

      <p className="text-sm text-muted-foreground">
        Tenant isolation is enforced server-side. Domain modules in later
        sprints must use <code>requireTenantContext()</code> and never trust
        client-supplied organization IDs.
      </p>
    </div>
  );
}
