"use client";

import { Button } from "@/components/ui/button";
import { useDictionary } from "@/features/i18n/i18n-provider";
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
  const dict = useDictionary();
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => downloadCsv(filename, toCsv(headers, rows))}
    >
      {dict.reports.exportCsv}
    </Button>
  );
}
