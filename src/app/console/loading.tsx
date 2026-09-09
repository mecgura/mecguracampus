export default function ConsoleLoading() {
  return (
    <div>
      <div className="skel" style={{ height: 40, maxWidth: 320, marginBottom: 20 }} />
      <div className="grid4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skel" />
        ))}
      </div>
      <div className="skel mt" style={{ height: 200 }} />
      <p className="small mt">Loading page…</p>
    </div>
  );
}
