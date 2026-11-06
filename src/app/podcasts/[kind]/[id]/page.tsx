import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PodcastArtwork } from "@/components/podcast-artwork";
import { PodcastPlayer } from "@/components/podcast-player";
import { fetchSpotifyMetadata, validateSpotifyUrl } from "@/lib/spotify";
export const dynamic = "force-dynamic";
export const metadata = { title: "Podcast" };
export default async function PodcastPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;
  const link = validateSpotifyUrl(`https://open.spotify.com/${kind}/${id}`);
  if (!link) notFound();
  let podcast;
  try {
    podcast = await fetchSpotifyMetadata(link);
  } catch {
    /* A valid URL may refer to unavailable or regional content. */
  }
  return (
    <div className="page-wrap podcast-detail">
      <nav className="podcast-breadcrumb" aria-label="Breadcrumb">
        <Link href="/podcasts">Podcasts</Link>
        <ChevronRight size={14} />
        <span>{kind === "show" ? "Show" : "Episode"}</span>
      </nav>
      <header className="podcast-detail-header">
        <div className="podcast-detail-cover">
          <PodcastArtwork url={podcast?.thumbnailUrl} />
        </div>
        <div>
          <p className="eyebrow">
            THE LISTENING ROOM · SPOTIFY {kind.toUpperCase()}
          </p>
          <h1 className="serif">
            {podcast?.title ?? "This podcast is unavailable."}
          </h1>
          <p>
            {podcast
              ? "Follow the conversation. Find a new connection."
              : "Spotify could not return information for this link. It may have moved, be unavailable in this region, or be temporarily offline. You can try the official player or open Spotify directly."}
          </p>
        </div>
      </header>
      <PodcastPlayer
        podcast={link}
        title={podcast?.title ?? "Spotify podcast"}
      />
      <section className="panel podcast-learning">
        <p className="eyebrow">A LITTLE SPACE TO REFLECT</p>
        <h2 className="serif">Good listening is only the beginning.</h2>
        <p>
          Keep the ideas that stay with you. Save this podcast, add a note in
          Your Space, and connect it to what you’re learning next.
        </p>
        <Link className="button" href="/space">
          Open Your Space →
        </Link>
      </section>
    </div>
  );
}
