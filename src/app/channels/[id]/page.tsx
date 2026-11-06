import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Video } from "lucide-react";
import { getDb } from "@/lib/db";
import { channels, videos } from "@/lib/schema";
import "@/components/video.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Creator channel" };
export default async function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const [channel] = await db
    .select()
    .from(channels)
    .where(and(eq(channels.id, id), eq(channels.approved, true)))
    .limit(1);
  if (!channel)
    return (
      <div className="page-wrap">
        <Link className="video-back" href="/explore">
          <ArrowLeft size={15} /> Back to discovery
        </Link>
        <section className="panel channel-empty">
          <Video size={38} strokeWidth={1} />
          <p className="eyebrow">CREATOR CHANNEL</p>
          <h1 className="serif">This channel isn’t available.</h1>
          <p>
            The channel may be private, unpublished, or awaiting review. Explore
            Lumen’s subject library to find your next idea.
          </p>
          <Link className="button primary" href="/subjects">
            Explore subjects →
          </Link>
        </section>
      </div>
    );
  const published = await db
    .select({ id: videos.id, title: videos.title })
    .from(videos)
    .where(
      and(
        eq(videos.channelId, id),
        eq(videos.visibility, "public"),
        eq(videos.processingStatus, "ready"),
        eq(videos.moderationState, "approved"),
      ),
    );
  return (
    <div className="page-wrap">
      <p className="eyebrow">LUMEN CREATOR</p>
      <h1 className="serif">{channel.name}</h1>
      <p>{channel.description}</p>
      <section className="panel channel-empty">
        <h2 className="serif">Published videos</h2>
        {published.length ? (
          published.map((video) => (
            <p key={video.id}>
              <Link href={`/watch/${video.id}`}>{video.title} →</Link>
            </p>
          ))
        ) : (
          <p>This channel has no published videos yet.</p>
        )}
      </section>
    </div>
  );
}
