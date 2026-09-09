"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULTS = [
  { key: "system_name", label: "System name", value: "MecguraCampus" },
  { key: "session", label: "Academic session", value: "2026-27" },
  { key: "default_language", label: "Default language", value: "Punjabi + English" },
  { key: "support_phone", label: "Support phone", value: "" },
];

interface School {
  id: string; name: string; city: string;
  razorpayKeyId: string; razorpayKeySecret: string;
  whatsappKey: string; whatsappProvider: string;
}

export default function SettingsPage() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [schools, setSchools] = useState<School[]>([]);
  const [sid, setSid] = useState("");
  const [keys, setKeys] = useState({ razorpayKeyId: "", razorpayKeySecret: "", whatsappKey: "", whatsappProvider: "interakt" });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([fetch("/api/settings"), fetch("/api/schools")]);
    if (a.ok) {
      const j = await a.json();
      const map: Record<string, string> = {};
      j.settings.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
      setVals(map);
    }
    if (b.ok) {
      const list: School[] = (await b.json()).schools;
      setSchools(list);
      const cur = list.find((s) => s.id === sid) ?? list[0];
      if (cur) {
        setSid(cur.id);
        setKeys({
          razorpayKeyId: cur.razorpayKeyId ?? "",
          razorpayKeySecret: cur.razorpayKeySecret ?? "",
          whatsappKey: cur.whatsappKey ?? "",
          whatsappProvider: cur.whatsappProvider ?? "interakt",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  function pick(id: string) {
    setSid(id);
    const s = schools.find((x) => x.id === id);
    if (s) {
      setKeys({
        razorpayKeyId: s.razorpayKeyId ?? "",
        razorpayKeySecret: s.razorpayKeySecret ?? "",
        whatsappKey: s.whatsappKey ?? "",
        whatsappProvider: s.whatsappProvider ?? "interakt",
      });
    }
  }

  async function saveBrand() {
    setMsg("");
    for (const d of DEFAULTS) {
      await fetch("/api/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: d.key, value: vals[d.key] ?? d.value }),
      });
    }
    setMsg("Branding saved.");
  }

  async function saveKeys() {
    setMsg("");
    if (!sid) return;
    const r = await fetch(`/api/schools/${sid}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(keys),
    });
    if (r.ok) {
      setMsg("Institute keys saved — status updated below.");
      load();
    } else setMsg("Could not save keys.");
  }

  const cur = schools.find((s) => s.id === sid);
  const rzLive = !!(cur?.razorpayKeyId && cur?.razorpayKeySecret);
  const waLive = !!cur?.whatsappKey;

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Settings</h1>
          <p>Branding once, API keys per institute — each school connects its own Razorpay + WhatsApp.</p>
        </div>
      </div>
      {msg ? <p className="alert info">{msg}</p> : null}

      <div className="card" style={{ border: "2px solid #78ce57" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ margin: 0 }}>Institute API Keys {cur ? <span className="small">— {cur.name}</span> : null}</h2>
          <span>
            <span className={`bdg ${rzLive ? "g" : "gr"}`}>Razorpay {rzLive ? "Live" : "Demo"}</span>{" "}
            <span className={`bdg ${waLive ? "g" : "gr"}`}>WhatsApp {waLive ? "Live" : "Demo"}</span>
          </span>
        </div>
        {schools.length > 1 ? (
          <div className="fld mt"><label>Institute</label>
            <select className="inp" value={sid} onChange={(e) => pick(e.target.value)}>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name} • {s.city}</option>)}
            </select>
          </div>
        ) : null}
        <div className="frow mt">
          <div className="fld"><label>Razorpay Key ID</label>
            <input className="inp" value={keys.razorpayKeyId} onChange={(e) => setKeys({ ...keys, razorpayKeyId: e.target.value })} placeholder="rzp_live_…" />
          </div>
          <div className="fld"><label>Razorpay Key Secret</label>
            <input className="inp" type="password" value={keys.razorpayKeySecret} onChange={(e) => setKeys({ ...keys, razorpayKeySecret: e.target.value })} placeholder="••••••••" />
          </div>
        </div>
        <div className="frow">
          <div className="fld"><label>WhatsApp API Key</label>
            <input className="inp" type="password" value={keys.whatsappKey} onChange={(e) => setKeys({ ...keys, whatsappKey: e.target.value })} placeholder="Provider key…" />
          </div>
          <div className="fld"><label>WhatsApp Provider</label>
            <select className="inp" value={keys.whatsappProvider} onChange={(e) => setKeys({ ...keys, whatsappProvider: e.target.value })}>
              <option value="interakt">Interakt (recommended)</option>
              <option value="gupshup">Gupshup</option>
              <option value="twilio">Twilio</option>
            </select>
          </div>
        </div>
        <button className="btn btn-g" onClick={saveKeys} type="button">Save Institute Keys</button>
        <p className="small mt">Empty = demo mode (logged, not sent). Fill a school&apos;s own keys → its fees + WhatsApp go live instantly. Platform env keys remain as fallback.</p>
      </div>

      <div className="card mt" style={{ maxWidth: 640 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Branding &amp; Platform</h2>
          <button className="btn btn-g btn-sm" onClick={saveBrand} type="button">Save All</button>
        </div>
        <div className="mt">
          {DEFAULTS.map((d) => (
            <div className="fld" key={d.key}>
              <label>{d.label} <span className="small">({d.key})</span></label>
              <input className="inp" value={vals[d.key] ?? d.value}
                onChange={(e) => setVals({ ...vals, [d.key]: e.target.value })} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
