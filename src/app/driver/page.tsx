"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Bus { id: string; number: string; route: string; status: string }

/**
 * Driver web app — runs on the driver's phone browser.
 * Uses live GPS when available; otherwise the position slider demos the flow.
 */
export default function DriverPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [busId, setBusId] = useState("");
  const [key, setKey] = useState("");
  const [running, setRunning] = useState(false);
  const [pos, setPos] = useState(10);
  const [log, setLog] = useState("Idle. Select your bus and press Start Trip.");
  const [stopName, setStopName] = useState("");
  const [dropKid, setDropKid] = useState("");
  const [tripMsg, setTripMsg] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/tracking/buses");
    if (!r.ok) return;
    const list: Bus[] = (await r.json()).buses;
    setBuses(list);
    if (!busId && list.length) setBusId(list[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function pingOnce(p: number) {
    const send = (lat?: number, lng?: number, speed?: number) => {
      fetch("/api/tracking/ping", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ busId, key, position: p, lat, lng, speed: speed ?? 0 }),
      })
        .then(async (r) => {
          if (r.ok) setLog(`Ping sent at ${new Date().toLocaleTimeString("en-IN")} — position ${p}%. Parents can see you live.`);
          else setLog("Rejected: " + ((await r.json()).error ?? "check bus + driver key"));
        })
        .catch(() => setLog("Network error — will retry."));
    };
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (g) => send(g.coords.latitude, g.coords.longitude, Math.round((g.coords.speed ?? 8) * 3.6)),
        () => send(),
        { timeout: 8000 }
      );
    } else send();
  }

  function start() {
    if (!busId || !key) { setLog("Select bus and enter the driver key first."); return; }
    setRunning(true);
    pingOnce(pos);
    timer.current = setInterval(() => {
      setPos((p) => {
        const n = Math.min(100, p + 2);
        pingOnce(n);
        if (n >= 100 && timer.current) { clearInterval(timer.current); setRunning(false); setLog("Trip complete — school reached."); }
        return n;
      });
    }, 10000);
    setLog("Trip started. Sending position every 10 seconds.");
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    setRunning(false);
    setLog("Trip stopped.");
  }

  async function trip(kind: string) {
    setTripMsg("");
    if (!busId || !key) { setTripMsg("Select bus + driver key first."); return; }
    const r = await fetch("/api/trips/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ busId, key, kind, note: stopName, studentName: dropKid }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setTripMsg(`${j.label} — parents notified instantly.`);
      if (kind === "STOP_DROPPED") { setStopName(""); setDropKid(""); }
    } else setTripMsg("Failed: " + (j.error ?? "check key"));
  }

  async function sos() {
    if (!busId || !key) { setTripMsg("Select bus + driver key first."); return; }
    if (!confirm("Send EMERGENCY SOS to school office + parents?")) return;
    const r = await fetch("/api/sos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ busId, key, note: "Emergency on bus", raisedBy: "Driver" }),
    });
    setTripMsg(r.ok ? "SOS SENT — school office alerted." : "SOS failed. Call the school NOW.");
  }

  return (
    <div className="login-wrap" style={{ justifyContent: "flex-start", paddingTop: 40 }}>
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span className="mc-mark" style={{ width: 48, height: 48, fontSize: 24, margin: "0 auto" }}>M</span>
          <h1 style={{ fontSize: 20, marginTop: 10 }}>Driver App — MecguraCampus</h1>
          <p className="small">Works in the phone browser. No install needed.</p>
        </div>
        <div className="fld"><label>Your bus</label>
          <select className="inp" value={busId} onChange={(e) => setBusId(e.target.value)}>
            {buses.map((b) => <option key={b.id} value={b.id}>{b.number} • {b.route}</option>)}
          </select>
        </div>
        <div className="fld"><label>Driver key (given by school office)</label>
          <input className="inp" value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. DRV-4521" />
        </div>
        <div className="fld"><label>Position on route: {pos}%</label>
          <input type="range" min={0} max={100} value={pos} style={{ width: "100%" }}
            onChange={(e) => { setPos(Number(e.target.value)); if (running) pingOnce(Number(e.target.value)); }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!running
            ? <button className="btn btn-g" style={{ flex: 1, height: 48 }} onClick={start} type="button">Start Trip</button>
            : <button className="btn btn-danger" style={{ flex: 1, height: 48 }} onClick={stop} type="button">End Trip</button>}
        </div>
        <p className={`alert ${running ? "info" : ""} mt`} style={{ background: running ? undefined : "#F2F7F2", border: "1px solid #DFE8DF" }}>{log}</p>
        <p className="small" style={{ textAlign: "center" }}>Parents track this bus live at <b>/track/[bus]</b></p>
      </div>

      <div className="login-card mt" style={{ maxWidth: 480 }}>
        <h2 style={{ fontSize: 16 }}>Trip Updates — parents auto-notified</h2>
        {tripMsg ? <p className="alert info">{tripMsg}</p> : null}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }} className="mt">
          <button className="btn btn-d btn-sm" onClick={() => trip("TRIP_START")} type="button">Start → School</button>
          <button className="btn btn-g btn-sm" onClick={() => trip("SCHOOL_REACHED")} type="button">Reached School</button>
          <button className="btn btn-d btn-sm" onClick={() => trip("RETURN_START")} type="button">Start Return</button>
          <button className="btn btn-g btn-sm" onClick={() => trip("STOP_DROPPED")} type="button">Child Dropped ✓</button>
        </div>
        <div className="fld mt"><label>Stop name (for drop)</label>
          <input className="inp" value={stopName} onChange={(e) => setStopName(e.target.value)} placeholder="e.g. Model Town stop" />
        </div>
        <div className="fld"><label>Child name (for drop — parent gets “reached” SMS)</label>
          <input className="inp" value={dropKid} onChange={(e) => setDropKid(e.target.value)} placeholder="e.g. Arshdeep Singh" />
        </div>
        <button className="btn btn-danger" style={{ width: "100%", height: 52, fontSize: 16 }} onClick={sos} type="button">🆘 EMERGENCY SOS</button>
      </div>
    </div>
  );
}
