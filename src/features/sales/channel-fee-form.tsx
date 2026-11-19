"use client";

import { useState } from "react";
import { updateChannelFeeAction } from "@/features/sales/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Channel = {
  id: string;
  name: string;
  feeType: "NONE" | "PERCENT" | "FIXED";
  feeValue: string;
};

export function ChannelFeeForm({ channels }: { channels: Channel[] }) {
  const [rows, setRows] = useState(channels);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function save(channel: Channel) {
    setPendingId(channel.id);
    setError(null);
    setSuccess(null);
    const result = await updateChannelFeeAction({
      channelId: channel.id,
      feeType: channel.feeType,
      feeValue: channel.feeValue,
    });
    setPendingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(`Updated ${channel.name}`);
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium">Channel fees</h2>
      {rows.map((channel) => (
        <div
          key={channel.id}
          className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-4"
        >
          <p className="text-sm font-medium sm:col-span-1">{channel.name}</p>
          <select
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
            value={channel.feeType}
            onChange={(event) =>
              setRows((current) =>
                current.map((row) =>
                  row.id === channel.id
                    ? {
                        ...row,
                        feeType: event.target.value as Channel["feeType"],
                      }
                    : row,
                ),
              )
            }
          >
            <option value="NONE">None</option>
            <option value="PERCENT">Percent</option>
            <option value="FIXED">Fixed</option>
          </select>
          <Input
            inputMode="decimal"
            value={channel.feeValue}
            onChange={(event) =>
              setRows((current) =>
                current.map((row) =>
                  row.id === channel.id
                    ? { ...row, feeValue: event.target.value }
                    : row,
                ),
              )
            }
          />
          <Button
            type="button"
            variant="outline"
            disabled={pendingId === channel.id}
            onClick={() => void save(channel)}
          >
            {pendingId === channel.id ? "Saving…" : "Save"}
          </Button>
        </div>
      ))}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-muted-foreground">{success}</p> : null}
    </div>
  );
}
