"use client";

import { useCallback, useEffect, useState } from "react";

interface Bus { id: string; number: string; route: string; kids: number; status: string; position: number; speed: number; at: string | null }

/** Public parent tracking link — share per bus, no login needed. */
export default function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const [bus, setBus] = useState<Bus | null>(null);
  const [id, setId] = useState("");

  const load = useCallback(async (bid: string) => {
    const r = await fetch(`/api/tracking/live?busId=${bid}`);
    if (!r.ok) return;
    const list: Bus[] = (await r.json()).buses;
    if (list.length) setBus(list[0]);
  }, []);

  useEffect(() => { params.then((p) => { setId(p.id); load(p.id); }); }, [params, load]);
  useEffect(() => {
    if (!id) return;
    const h = setInterval(() => load(id), 8000);
    return () => clearInterval(h);
  }, [id, load]);

  return (
    <div className="login-wrap" style={{ justifyContent: "flex-start", paddingTop: 40 }}>
      <div className="login-card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <span className="mc-mark" style={{ width: 48, height: 48, fontSize: 24, margin: "0 auto" }}>M</span>
          <h1 style={{ fontSize: 20, marginTop: 10 }}>Live Bus Tracking</h1>
          <p className="small">MecguraCampus • auto-refreshes every 8 seconds</p>
        </div>
        {!bus ? <div className="skel" /> : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>{bus.number}</b>
              {bus.status === "Live" ? <span className="bdg g">● LIVE</span> : <span className="bdg r">○ OFFLINE</span>}
            </div>
            <p className="small mt">{bus.route} • {bus.kids} students on board</p>
            <div style={{ position: "relative", height: 120, background: "linear-gradient(#e8f3ff,#f2f7f2)", border: "1px solid #DFE8DF", borderRadius: 14, overflow: "hidden", marginTop: 10 }}>
              <div style={{ position: "absolute", top: 56, left: 10, right: 10, borderTop: "4px dashed #94a3b8" }} />
              <div style={{ position: "absolute", top: 20, fontSize: 26, transition: "left 1s", left: `calc(${bus.position}% )` }}>🚌</div>
              <div className="small" style={{ position: "absolute", bottom: 8, left: 12 }}>Home</div>
              <div className="small" style={{ position: "absolute", bottom: 8, right: 12 }}>School</div>
            </div>
            <p className="small mt">
              {bus.status === "Live"
                ? `Approx. ${(100 - bus.position) * 120} m from school • ${bus.speed} km/h`
                : "Bus is currently offline."}
              {bus.at ? <><br />Last update: {new Date(bus.at).toLocaleTimeString("en-IN")}</> : null}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
