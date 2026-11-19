import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-4 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page you requested does not exist or may have been moved.
        </p>
      </div>
      <div>
        <Button render={<Link href="/" />}>Go home</Button>
      </div>
    </div>
  );
}
