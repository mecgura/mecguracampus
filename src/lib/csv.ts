/** Minimal CSV parser (handles quoted commas + newlines inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  const t = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQ) {
      if (c === '"') {
        if (t[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cur.trim()); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(cur.trim()); cur = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur.trim());
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}

/** Maps header names (case-insensitive) to column indexes. */
export function headerIndex(header: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((h, i) => { map[h.toLowerCase().replace(/[^a-z]/g, "")] = i; });
  return map;
}

export function col(row: string[], map: Record<string, number>, ...names: string[]): string {
  for (const n of names) {
    const key = n.toLowerCase().replace(/[^a-z]/g, "");
    if (key in map) return row[map[key]] ?? "";
  }
  return "";
}
