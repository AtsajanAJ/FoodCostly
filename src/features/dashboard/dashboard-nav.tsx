import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionaries/en";

const links = [
  { href: "/dashboard/ingredients", key: "ingredients" as const, outline: false },
  { href: "/dashboard/suppliers", key: "suppliers" as const, outline: true },
  { href: "/dashboard/purchases", key: "purchases" as const, outline: true },
  { href: "/dashboard/inventory", key: "inventory" as const, outline: true },
  { href: "/dashboard/recipes", key: "recipes" as const, outline: true },
  { href: "/dashboard/menus", key: "menus" as const, outline: true },
  { href: "/dashboard/sales", key: "sales" as const, outline: true },
  { href: "/dashboard/reports", key: "reports" as const, outline: true },
];

export function DashboardNav({ dict }: { dict: Dictionary }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Button
          key={link.href}
          variant={link.outline ? "outline" : "default"}
          render={<Link href={link.href} />}
          nativeButton={false}
        >
          {dict.nav[link.key]}
        </Button>
      ))}
    </div>
  );
}
