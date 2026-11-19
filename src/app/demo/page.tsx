import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Demo",
};

export default function DemoPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
        <p className="font-medium">You are in demo mode</p>
        <p className="mt-1 text-muted-foreground">
          Explore the product with sample data. Nothing here is saved. Create an
          account when you want to track your own restaurant.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" render={<Link href="/sign-up" />} nativeButton={false}>
            Create account
          </Button>
          <Button
            size="sm"
            variant="outline"
            render={<Link href="/sign-in" />}
            nativeButton={false}
          >
            Sign in
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Demo dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Sample restaurant: Harbor Bakery (demo)
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <DemoStat label="Food cost" value="31.4%" hint="Target under 35%" />
        <DemoStat label="Stock value" value="฿12,480" hint="Based on MWAC" />
        <DemoStat label="Contribution margin" value="฿48,220" hint="This week" />
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-medium">What you can do after signing up</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Record ingredient purchases and receive stock</li>
          <li>Build recipes and see live menu costs</li>
          <li>Enter sales and deduct inventory immediately</li>
          <li>Review contribution margin by channel</li>
        </ul>
      </section>
    </div>
  );
}

function DemoStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
