import { db } from "@/lib/db";
import { requireUser, schoolScope, unauthorized, badRequest } from "@/lib/session";
import { importRowSchema } from "@/lib/validations";
import { parseCsv, headerIndex, col } from "@/lib/csv";

export interface ImportRowInput {
  name?: string; class?: string; feeMonthly?: number | string; phone?: string;
  role?: string; salary?: number | string;
}

/** Bulk insert students/staff — powers the Google Sheet configuration flow. */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const scope = schoolScope(user);
  const body = await req.json().catch(() => null);
  const kind = body?.kind === "staff" ? "staff" : "students";
  const schoolId = scope ?? body?.schoolId;
  if (!schoolId) return badRequest("schoolId is required.");
  if (scope && body?.schoolId && body.schoolId !== scope) return unauthorized();
  const school = await db.school.findUnique({ where: { id: schoolId } });
  if (!school) return badRequest("School not found.");
  if (!Array.isArray(body?.rows)) return badRequest("rows[] is required.");

  let inserted = 0;
  const errors: string[] = [];
  const rows = (body.rows as ImportRowInput[]).slice(0, 1000);
  for (let i = 0; i < rows.length; i++) {
    const parsed = importRowSchema.safeParse(rows[i]);
    if (!parsed.success || !parsed.data.name) { errors.push(`Row ${i + 2}: invalid`); continue; }
    try {
      if (kind === "students") {
        await db.student.create({
          data: {
            name: parsed.data.name, class: parsed.data.class ?? "", schoolId,
            feeMonthly: parsed.data.feeMonthly ?? 0, feeDue: parsed.data.feeMonthly ?? 0,
            phone: parsed.data.phone ?? "",
          },
        });
      } else {
        await db.staffMember.create({
          data: {
            name: parsed.data.name, role: parsed.data.role || "Teacher", schoolId,
            salary: parsed.data.salary ?? 0, status: "Pending",
          },
        });
      }
      inserted++;
    } catch { errors.push(`Row ${i + 2}: save failed`); }
  }
  return Response.json({ inserted, skipped: errors.length, errors: errors.slice(0, 10) });
}

/** Fetch a published Google Sheet CSV URL and convert to insertable rows (preview only). */
export async function PUT(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url : "";
  const kind = body?.kind === "staff" ? "staff" : "students";
  if (!/^https:\/\/docs\.google\.com\/spreadsheets\//.test(url)) {
    return badRequest("Only Google Sheets URLs (docs.google.com/spreadsheets) are accepted.");
  }
  // Convert edit/share links to CSV export links.
  const csvUrl = url.includes("/export?") ? url : url.replace(/\/edit.*$/, "/export?format=csv").replace(/\/view.*$/, "/export?format=csv");
  let text = "";
  try {
    const res = await fetch(csvUrl, { redirect: "follow" });
    if (!res.ok) throw new Error("fetch failed");
    text = await res.text();
  } catch {
    return badRequest("Could not read the sheet. Publish it: File → Share → Publish to web (CSV), then paste the link.");
  }
  const grid = parseCsv(text);
  if (grid.length < 2) return badRequest("The sheet is empty.");
  const map = headerIndex(grid[0]);
  const rows = grid.slice(1, 501).map((r) =>
    kind === "students"
      ? { name: col(r, map, "name", "student", "studentname"), class: col(r, map, "class", "section"), feeMonthly: Number(col(r, map, "feemonthly", "fees", "fee")) || 0, phone: col(r, map, "phone", "mobile", "parentphone") }
      : { name: col(r, map, "name", "staff", "teacher"), role: col(r, map, "role", "designation"), salary: Number(col(r, map, "salary")) || 0, phone: col(r, map, "phone", "mobile") }
  ).filter((r) => r.name);
  return Response.json({ columns: grid[0], rows, total: rows.length });
}
