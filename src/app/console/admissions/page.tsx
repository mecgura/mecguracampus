"use client";

import { useCallback, useEffect, useState } from "react";

const STAGES = ["New", "Contacted", "Visit Scheduled", "Visited", "Admitted", "Lost"];
const SOURCES = ["Walk-in", "Referral", "Online", "Advertisement", "Other"];
const TERMINAL: Record<string, string> = { Admitted: "Visited", Lost: "New" };

const APPS_SCRIPT = `function doPost(e){
  const s = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const d = JSON.parse(e.postData.contents);
  s.appendRow([new Date(), d.parentName, d.phone, d.childName,
    d.childClass, d.stage, d.source, d.school]);
  return ContentService.createTextOutput("ok");
}`;

interface Lead {
  id: string; parentName: string; phone: string; childName: string; childClass: string;
  source: string; stage: string; followUp: string; notes: string; school: { name: string } | null;
}
interface School { id: string; name: string; sheetWebhook: string }

function csvCell(v: string) {
  const s = (v ?? "").replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

export default function AdmissionsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [due, setDue] = useState(0);
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ parentName: "", phone: "", childName: "", childClass: "", source: "Walk-in", followUp: "", notes: "" });
  const [school, setSchool] = useState<School | null>(null);
  const [webhook, setWebhook] = useState("");

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([fetch("/api/crm/leads"), fetch("/api/schools")]);
    if (a.ok) {
      const j = await a.json();
      setLeads(j.leads);
      setDue(j.followUpDue);
    }
    if (b.ok) {
      const list: School[] = (await b.json()).schools;
      if (list.length) {
        setSchool(list[0]);
        setWebhook(list[0].sheetWebhook ?? "");
      }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add() {
    if (form.parentName.trim().length < 2) return;
    const r = await fetch("/api/crm/leads", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (r.ok) { setShow(false); setForm({ parentName: "", phone: "", childName: "", childClass: "", source: "Walk-in", followUp: "", notes: "" }); load(); }
  }

  async function setStage(id: string, stage: string) {
    const r = await fetch(`/api/crm/leads/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }),
    });
    if (r.ok) {
      const j = await r.json();
      if (j.studentCreated) setMsg("Admission done — student record + welcome message created." + (j.sheetSynced ? " Synced to Google Sheet." : ""));
      else if (stage === "Admitted") setMsg("Already admitted — no duplicate student created." + (j.sheetSynced ? " Synced to Google Sheet." : ""));
      load();
    }
  }

  function step(id: string, dir: 1 | -1) {
    const l = leads.find((x) => x.id === id);
    if (!l || TERMINAL[l.stage]) return;
    const next = STAGES[Math.max(0, Math.min(STAGES.length - 1, STAGES.indexOf(l.stage) + dir))];
    if (next !== l.stage) setStage(id, next);
  }

  function downloadCsv() {
    const head = ["Parent", "Phone", "Child", "Class", "Source", "Stage", "FollowUp", "Notes"];
    const lines = [head.join(",")];
    leads.forEach((l) => {
      lines.push([l.parentName, l.phone, l.childName, l.childClass, l.source, l.stage, l.followUp, l.notes].map(csvCell).join(","));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `admissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg(`Downloaded ${leads.length} leads. Open in Excel or File → Import in Google Sheets.`);
  }

  async function saveWebhook() {
    if (!school) return;
    const r = await fetch(`/api/schools/${school.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetWebhook: webhook.trim() }),
    });
    if (r.ok) {
      setMsg(webhook.trim() ? "Google Sheet connected. Every new admission will auto-save to your sheet." : "Google Sheet sync turned off.");
      load();
    } else setMsg("Could not save. Only the school's own admin can connect its sheet.");
  }

  function cardButtons(l: Lead) {
    // Terminal stages: no forward/back arrows — only Reopen. No duplicates possible.
    if (l.stage === "Admitted") {
      return (
        <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="bdg g">Won ✓</span>
          <button className="btn btn-o btn-sm" onClick={() => setStage(l.id, TERMINAL.Admitted)} type="button">Reopen</button>
        </div>
      );
    }
    if (l.stage === "Lost") {
      return (
        <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="bdg gr">Closed</span>
          <button className="btn btn-o btn-sm" onClick={() => setStage(l.id, TERMINAL.Lost)} type="button">Reopen</button>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <button className="btn btn-o btn-sm" onClick={() => step(l.id, -1)} type="button">◀</button>
        <button className="btn btn-g btn-sm" onClick={() => step(l.id, 1)} type="button">▶</button>
        <button className="btn btn-g btn-sm" onClick={() => setStage(l.id, "Admitted")} type="button">Won ✓</button>
        <button className="btn btn-o btn-sm" onClick={() => setStage(l.id, "Lost")} type="button">Lost</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Admissions CRM <span className="bdg b">USP</span></h1>
          <p>No enquiry ever goes cold. Won in one click — the student record creates itself.</p>
        </div>
        <div className="mc-actions">
          <button className="btn btn-o" onClick={downloadCsv} type="button">Download Sheet (CSV)</button>
          <button className="btn btn-g" onClick={() => setShow(true)} type="button">+ New Enquiry</button>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}
      <div className="grid4">
        <div className="card stat"><span>Open pipeline</span><b>{leads.filter((l) => !["Admitted", "Lost"].includes(l.stage)).length}</b><small>enquiries in play</small></div>
        <div className="card stat"><span>Follow-up due</span><b>{due}</b><small>today or overdue</small></div>
        <div className="card stat"><span>Won (Admitted)</span><b>{leads.filter((l) => l.stage === "Admitted").length}</b><small>this season</small></div>
        <div className="card stat"><span>Conversion</span><b>{leads.length ? Math.round((leads.filter((l) => l.stage === "Admitted").length / leads.length) * 100) : 0}%</b><small>enquiry → admission</small></div>
      </div>
      <div className="card mt">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
          {STAGES.map((s) => (
            <div key={s} style={{ background: "#F7FAF7", border: "1px solid #E6EEE6", borderRadius: 12, padding: 10 }}>
              <b style={{ fontSize: 12 }}>{s.toUpperCase()} ({leads.filter((l) => l.stage === s).length})</b>
              <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                {leads.filter((l) => l.stage === s).map((l) => (
                  <div key={l.id} className="card" style={{ padding: 10, boxShadow: "none" }}>
                    <b style={{ fontSize: 13 }}>{l.parentName}</b>
                    <div className="small">{l.childName} • Class {l.childClass || "—"}</div>
                    <div className="small">{l.phone} • {l.source}</div>
                    {l.followUp && !["Admitted", "Lost"].includes(l.stage) ? <div className="small">Follow up: <b>{l.followUp}</b></div> : null}
                    {cardButtons(l)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt">
        <h2>Google Sheet Auto-Sync {school?.sheetWebhook ? <span className="bdg g">Connected</span> : <span className="bdg gr">Off</span>}</h2>
        <p className="small">Every <b>Won</b> admission auto-saves to {school?.name ?? "your school's"} Google Sheet. No webhook = use Download Sheet (CSV) above, then File → Import in Google Sheets.</p>
        <div className="fld mt"><label>Google Apps Script Web App URL</label>
          <input className="inp" value={webhook} onChange={(e) => setWebhook(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-g btn-sm" onClick={saveWebhook} type="button">Connect Sheet</button>
          <button className="btn btn-o btn-sm" onClick={() => navigator.clipboard?.writeText(APPS_SCRIPT).then(() => setMsg("Script copied. Paste it in Extensions → Apps Script, Deploy → Web app (access: Anyone)."))} type="button">Copy Sheet Script</button>
        </div>
        <details className="small mt">
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>Show 2-minute setup steps + sheet code</summary>
          <pre className="small mt" style={{ background: "#0C160D", color: "#c9d8cb", padding: 14, borderRadius: 12, overflowX: "auto", whiteSpace: "pre" }}>{APPS_SCRIPT}</pre>
          <p className="small">Sheet kholo → Extensions → Apps Script → code paste → Deploy → New deployment → Web app → Execute as: Me, Access: Anyone → URL ethe paste → Connect Sheet.</p>
        </details>
      </div>

      {show ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99, padding: 16 }}>
          <div className="card" style={{ width: "100%", maxWidth: 520 }}>
            <h2>New Enquiry</h2>
            <div className="frow">
              <div className="fld"><label>Parent name</label><input className="inp" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} /></div>
              <div className="fld"><label>Phone</label><input className="inp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="frow">
              <div className="fld"><label>Child name</label><input className="inp" value={form.childName} onChange={(e) => setForm({ ...form, childName: e.target.value })} /></div>
              <div className="fld"><label>Class sought</label><input className="inp" value={form.childClass} onChange={(e) => setForm({ ...form, childClass: e.target.value })} placeholder="5-A" /></div>
            </div>
            <div className="frow">
              <div className="fld"><label>Source</label><select className="inp" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div className="fld"><label>Follow-up date</label><input className="inp" type="date" value={form.followUp} onChange={(e) => setForm({ ...form, followUp: e.target.value })} /></div>
            </div>
            <div className="fld"><label>Notes</label><input className="inp" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-g" onClick={add} type="button">Save Enquiry</button>
              <button className="btn btn-o" onClick={() => setShow(false)} type="button">Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
