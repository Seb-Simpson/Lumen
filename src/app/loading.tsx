export default function Loading() {
  return (
    <div className="loading-layout" role="status" aria-label="Loading Lumen">
      <div
        className="skeleton"
        style={{ height: 18, width: 180, marginBottom: 25 }}
      />
      <div className="skeleton" style={{ height: 350, marginBottom: 30 }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 20,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div className="skeleton" style={{ height: 180 }} key={i} />
        ))}
      </div>
      <span className="sr-only">Loading your next discovery…</span>
    </div>
  );
}
