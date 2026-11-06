"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, ChevronRight, Headphones } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { paths, subjects } from "@/lib/catalog";
import type { Library } from "./personal-space";
import "./personal.css";

/** Account-only suggestions use volunteered interests and saved progress, never viewing-time profiles. */
export function HomePersonalized() {
  const { data: session } = authClient.useSession();
  const [library, setLibrary] = useState<Library | null>(null);
  const userId = session?.user.id;
  useEffect(() => {
    setLibrary(null);
    if (!userId) return;
    const controller = new AbortController();
    void fetch("/api/library", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          if (!controller.signal.aborted) setLibrary(data);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [userId]);
  if (!session || !library) return null;
  const continued = paths
    .filter((path) =>
      library.progress?.some(
        (item) => item.pathId === path.slug && item.completed,
      ),
    )
    .slice(0, 2);
  const interests = subjects
    .filter((subject) => library.interests.includes(subject.slug))
    .slice(0, 3);
  const podcasts = library.savedPodcasts.slice(0, 2);
  if (!continued.length && !interests.length && !podcasts.length) return null;
  return (
    <section
      className="discovery-section home-personalized"
      aria-labelledby="your-next-discovery"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">A PLACE OF YOUR OWN</span>
          <h2 id="your-next-discovery">Pick up a thread.</h2>
          <p>Your ideas, interests and journeys. Ready when you are.</p>
        </div>
        <Link className="section-link" href="/space">
          Your Space <ArrowRight size={17} />
        </Link>
      </div>
      {continued.length > 0 && (
        <div className="home-continue-paths">
          {continued.map((path) => {
            const completed = new Set(
              library.progress
                ?.filter((item) => item.pathId === path.slug && item.completed)
                .map((item) => item.stepIndex),
            ).size;
            const image = subjects.find(
              (subject) => subject.slug === path.subject,
            )!.image;
            return (
              <Link
                className="home-continue-path"
                href={"/learning-paths/" + path.slug}
                key={path.slug}
              >
                <img src={"/assets/" + image} alt="" loading="lazy" />
                <div>
                  <span className="eyebrow">
                    {completed === path.steps.length
                      ? "A journey to revisit"
                      : "Continue learning"}
                  </span>
                  <h3>{path.title}</h3>
                  <progress
                    max={path.steps.length}
                    value={completed}
                    aria-label={`${path.title}: ${completed} of ${path.steps.length} steps explored`}
                  />
                  <p>
                    {completed} of {path.steps.length} steps explored{" "}
                    <ChevronRight size={13} />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {interests.length > 0 && (
        <div className="home-interest-row">
          {interests.map((subject) => (
            <Link
              className="home-interest"
              href={"/subjects/" + subject.slug}
              key={subject.slug}
            >
              <img src={"/assets/" + subject.image} alt="" loading="lazy" />
              <div>
                <span className="eyebrow">Because you chose this interest</span>
                <h3>{subject.name}</h3>
                <p>{subject.question}</p>
              </div>
              <ChevronRight size={17} />
            </Link>
          ))}
        </div>
      )}
      {podcasts.length > 0 && (
        <div className="home-saved-podcasts">
          <span className="eyebrow">
            <Bookmark size={13} /> Saved for later
          </span>
          {podcasts.map((podcast) => (
            <Link
              href={`/podcasts/${podcast.kind}/${podcast.spotifyId}`}
              key={podcast.id}
            >
              <Headphones size={16} />
              <span>{podcast.title}</span>
              <ChevronRight size={14} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
