type Cell = string | number | boolean | null | undefined;

function escapeCell(v: Cell): string {
  if (v == null) return "";
  let s = String(v);
  // Neutralize spreadsheet formula injection from user-entered text.
  if (/^[=+\-@\t\r]/.test(s) && typeof v === "string") s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: Cell[][]): string {
  return [header, ...rows].map((r) => r.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}
