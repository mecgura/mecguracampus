"use client";

import { useCallback, useEffect, useState } from "react";

interface School { id: string; name: string }

export default function ImportPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [kind, setKind] = useState<"students" | "staff">("students");
  const [sheetUrl, setSheetUrl] = useState("");
  const [rows, setRows] = useState<Array<Record<string, string | number | undefined>>>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/schools");
    if (!r.ok) return;
    const list: School[] = (await r.json()).schools;
    setSchools(list);
    if (!schoolId && list.length) setSchoolId(list[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  async function fetchSheet() {
    setMsg(""); setLoading(true);
    const r = await fetch("/api/import", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: sheetUrl, kind }),
    });
    const j = await r.json().catch(() => ({}));
    setLoading(false);
    if (!r.ok) { setMsg("Error: " + (j.error ?? "could not read sheet")); return; }
    setRows(j.rows);
    setMsg(`${j.total} rows found. Review, then press Import.`);
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) { setMsg("CSV is empty."); return; }
      const head = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const gi = (n: string) => head.indexOf(n);
      const data = lines.slice(1, 501).map((l) => {
        const c = l.split(",");
        const g = (i: number) => (i >= 0 ? (c[i] ?? "").trim() : "");
        return kind === "students"
          ? { name: g(gi("name")), class: g(gi("class")), feeMonthly: Number(g(gi("feemonthly"))) || 0, phone: g(gi("phone")) }
          : { name: g(gi("name")), role: g(gi("role")), salary: Number(g(gi("salary"))) || 0, phone: g(gi("phone")) };
      }).filter((r) => r.name);
      setRows(data);
      setMsg(`${data.length} rows found. Review, then press Import.`);
    };
    reader.readAsText(file);
  }

  async function doImport() {
    if (!rows.length || !schoolId) return;
    setLoading(true);
    const r = await fetch("/api/import", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, schoolId, rows }),
    });
    const j = await r.json().catch(() => ({}));
    setLoading(false);
    if (!r.ok) { setMsg("Error: " + (j.error ?? "import failed")); return; }
    setMsg(`Imported ${j.inserted} ${kind}. ${j.skipped ? j.skipped + " skipped." : ""}`);
    setRows([]);
  }

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Google Sheet Configuration</h1>
          <p>New schools fill a Google Sheet — students, staff and fee heads land in the database in one click.</p>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}
      <div className="grid2">
        <div className="card">
          <h2>1 — Source</h2>
          <div className="fld"><label>School</label>
            <select className="inp" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="fld"><label>Importing</label>
            <select className="inp" value={kind} onChange={(e) => { setKind(e.target.value as "students" | "staff"); setRows([]); }}>
              <option value="students">Students</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="fld"><label>Google Sheet link (published CSV)</label>
            <input className="inp" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…/edit" />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-d btn-sm" onClick={fetchSheet} type="button" disabled={loading}>Fetch Sheet</button>
            <label className="btn btn-o btn-sm" style={{ cursor: "pointer" }}>
              Upload CSV
              <input type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </div>
          <div className="card soft mt">
            <h2>Sheet template</h2>
            <p className="small">Students columns: <b>name, class, feeMonthly, phone</b><br />Staff columns: <b>name, role, salary, phone</b><br />Then: File → Share → Publish to web (CSV) → paste the link above.</p>
          </div>
        </div>
        <div className="card">
          <h2>2 — Preview ({rows.length})</h2>
          {rows.length === 0 ? <p className="small">Nothing loaded yet.</p> : (
            <>
              <div style={{ overflowX: "auto", maxHeight: 380, overflowY: "auto" }}>
                <table className="tbl">
                  <tbody>
                    <tr><th>Name</th><th>{kind === "students" ? "Class" : "Role"}</th><th>{kind === "students" ? "Fee" : "Salary"}</th><th>Phone</th></tr>
                    {rows.slice(0, 50).map((r, i) => (
                      <tr key={i}>
                        <td><b>{String(r.name)}</b></td>
                        <td>{String(r.class ?? r.role ?? "")}</td>
                        <td>{Number(r.feeMonthly ?? r.salary ?? 0).toLocaleString("en-IN")}</td>
                        <td className="small">{String(r.phone ?? "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt">
                <button className="btn btn-g" onClick={doImport} type="button" disabled={loading}>Import {rows.length} Rows</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
