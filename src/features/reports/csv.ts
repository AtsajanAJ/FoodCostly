export function toCsv(headers: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => {
    const text = String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
  };

  return [headers.map(escape).join(",")]
    .concat(rows.map((row) => row.map(escape).join(",")))
    .join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
