"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Play, ShieldCheck, Monitor } from "lucide-react";
import "./video.css";

export type VideoSource = {
  url: string;
  type?: string;
  captions?: { src: string; language: string; label: string }[];
};
export type VideoChapter = { title: string; startSeconds: number };
export function VideoPlayer({
  source,
  poster,
  title,
  videoId,
  chapters = [],
  initialPosition = 0,
}: {
  source: VideoSource | null;
  poster?: string | null;
  title: string;
  videoId: string;
  chapters?: VideoChapter[];
  initialPosition?: number;
}) {
  const player = useRef<HTMLVideoElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const lastProgress = useRef(0);
  const [theatre, setTheatre] = useState(false);
  const [speed, setSpeed] = useState("1");
  const [focus, setFocus] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (player.current) player.current.playbackRate = Number(speed);
  }, [speed]);
  useEffect(() => {
    setFocus(document.documentElement.dataset.focus === "true");
  }, []);
  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    fetch(`/api/video-progress?videoId=${encodeURIComponent(videoId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.positionSeconds && player.current) {
          const restore = () => {
            if (player.current)
              player.current.currentTime = Math.min(
                data.positionSeconds,
                player.current.duration || data.positionSeconds,
              );
          };
          if (player.current.readyState > 0) restore();
          else
            player.current.addEventListener("loadedmetadata", restore, {
              once: true,
            });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [source, videoId]);
  function toggleFocus() {
    const next = !focus;
    setFocus(next);
    document.documentElement.dataset.focus = next ? "true" : "false";
    localStorage.setItem("lumen-focus", String(next));
  }
  async function saveProgress() {
    const time = player.current?.currentTime;
    if (!time || Date.now() - lastProgress.current < 15000) return;
    lastProgress.current = Date.now();
    // Authenticated endpoint ignores unavailable videos and never records anonymous viewing.
    await fetch("/api/video-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, positionSeconds: Math.floor(time) }),
    }).catch(() => {});
  }
  function keyboard(event: React.KeyboardEvent) {
    const video = player.current;
    if (
      !video ||
      ["INPUT", "SELECT", "BUTTON"].includes(
        (event.target as HTMLElement).tagName,
      )
    )
      return;
    switch (event.key.toLowerCase()) {
      case " ":
      case "k":
        event.preventDefault();
        if (video.paused) void video.play().catch(() => {});
        else video.pause();
        break;
      case "arrowright":
        event.preventDefault();
        video.currentTime = Math.min(
          video.duration || 0,
          video.currentTime + 5,
        );
        break;
      case "arrowleft":
        event.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
        break;
      case "m":
        video.muted = !video.muted;
        break;
      case "f":
        void container.current?.requestFullscreen().catch(() => {});
        break;
      case "t":
        setTheatre((value) => !value);
        break;
    }
  }
  if (!source)
    return (
      <div className="video-unavailable">
        <img src="/assets/video-placeholder.svg" alt="" />
        <h2 className="serif">A place for ideas in motion.</h2>
        <p>
          This video does not have an available media source. Playback controls
          will appear when a published video is ready.
        </p>
        <span>
          <ShieldCheck size={14} /> No preview or stream is being simulated.
        </span>
      </div>
    );
  return (
    <div
      className={`video-player ${theatre ? "video-theatre" : ""}`}
      ref={container}
      onKeyDown={keyboard}
      tabIndex={0}
      role="region"
      aria-label={`${title} video player`}
    >
      <video
        ref={player}
        controls
        preload="metadata"
        poster={poster || undefined}
        playsInline
        onError={() => setError(true)}
        onTimeUpdate={saveProgress}
        onPause={() => {
          lastProgress.current = 0;
          void saveProgress();
        }}
        onLoadedMetadata={() => {
          if (player.current && initialPosition > 0)
            player.current.currentTime = Math.min(
              initialPosition,
              player.current.duration,
            );
        }}
      >
        <source src={source.url} type={source.type} />
        {source.captions?.map((track) => (
          <track
            key={track.language}
            kind="captions"
            src={track.src}
            srcLang={track.language}
            label={track.label}
          />
        ))}
        Your browser cannot play this media.
      </video>
      {error && (
        <p role="alert" className="video-error">
          This media could not be loaded. Please try again later.
        </p>
      )}
      <div className="video-tools">
        <label>
          Playback speed{" "}
          <select
            value={speed}
            onChange={(event) => setSpeed(event.target.value)}
            aria-label="Playback speed"
          >
            {["0.5", "0.75", "1", "1.25", "1.5", "2"].map((value) => (
              <option key={value} value={value}>
                {value}×
              </option>
            ))}
          </select>
        </label>
        <button
          className="button"
          onClick={() => setTheatre((value) => !value)}
        >
          {theatre ? <Minimize2 size={15} /> : <Maximize2 size={15} />} Theatre
        </button>
        <button className="button" aria-pressed={focus} onClick={toggleFocus}>
          <Monitor size={15} /> Focus mode
        </button>
      </div>
      {chapters.length > 0 && (
        <div className="video-chapters" aria-label="Video chapters">
          {chapters.map((chapter) => (
            <button
              className="button"
              key={chapter.startSeconds}
              onClick={() => {
                if (player.current)
                  player.current.currentTime = chapter.startSeconds;
              }}
            >
              <Play size={13} />
              {chapter.title}
            </button>
          ))}
        </div>
      )}
      <p className="video-keyboard">
        Keyboard: Space / K play & pause · ← / → seek · M mute · F fullscreen ·
        T theatre. Captions appear in the player when supplied.
      </p>
    </div>
  );
}
