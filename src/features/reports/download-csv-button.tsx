"use client";

import { Button } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/features/reports/csv";

export function DownloadCsvButton({
  filename,
  headers,
  rows,
}: {
  filename: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => downloadCsv(filename, toCsv(headers, rows))}
    >
      Export CSV
    </Button>
  );
}
