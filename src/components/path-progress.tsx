"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
export function PathProgress({
  pathId,
  steps,
}: {
  pathId: string;
  steps: { title: string; description: string }[];
}) {
  const { data: session } = authClient.useSession();
  const [complete, setComplete] = useState<number[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!session) {
      setComplete([]);
      return;
    }
    setLoading(true);
    fetch("/api/library", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setComplete(
          (d.progress || [])
            .filter(
              (p: { pathId: string; completed: boolean }) =>
                p.pathId === pathId && p.completed,
            )
            .map((p: { stepIndex: number }) => p.stepIndex),
        );
      })
      .catch(() =>
        setError(
          "Your progress could not be loaded. Please refresh to try again.",
        ),
      )
      .finally(() => setLoading(false));
  }, [session, pathId]);
  async function toggle(i: number) {
    setBusy(i);
    setError("");
    try {
      const r = await fetch("/api/library", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "progress",
          pathId,
          stepIndex: i,
          completed: !complete.includes(i),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setComplete(
        d.progress
          .filter(
            (p: { pathId: string; completed: boolean }) =>
              p.pathId === pathId && p.completed,
          )
          .map((p: { stepIndex: number }) => p.stepIndex),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save progress.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 17,
        }}
      >
        <span className="eyebrow">{steps.length} steps · Self-directed</span>
        {session && (
          <span style={{ fontSize: 10, color: "var(--teal)" }}>
            {loading
              ? "Loading progress…"
              : `${complete.length} of ${steps.length} explored`}
          </span>
        )}
      </div>
      {session && (
        <progress
          max={steps.length}
          value={complete.length}
          style={{
            width: "100%",
            height: 5,
            accentColor: "var(--gold)",
            marginBottom: 20,
          }}
          aria-label="Learning path progress"
        />
      )}
      {error && (
        <p role="alert" className="error" style={{ marginBottom: 18 }}>
          {error}
        </p>
      )}
      <div className="path-steps">
        {steps.map((s, i) => (
          <article className="path-step" key={s.title}>
            <span className="step-index">
              {complete.includes(i) ? (
                <Check size={17} />
              ) : (
                String(i + 1).padStart(2, "0")
              )}
            </span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
              {session ? (
                <button
                  disabled={busy !== null || loading}
                  className="button small"
                  onClick={() => toggle(i)}
                >
                  {busy === i ? (
                    <Loader2 size={13} />
                  ) : complete.includes(i) ? (
                    <Check size={13} />
                  ) : null}
                  {complete.includes(i)
                    ? "Explored · Undo"
                    : "Mark as explored"}
                </button>
              ) : (
                <Link
                  href={"/sign-in?next=/learning-paths/" + pathId}
                  className="text-link"
                >
                  Sign in to save progress <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
