import { and, eq, ilike, or } from "drizzle-orm";
import { getSearchResults } from "./catalog";
import { getApprovedPodcasts } from "./spotify";
import { getDb } from "./db";
import { videos, channels } from "./schema";

/** Editorial taxonomy and approved media share one server-side discovery contract.
 * Bounded ILIKE queries are appropriate for the initial catalogue. Add PostgreSQL
 * full-text/trigram indexes before a large video catalogue is launched. */
export async function searchContent(
  query: string,
  type = "",
  subject = "",
  level = "",
  sort = "relevance",
) {
  const q = query.trim().slice(0, 120);
  const editorial = await getSearchResults(q, type, subject, level, sort);
  const podcasts =
    (!type || type === "podcast") && !subject && !level
      ? await getApprovedPodcasts()
      : [];
  const matching = podcasts
    .filter((p) => !q || p.title.toLowerCase().includes(q.toLowerCase()))
    .map((p) => ({
      id: p.spotifyId,
      title: p.title,
      description: "Spotify podcast · " + p.kind,
      type: "podcast",
      url: "/podcasts/" + p.kind + "/" + p.spotifyId,
      subject: "",
      image: "podcast-wave.svg",
      level: "",
    }));
  const db = await getDb();
  const term = "%" + q.replace(/[\\%_]/g, "\\$&") + "%";
  const published =
    !type || type === "video"
      ? await db
          .select({
            id: videos.id,
            title: videos.title,
            description: videos.description,
            subject: videos.subject,
            level: videos.level,
          })
          .from(videos)
          .innerJoin(channels, eq(channels.id, videos.channelId))
          .where(
            and(
              eq(videos.visibility, "public"),
              eq(videos.moderationState, "approved"),
              eq(videos.processingStatus, "ready"),
              eq(channels.approved, true),
              q
                ? or(ilike(videos.title, term), ilike(videos.description, term))
                : undefined,
              subject ? eq(videos.subject, subject) : undefined,
              level ? eq(videos.level, level) : undefined,
            ),
          )
          .limit(60)
      : [];
  const creators =
    (!type || type === "channel") && !subject && !level
      ? await db
          .select({
            id: channels.id,
            title: channels.name,
            description: channels.description,
          })
          .from(channels)
          .where(
            and(
              eq(channels.approved, true),
              q
                ? or(
                    ilike(channels.name, term),
                    ilike(channels.description, term),
                  )
                : undefined,
            ),
          )
          .limit(30)
      : [];
  const results = [
    ...editorial,
    ...matching,
    ...published.map((v) => ({
      ...v,
      type: "video",
      url: "/watch/" + v.id,
      image: "video-placeholder.svg",
    })),
    ...creators.map((c) => ({
      ...c,
      type: "channel",
      url: "/channels/" + c.id,
      image: "default-avatar.svg",
      subject: "",
      level: "",
    })),
  ];
  return sort === "alphabetical"
    ? results.sort((a, b) => a.title.localeCompare(b.title))
    : results;
}
