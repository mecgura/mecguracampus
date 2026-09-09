"use client";

import { useCallback, useEffect, useState } from "react";

interface Device {
  id: string; name: string; type: string; apiKey: string;
  lastSeen: string | null; lastSummary: string; school: { name: string } | null;
}

export default function DevicesPage() {
  const [rows, setRows] = useState<Device[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("biometric");
  const [msg, setMsg] = useState("");
  const [reveal, setReveal] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/devices");
    if (r.ok) setRows((await r.json()).devices);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add() {
    if (name.trim().length < 2) return;
    const r = await fetch("/api/devices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type }),
    });
    if (r.ok) {
      const j = await r.json();
      setReveal(j.device.id);
      setName("");
      setMsg("Device registered. Copy its API key into the agent software.");
      load();
    }
  }

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Devices — Biometric / PDS Machines</h1>
          <p>Each machine gets a secret API key. Punches flow straight into Attendance — no manual entry.</p>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}
      <div className="grid2">
        <div className="card">
          <h2>Registered Devices</h2>
          {rows.length === 0 ? <p className="small">No devices yet. Register the school&apos;s machine.</p> : (
            <div style={{ display: "grid", gap: 10 }}>
              {rows.map((d) => (
                <div key={d.id} className="card soft" style={{ boxShadow: "none" }}>
                  <b>{d.name}</b> <span className="bdg br">{d.type}</span>
                  <div className="small">{d.school?.name ?? "Unassigned"} • Last seen: {d.lastSeen ? new Date(d.lastSeen).toLocaleString("en-IN") : "never"}</div>
                  {d.lastSummary ? <div className="small">Last push: {d.lastSummary}</div> : null}
                  <div className="small" style={{ marginTop: 6 }}>
                    Key: <code>{reveal === d.id ? d.apiKey : d.apiKey.slice(0, 6) + "••••••••"}</code>{" "}
                    <button className="btn btn-o btn-sm" onClick={() => setReveal(reveal === d.id ? null : d.id)} type="button">
                      {reveal === d.id ? "Hide" : "Reveal"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="card">
            <h2>+ Register Device</h2>
            <div className="fld"><label>Device name</label><input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Gate Fingerprint" /></div>
            <div className="fld"><label>Type</label>
              <select className="inp" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="biometric">Biometric / PDS machine</option>
                <option value="gps">GPS unit</option>
              </select>
            </div>
            <button className="btn btn-g" onClick={add} type="button">Register + Generate Key</button>
          </div>
          <div className="card soft mt">
            <h2>How the machine connects</h2>
            <p className="small">
              1. Give every student/staff their machine user ID (deviceCode — set from Students/Staff lists).<br />
              2. Install the Mecgura agent on the school computer, paste the API key.<br />
              3. The agent POSTs punches to <b>/api/attendance/device</b> as <b>{"{ apiKey, records: [{ code, timestamp }] }"}</b>.<br />
              4. Matched punches mark today&apos;s attendance automatically; unknown codes are reported for mapping.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
