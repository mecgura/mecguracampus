"use client";

import { useCallback, useEffect, useState } from "react";

interface Bus {
  id: string; number: string; route: string; kids: number;
  status: string; position: number; speed: number; at: string | null;
}

export default function TransportPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await fetch("/api/tracking/live");
    if (r.ok) setBuses((await r.json()).buses);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const h = setInterval(load, 5000);
    return () => clearInterval(h);
  }, [load]);

  const offline = buses.filter((b) => b.status !== "Live");

  return (
    <div>
      <div className="mc-top">
        <div>
          <h1>Transport — Live GPS</h1>
          <p>Real driver-app positions, refreshed every 5 seconds. Share per-bus parent links.</p>
        </div>
        <div className="mc-actions">
          <a className="btn btn-o" href="/driver" target="_blank" rel="noreferrer">Open Driver App</a>
        </div>
      </div>
      {loading ? <div className="skel" /> : (
        <div className="grid2">
          {buses.map((b) => (
            <div className={`card ${b.status === "Live" ? "" : "soft"}`} key={b.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>{b.number}</h2>
                {b.status === "Live" ? <span className="bdg g">● LIVE</span> : <span className="bdg r">○ OFFLINE</span>}
              </div>
              <p className="small mt">{b.route} • {b.kids} students on board</p>
              <div style={{ position: "relative", height: 120, background: "linear-gradient(#e8f3ff,#f2f7f2)", border: "1px solid #DFE8DF", borderRadius: 14, overflow: "hidden", marginTop: 10 }}>
                <div style={{ position: "absolute", top: 56, left: 10, right: 10, borderTop: "4px dashed #94a3b8" }} />
                <div style={{ position: "absolute", top: 20, fontSize: 26, transition: "left 1s", left: `calc(${b.status === "Live" ? b.position : 80}% )` }}>🚌</div>
                <div className="small" style={{ position: "absolute", bottom: 8, left: 12 }}>Home</div>
                <div className="small" style={{ position: "absolute", bottom: 8, right: 12 }}>School</div>
              </div>
              <p className="small mt">
                {b.status === "Live"
                  ? `Approx. ${(100 - b.position) * 120} m from school • ${b.speed} km/h`
                  : "Last signal lost — contact the driver."}
                {b.at ? <><br />Last ping: {new Date(b.at).toLocaleTimeString("en-IN")}</> : null}
              </p>
              <p className="small">Parent link: <a href={`/track/${b.id}`} target="_blank" rel="noreferrer">/track/{b.id.slice(0, 8)}…</a></p>
            </div>
          ))}
        </div>
      )}
      <div className="card mt">
        <h2>Safety &amp; Speed Alerts</h2>
        {offline.length === 0
          ? <p className="small">All buses are live and within limits.</p>
          : offline.map((b) => (
            <div className="check" key={b.id}>
              <span className="box"></span>
              <span><b>{b.number} OFFLINE</b> — {b.route}. Ask the driver to open the driver app and press Start Trip.</span>
            </div>
          ))}
      </div>
    </div>
  );
}
