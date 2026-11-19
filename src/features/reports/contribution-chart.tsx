"use client";

import { useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { label: string; value: number };

function subscribe() {
  return () => undefined;
}

function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function ContributionChart({ data }: { data: Point[] }) {
  const mounted = useIsClient();

  // Recharts ResponsiveContainer needs a real layout box; skip SSR.
  if (!mounted) {
    return <div className="h-64 w-full" aria-hidden />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={56} />
          <Tooltip />
          <Bar dataKey="value" fill="var(--color-foreground)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
