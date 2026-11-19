import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6 py-16">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">FoodCostly</p>
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Restaurant cost and inventory, clearly tracked.
        </h1>
        <p className="max-w-lg text-base leading-7 text-muted-foreground">
          Record purchases, manage stock, cost recipes, and understand
          contribution margin across sales channels.
        </p>
      </div>
      <div>
        <Button disabled size="lg">
          Sign in coming soon
        </Button>
      </div>
    </div>
  );
}
