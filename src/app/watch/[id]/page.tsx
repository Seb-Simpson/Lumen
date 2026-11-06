import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getDb } from "@/lib/db";
import { videos, channels } from "@/lib/schema";
import {
  VideoPlayer,
  type VideoChapter,
  type VideoSource,
} from "@/components/video-player";
export const dynamic = "force-dynamic";
export const metadata = { title: "Watch" };
export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const [published] = await db
    .select({ video: videos, channel: channels })
    .from(videos)
    .innerJoin(channels, eq(channels.id, videos.channelId))
    .where(
      and(
        eq(videos.id, id),
        eq(videos.visibility, "public"),
        eq(videos.moderationState, "approved"),
        eq(videos.processingStatus, "ready"),
        eq(channels.approved, true),
      ),
    )
    .limit(1);
  const video = published?.video;
  if (!video)
    return (
      <div className="page-wrap">
        <Link className="video-back" href="/explore">
          <ArrowLeft size={15} /> Back to discovery
        </Link>
        <VideoPlayer source={null} title="Unavailable video" videoId={id} />
        <section className="video-missing">
          <p className="eyebrow">NOT AVAILABLE TO WATCH</p>
          <h1 className="serif">This chapter hasn’t opened yet.</h1>
          <p>
            This video may be unpublished, private, removed, or still being
            prepared. When published videos are ready, you’ll find them in
            discovery. There is plenty to explore while the shelves take shape.
          </p>
          <Link href="/subjects" className="button primary">
            Explore subjects <ArrowUpRight size={16} />
          </Link>
          <Link href="/podcasts" className="button">
            Visit the listening room
          </Link>
        </section>
      </div>
    );
  const channel = published.channel;
  // Asset references are storage keys until an adapter resolves them. Local, same-origin
  // media paths are supported for integration tests and explicitly configured content.
  let source: VideoSource | null = null;
  if (
    video.mediaAssetRef &&
    /^\/media\/[a-zA-Z0-9/_-]+\.(mp4|webm)$/.test(video.mediaAssetRef)
  )
    source = {
      url: video.mediaAssetRef,
      type: video.mediaAssetRef.endsWith(".webm") ? "video/webm" : "video/mp4",
    };
  const chapters: VideoChapter[] = Array.isArray(video.chapters)
    ? video.chapters.filter(
        (chapter): chapter is VideoChapter =>
          !!chapter &&
          typeof chapter === "object" &&
          "title" in chapter &&
          typeof chapter.title === "string" &&
          "startSeconds" in chapter &&
          typeof chapter.startSeconds === "number",
      )
    : [];
  return (
    <div className="page-wrap">
      <Link className="video-back" href="/explore">
        <ArrowLeft size={15} /> Back to discovery
      </Link>
      <VideoPlayer
        source={source}
        poster={video.thumbnailUrl}
        title={video.title}
        videoId={video.id}
        chapters={chapters}
      />
      <section className="video-description">
        <p className="eyebrow">
          {video.subject} · {video.level}
        </p>
        <h1 className="serif">{video.title}</h1>
        {channel && (
          <Link href={`/channels/${channel.id}`} className="video-channel">
            {channel.name} →
          </Link>
        )}
        <p>{video.description}</p>
      </section>
    </div>
  );
}
