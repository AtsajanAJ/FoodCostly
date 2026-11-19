"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChannelOption = { id: string; name: string };

export function ReportFilters({
  fromDate,
  toDate,
  channelId,
  channels,
  showChannel = true,
}: {
  fromDate: string;
  toDate: string;
  channelId?: string;
  channels?: ChannelOption[];
  showChannel?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [from, setFrom] = useState(fromDate);
  const [to, setTo] = useState(toDate);
  const [channel, setChannel] = useState(channelId ?? "");

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", from);
    params.set("to", to);
    if (showChannel) {
      if (channel) params.set("channelId", channel);
      else params.delete("channelId");
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="from">From</Label>
        <Input
          id="from"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to">To</Label>
        <Input
          id="to"
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </div>
      {showChannel && channels ? (
        <div className="space-y-1">
          <Label htmlFor="channel">Channel</Label>
          <select
            id="channel"
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
          >
            <option value="">All channels</option>
            {channels.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Apply"}
      </Button>
    </form>
  );
}
