"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Headphones,
  PauseCircle,
  ShieldCheck,
} from "lucide-react";
import type { SpotifyLink } from "@/lib/spotify";
import "./podcasts.css";

export function PodcastPlayer({
  podcast,
  title,
}: {
  podcast: SpotifyLink;
  title: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  useEffect(() => {
    function applyConsent() {
      try {
        const consent = JSON.parse(
          localStorage.getItem("lumen-consent") || "{}",
        );
        if (consent.embeds === true) setLoaded(true);
        else setLoaded(false);
      } catch {
        setLoaded(false);
      }
    }
    applyConsent();
    window.addEventListener("lumen-consent-change", applyConsent);
    window.addEventListener("storage", applyConsent);
    return () => {
      window.removeEventListener("lumen-consent-change", applyConsent);
      window.removeEventListener("storage", applyConsent);
    };
  }, []);
  async function save() {
    setSaving(true);
    setMessage("");
    setNeedsLogin(false);
    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "podcast", url: podcast.url }),
      });
      const data = await response.json();
      if (response.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!response.ok)
        throw new Error(data.error || "Could not save this podcast.");
      setSaved(true);
      setMessage("Saved to your private library.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save podcast. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="podcast-player-area">
      <div className="podcast-player-frame">
        {loaded ? (
          <>
            <SpotifyOfficialEmbed podcast={podcast} title={title} />
            <div className="podcast-player-note">
              <span>
                Official Spotify player · playback availability varies
              </span>
              <button className="button" onClick={() => setLoaded(false)}>
                <PauseCircle size={15} /> Close player
              </button>
            </div>
          </>
        ) : (
          <div className="podcast-consent">
            <Headphones size={38} strokeWidth={1} />
            <h2 className="serif">Make room for a good idea.</h2>
            <p>
              Load Spotify’s official player to listen here. Spotify receives
              your IP address and device information and may use its own
              cookies. This choice loads this player for this visit.
            </p>
            <button className="button primary" onClick={() => setLoaded(true)}>
              <Headphones size={16} /> Load Spotify player
            </button>
            <span>
              <ShieldCheck size={13} /> No player is loaded until you choose.
            </span>
          </div>
        )}
      </div>
      <div className="podcast-actions">
        <button
          className="button primary"
          onClick={save}
          disabled={saving || saved}
        >
          {saved ? <Check size={16} /> : <Bookmark size={16} />}
          {saving
            ? "Saving…"
            : saved
              ? "Saved to Your Space"
              : "Save to Your Space"}
        </button>
        <a
          href={podcast.url}
          className="button"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Spotify <ArrowUpRight size={16} />
        </a>
      </div>
      {needsLogin && (
        <p className="podcast-feedback">
          Your listening library is private.{" "}
          <Link
            href={`/sign-in?next=${encodeURIComponent(`/podcasts/${podcast.kind}/${podcast.spotifyId}`)}`}
          >
            Sign in to save this podcast.
          </Link>
        </p>
      )}
      {message && (
        <p className="podcast-feedback" role="status">
          {message} {saved && <Link href="/space">Visit Your Space →</Link>}
        </p>
      )}
      <p className="podcast-fine">
        Use the official player’s controls to play, pause and select available
        episodes. Full-length playback and episode selection depend on Spotify’s
        supported player, your location and account. Playback stops when you
        leave this page.
      </p>
    </div>
  );
}

type SpotifyController = {
  togglePlay: () => void;
  pause: () => void;
  destroy: () => void;
  addListener: (event: string, callback: () => void) => void;
};
type SpotifyApi = {
  createController: (
    element: HTMLElement,
    options: { uri: string; width: string; height: number },
    callback: (controller: SpotifyController) => void,
  ) => void;
};
type SpotifyWindow = Window & {
  onSpotifyIframeApiReady?: (api: SpotifyApi) => void;
  lumenSpotifyApi?: Promise<SpotifyApi>;
};
function loadSpotifyApi(): Promise<SpotifyApi> {
  const target = window as SpotifyWindow;
  if (target.lumenSpotifyApi) return target.lumenSpotifyApi;
  target.lumenSpotifyApi = new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("Spotify player is taking too long to respond.")),
      12000,
    );
    target.onSpotifyIframeApiReady = (api) => {
      window.clearTimeout(timeout);
      resolve(api);
    };
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Spotify could not be reached."));
    };
    document.head.appendChild(script);
  });
  return target.lumenSpotifyApi;
}
function SpotifyOfficialEmbed({
  podcast,
  title,
}: {
  podcast: SpotifyLink;
  title: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<SpotifyController | null>(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setFallback(false);
    const target = document.createElement("div");
    host.current?.appendChild(target);
    loadSpotifyApi()
      .then((api) => {
        if (cancelled) return;
        api.createController(
          target,
          {
            uri: `spotify:${podcast.kind}:${podcast.spotifyId}`,
            width: "100%",
            height: 352,
          },
          (created) => {
            if (cancelled) {
              created.destroy();
              return;
            }
            controller.current = created;
            created.addListener("ready", () => {
              if (!cancelled) setReady(true);
            });
          },
        );
      })
      .catch(() => {
        if (!cancelled) setFallback(true);
      });
    return () => {
      cancelled = true;
      controller.current?.destroy();
      controller.current = null;
      target.remove();
    };
  }, [podcast.kind, podcast.spotifyId]);
  return (
    <div className="spotify-official-embed">
      <div
        ref={host}
        aria-label={`${title} official Spotify player`}
        style={{ display: fallback ? "none" : "block", minHeight: 352 }}
      />
      {fallback ? (
        <>
          <iframe
            title={`${title} — official Spotify player`}
            src={`https://open.spotify.com/embed/${podcast.kind}/${podcast.spotifyId}?utm_source=generator&theme=0`}
            width="100%"
            height="352"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            allowFullScreen
          />
          <p className="podcast-fine">
            Spotify’s remote controls are unavailable. Use the official player
            above.
          </p>
        </>
      ) : (
        <div className="spotify-api-controls">
          <button
            className="button"
            disabled={!ready}
            onClick={() => controller.current?.togglePlay()}
          >
            {ready ? "Play / pause" : "Connecting to Spotify…"}
          </button>
          <button
            className="button"
            disabled={!ready}
            onClick={() => controller.current?.pause()}
          >
            Pause
          </button>
        </div>
      )}
    </div>
  );
}
