import Link from "next/link";
import { CreateSupplierForm } from "@/features/suppliers/create-supplier-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireTenantContext } from "@/server/permissions/tenant-context";
import * as supplierService from "@/server/services/supplier-service";

export const instant = false;

export default async function SuppliersPage() {
  const tenant = await requireTenantContext();
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const suppliers = await supplierService.listSuppliersForTenant(tenant, true);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="underline underline-offset-4">
            {dict.common.dashboard}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.suppliers.title}
        </h1>
        <p className="text-sm text-muted-foreground">{tenant.organizationName}</p>
      </div>

      <CreateSupplierForm />

      <section className="space-y-3">
        <h2 className="text-sm font-medium">{dict.suppliers.supplierList}</h2>
        {suppliers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dict.suppliers.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-3 py-2 font-medium">{dict.common.name}</th>
                  <th className="px-3 py-2 font-medium">{dict.common.contact}</th>
                  <th className="px-3 py-2 font-medium">{dict.common.email}</th>
                  <th className="px-3 py-2 font-medium">{dict.suppliers.phone}</th>
                  <th className="px-3 py-2 font-medium">{dict.common.status}</th>
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