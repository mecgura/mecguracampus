"use client";

import { useEffect, useState } from "react";

const DEFAULTS = [
  { key: "system_name", label: "System name", value: "MecguraCampus" },
  { key: "session", label: "Academic session", value: "2026-27" },
  { key: "default_language", label: "Default language", value: "Punjabi + English" },
  { key: "support_phone", label: "Support phone", value: "" },
];

export default function SettingsPage() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings").then(async (r) => {
      if (!r.ok) return;
      const j = await r.json();
      const map: Record<string, string> = {};
      j.settings.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
      setVals(map);
    });
  }, []);

  async function save() {
    setMsg("");
    for (const d of DEFAULTS) {
      await fetch("/api/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: d.key, value: vals[d.key] ?? d.value }),
      });
    }
    setMsg("All settings saved to the database.");
  }

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Settings</h1>
          <p>Configure once — stored centrally, applied everywhere.</p>
        </div>
        <div className="mc-actions">
          <button className="btn btn-g" onClick={save} type="button">Save All</button>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}
      <div className="card" style={{ maxWidth: 640 }}>
        <h2>Branding &amp; Platform</h2>
        {DEFAULTS.map((d) => (
          <div className="fld" key={d.key}>
            <label>{d.label} <span className="small">({d.key})</span></label>
            <input className="inp" value={vals[d.key] ?? d.value}
              onChange={(e) => setVals({ ...vals, [d.key]: e.target.value })} />
          </div>
        ))}
        <div className="card soft mt">
          <h2>Live Integrations (.env)</h2>
          <p className="small">RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET → real online fee collection.<br />WHATSAPP_API_KEY → real WhatsApp delivery. Until then, everything runs in logged demo mode.</p>
        </div>
      </div>
    </div>
  );
}
