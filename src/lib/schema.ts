import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
const owned = () => ({
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const collections = pgTable("collections", {
  ...owned(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
});
export const goals = pgTable("goals", {
  ...owned(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
});
export const notes = pgTable("notes", {
  ...owned(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
});
export const savedPodcasts = pgTable(
  "saved_podcasts",
  {
    ...owned(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    kind: text("kind").notNull(),
    spotifyId: text("spotify_id").notNull(),
    collectionId: text("collection_id").references(() => collections.id, {
      onDelete: "set null",
    }),
  },
  (t) => [uniqueIndex("saved_podcast_owner_url").on(t.userId, t.url)],
);
export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  preferences: jsonb("preferences")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const learningPaths = pgTable("learning_paths", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  subject: text("subject").notNull(),
  level: text("level").notNull(),
  published: boolean("published").notNull().default(false),
});
export const pathSteps = pgTable("path_steps", {
  id: text("id").primaryKey(),
  pathId: text("path_id")
    .notNull()
    .references(() => learningPaths.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  subjectSlug: text("subject_slug"),
  resourceUrl: text("resource_url"),
});
export const learningProgress = pgTable(
  "learning_progress",
  {
    ...owned(),
    pathId: text("path_id").notNull(),
    stepId: text("step_id").notNull(),
    completed: boolean("completed").notNull().default(false),
  },
  (t) => [uniqueIndex("progress_owner_step").on(t.userId, t.pathId, t.stepId)],
);
export const channels = pgTable("channels", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  avatarUrl: text("avatar_url"),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const videos = pgTable("videos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  creatorId: text("creator_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  subtopics: jsonb("subtopics").$type<string[]>().notNull().default([]),
  level: text("level").notNull().default("all"),
  language: text("language").notNull().default("en"),
  durationSeconds: integer("duration_seconds"),
  thumbnailUrl: text("thumbnail_url"),
  mediaAssetRef: text("media_asset_ref"),
  transcriptRef: text("transcript_ref"),
  publishedAt: timestamp("published_at"),
  visibility: text("visibility").notNull().default("private"),
  moderationState: text("moderation_state").notNull().default("pending"),
  processingStatus: text("processing_status").notNull().default("draft"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  metrics: jsonb("metrics").notNull().default({}),
  chapters: jsonb("chapters").notNull().default([]),
  resources: jsonb("resources").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const reports = pgTable("reports", {
  ...owned(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  reason: text("reason").notNull(),
  state: text("state").notNull().default("pending"),
});
export const uploadJobs = pgTable("upload_jobs", {
  ...owned(),
  videoId: text("video_id").references(() => videos.id, {
    onDelete: "cascade",
  }),
  storageKey: text("storage_key"),
  contentType: text("content_type"),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  state: text("state").notNull().default("disabled"),
  moderationResult: jsonb("moderation_result"),
});
export const subscriptions = pgTable(
  "subscriptions",
  {
    ...owned(),
    channelId: text("channel_id")
      .notNull()
      .references(() => channels.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("subscription_owner_channel").on(t.userId, t.channelId)],
);
export const watchHistory = pgTable(
  "watch_history",
  {
    ...owned(),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    positionSeconds: integer("position_seconds").notNull().default(0),
  },
  (t) => [uniqueIndex("history_owner_video").on(t.userId, t.videoId)],
);
export const savedResources = pgTable(
  "saved_resources",
  {
    ...owned(),
    collectionId: text("collection_id").references(() => collections.id, {
      onDelete: "set null",
    }),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
  },
  (t) => [
    uniqueIndex("saved_resource_owner").on(
      t.userId,
      t.resourceType,
      t.resourceId,
    ),
  ],
);
export const blockedUsers = pgTable("blocked_users", {
  ...owned(),
  blockedUserId: text("blocked_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
export const searchHistory = pgTable(
  "search_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    query: text("query").notNull(),
    searchedAt: timestamp("searched_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("search_history_owner_query").on(t.userId, t.query)],
);
