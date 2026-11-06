import { headers } from "next/headers";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import * as schema from "./schema";

export async function getSession() {
  const { getAuth } = await import("./auth");
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
}
export async function getLibrary(userId: string) {
  const db = await getDb();
  const [
    collections,
    goals,
    notes,
    savedPodcasts,
    settings,
    progress,
    searchHistory,
  ] = await Promise.all([
    db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.userId, userId))
      .orderBy(desc(schema.collections.createdAt)),
    db
      .select()
      .from(schema.goals)
      .where(eq(schema.goals.userId, userId))
      .orderBy(desc(schema.goals.createdAt)),
    db
      .select()
      .from(schema.notes)
      .where(eq(schema.notes.userId, userId))
      .orderBy(desc(schema.notes.updatedAt)),
    db
      .select()
      .from(schema.savedPodcasts)
      .where(eq(schema.savedPodcasts.userId, userId))
      .orderBy(desc(schema.savedPodcasts.createdAt)),
    db
      .select()
      .from(schema.userPreferences)
      .where(eq(schema.userPreferences.userId, userId))
      .limit(1),
    db
      .select()
      .from(schema.learningProgress)
      .where(eq(schema.learningProgress.userId, userId)),
    db
      .select({
        query: schema.searchHistory.query,
        searchedAt: schema.searchHistory.searchedAt,
      })
      .from(schema.searchHistory)
      .where(eq(schema.searchHistory.userId, userId))
      .orderBy(desc(schema.searchHistory.searchedAt))
      .limit(20),
  ]);
  return {
    collections,
    goals,
    notes,
    savedPodcasts,
    searchHistory,
    interests: settings[0]?.interests || [],
    preferences: settings[0]?.preferences || {},
    progress: progress.map((p) => ({ ...p, stepIndex: Number(p.stepId) })),
  };
}
export async function getPublishedVideo(id: string) {
  const db = await getDb();
  const [published] = await db
    .select({ video: schema.videos })
    .from(schema.videos)
    .innerJoin(schema.channels, eq(schema.channels.id, schema.videos.channelId))
    .where(
      and(
        eq(schema.videos.id, id),
        eq(schema.videos.visibility, "public"),
        eq(schema.videos.processingStatus, "ready"),
        eq(schema.videos.moderationState, "approved"),
        eq(schema.channels.approved, true),
      ),
    )
    .limit(1);
  return published?.video || null;
}

/** Export private activity without credential accounts, session tokens or verification secrets. */
export async function getAccountData(userId: string) {
  const db = await getDb();
  const [
    library,
    watchHistory,
    subscriptions,
    savedResources,
    reports,
    blockedUsers,
    channels,
    videos,
    uploads,
  ] = await Promise.all([
    getLibrary(userId),
    db
      .select()
      .from(schema.watchHistory)
      .where(eq(schema.watchHistory.userId, userId)),
    db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, userId)),
    db
      .select()
      .from(schema.savedResources)
      .where(eq(schema.savedResources.userId, userId)),
    db.select().from(schema.reports).where(eq(schema.reports.userId, userId)),
    db
      .select()
      .from(schema.blockedUsers)
      .where(eq(schema.blockedUsers.userId, userId)),
    db
      .select()
      .from(schema.channels)
      .where(eq(schema.channels.ownerId, userId)),
    db.select().from(schema.videos).where(eq(schema.videos.creatorId, userId)),
    db
      .select()
      .from(schema.uploadJobs)
      .where(eq(schema.uploadJobs.userId, userId)),
  ]);
  return {
    library,
    watchHistory,
    subscriptions,
    savedResources,
    reports,
    blockedUsers,
    channels,
    videos,
    uploads,
  };
}
