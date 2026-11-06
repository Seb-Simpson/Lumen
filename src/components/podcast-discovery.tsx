"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  AudioLines,
  ExternalLink,
  Link2,
  Search,
} from "lucide-react";
import { validateSpotifyUrl, type SpotifyMetadata } from "@/lib/spotify";
import { PodcastArtwork } from "./podcast-artwork";
import "./podcasts.css";

export function PodcastDiscovery({
  podcasts,
}: {
  podcasts: SpotifyMetadata[];
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<SpotifyMetadata | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const filtered = podcasts.filter(
    (podcast) =>
      (filter === "all" || podcast.kind === filter) &&
      podcast.title.toLowerCase().includes(query.toLowerCase()),
  );
  async function inspect(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPreview(null);
    const link = validateSpotifyUrl(url);
    if (!link) {
      setError(
        "Enter a Spotify podcast show or episode link, beginning https://open.spotify.com/.",
      );
      return;
    }
    setPending(true);
    try {
      const response = await fetch(
        `/api/podcasts/metadata?url=${encodeURIComponent(link.url)}`,
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to load podcast information.");
      setPreview(data);
    } catch (issue) {
      setError(
        issue instanceof Error
          ? issue.message
          : "Unable to contact Spotify. Try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <section className="podcast-intro">
        <div>
          <p className="eyebrow">KNOWLEDGE, IN GOOD COMPANY</p>
          <h1 className="serif">
            Let curiosity
            <br />
            <em>set the tone.</em>
          </h1>
          <p>
            Ideas worth listening to. A considered home for educational
            conversations, wherever your day takes you.
          </p>
          <a className="button primary" href="#add-podcast">
            <Link2 size={16} /> Bring a podcast
          </a>
        </div>
        <div className="podcast-art" aria-hidden="true">
          <img src="/assets/podcast-wave.svg" alt="" />
          <span>LISTEN. WONDER. UNDERSTAND.</span>
        </div>
      </section>
      <section className="podcast-catalogue" aria-labelledby="catalogue-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE LISTENING ROOM</p>
            <h2 id="catalogue-title" className="serif">
              A little more perspective.
            </h2>
          </div>
          <span className="podcast-count">
            {podcasts.length} approved{" "}
            {podcasts.length === 1 ? "podcast" : "podcasts"}
          </span>
        </div>
        <div className="podcast-toolbar">
          <div className="podcast-tabs" aria-label="Filter podcasts">
            {[
              ["all", "All podcasts"],
              ["show", "Shows"],
              ["episode", "Episodes"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? "selected" : ""}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="podcast-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the catalogue"
              aria-label="Search approved podcasts"
            />
          </label>
        </div>
        {filtered.length > 0 ? (
          <div className="podcast-grid">
            {filtered.map((podcast) => (
              <PodcastCard key={podcast.spotifyId} podcast={podcast} />
            ))}
          </div>
        ) : (
          <div className="panel podcast-empty">
            <AudioLines size={35} strokeWidth={1} />
            <div>
              <h3 className="serif">
                {podcasts.length
                  ? "No conversations found."
                  : "A thoughtful catalogue takes time."}
              </h3>
              <p>
                {podcasts.length
                  ? "Try a different title or filter."
                  : "Our approved podcast shelves are being prepared. In the meantime, bring a Spotify podcast you love and make it part of your learning space."}
              </p>
            </div>
          </div>
        )}
      </section>
      <section className="panel podcast-import" id="add-podcast">
        <div>
          <p className="eyebrow">YOUR NEXT GOOD LISTEN</p>
          <h2 className="serif">Bring your own curiosity.</h2>
          <p>
            Paste an official Spotify show or episode link to preview it, listen
            here, or save it to Your Space. Your saved links stay private.
          </p>
        </div>
        <form onSubmit={inspect}>
          <label htmlFor="spotify-link">Spotify podcast link</label>
          <div className="podcast-url-row">
            <input
              className="field"
              id="spotify-link"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://open.spotify.com/show/…"
              required
              maxLength={500}
            />
            <button className="button primary" disabled={pending} type="submit">
              {pending ? "Looking up…" : "Find podcast"}
              <ArrowRight size={16} />
            </button>
          </div>
          <p className="podcast-fine">
            Metadata is requested from Spotify when you submit. Playback loads
            only when you choose to listen.
          </p>
          {error && (
            <p role="alert" className="podcast-error">
              {error}
            </p>
          )}
        </form>
        {preview && (
          <div className="podcast-preview" role="status">
            <PodcastCard podcast={preview} />
            <p>Podcast found through Spotify. Open it to listen or save.</p>
          </div>
        )}
      </section>
      <p className="podcast-fine">
        Spotify playback is subject to availability, your region, browser
        permissions and Spotify’s account requirements. Some content may be
        previews.{" "}
        <a
          href="https://www.spotify.com/legal/end-user-agreement/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Spotify terms <ExternalLink size={12} />
        </a>
      </p>
    </>
  );
}

export function PodcastCard({ podcast }: { podcast: SpotifyMetadata }) {
  return (
    <Link
      className="podcast-card"
      href={`/podcasts/${podcast.kind}/${podcast.spotifyId}`}
    >
      <div className="podcast-cover">
        <PodcastArtwork url={podcast.thumbnailUrl} />
      </div>
      <div>
        <span className="eyebrow">
          SPOTIFY · {podcast.kind === "show" ? "PODCAST SHOW" : "EPISODE"}
        </span>
        <h3>{podcast.title}</h3>
        <span className="podcast-open">
          Explore & listen <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}
