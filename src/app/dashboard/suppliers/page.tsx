import Link from "next/link";
import { CreateSupplierForm } from "@/features/suppliers/create-supplier-form";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as supplierService from "@/server/services/supplier-service";

export const metadata = { title: "Suppliers" };
export const instant = false;

export default async function SuppliersPage() {
  const tenant = await requireTenantContext();
  const suppliers = await supplierService.listSuppliersForTenant(tenant, true);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="underline underline-offset-4">
            Dashboard
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
        <p className="text-sm text-muted-foreground">{tenant.organizationName}</p>
      </div>

      <CreateSupplierForm />

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Supplier list</h2>
        {suppliers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suppliers yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Contact</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-2">{supplier.name}</td>
                    <td className="px-3 py-2">{supplier.contactName ?? "—"}</td>
                    <td className="px-3 py-2">{supplier.email ?? "—"}</td>
                    <td className="px-3 py-2">{supplier.phone ?? "—"}</td>
                    <td className="px-3 py-2">
                      {supplier.archivedAt ? "ARCHIVED" : "ACTIVE"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
