"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-wrap">
      <section className="empty-state" style={{ margin: "40px 0" }}>
        <img src="/assets/empty-search.svg" alt="" />
        <h2>A moment to find our bearings.</h2>
        <p>This part of Lumen could not be loaded. Please try again.</p>
        <button className="button primary" onClick={reset}>
          Try again
        </button>
      </section>
    </div>
  );
}
