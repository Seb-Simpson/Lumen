import { z } from "zod";

export const MAX_SOURCE_BYTES = 2 * 1024 * 1024 * 1024;
const videoTypes = ["video/mp4", "video/webm", "video/quicktime"] as const;
const extensions: Record<(typeof videoTypes)[number], string[]> = {
  "video/mp4": ["mp4"],
  "video/webm": ["webm"],
  "video/quicktime": ["mov"],
};
/** Validates declared metadata only. A provider must inspect actual bytes before processing. */
export const uploadRequestSchema = z
  .object({
    filename: z
      .string()
      .min(1)
      .max(200)
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9._ -]*$/,
        "Use a filename without paths or special characters.",
      )
      .refine(
        (value) => !value.includes(".."),
        "Use a filename without parent directory sequences.",
      ),
    contentType: z.enum(videoTypes),
    sizeBytes: z
      .number()
      .int()
      .positive()
      .max(MAX_SOURCE_BYTES, "Source files must be 2 GiB or smaller."),
  })
  .superRefine((value, context) => {
    const extension = value.filename.split(".").pop()?.toLowerCase();
    if (!extension || !extensions[value.contentType].includes(extension))
      context.addIssue({
        code: "custom",
        path: ["filename"],
        message: "The filename extension must match the declared media type.",
      });
  });
export type UploadRequest = z.infer<typeof uploadRequestSchema>;
export function validateUploadRequest(input: unknown): UploadRequest {
  return uploadRequestSchema.parse(input);
}

export type UploadSession = {
  jobId: string;
  storageKey: string;
  signedUrl: string;
  expiresAt: Date;
  requiredHeaders: Record<string, string>;
};
export type ResolvedMedia = {
  manifestUrl: string;
  expiresAt: Date;
  format: "hls" | "dash" | "progressive";
  captionTracks: { url: string; language: string; label: string }[];
};
export type MediaProcessingEvent = {
  externalJobId: string;
  assetReference: string;
  status: "processing" | "ready" | "failed";
  durationSeconds?: number;
  captionReferences?: string[];
};
export type ModerationDecision = {
  status: "pending" | "approved" | "rejected";
  reason?: string;
  reviewedBy?: string;
};
export interface StorageAdapter {
  createSignedUpload(
    creatorId: string,
    request: UploadRequest,
  ): Promise<UploadSession>;
  inspectUploadedObject(
    storageKey: string,
  ): Promise<{
    sizeBytes: number;
    detectedContentType: string;
    checksum: string;
  }>;
  deleteObject(storageKey: string): Promise<void>;
}
export interface VideoProcessingAdapter {
  enqueue(
    storageKey: string,
    idempotencyKey: string,
  ): Promise<{ externalJobId: string }>;
  verifyWebhook(
    rawBody: string,
    signature: string,
  ): Promise<MediaProcessingEvent>;
  resolvePlayback(
    assetReference: string,
    viewerId: string | null,
  ): Promise<ResolvedMedia>;
}
export interface ModerationAdapter {
  review(assetReference: string): Promise<ModerationDecision>;
}
export interface MediaService {
  readonly available: boolean;
  createUpload(creatorId: string, input: UploadRequest): Promise<UploadSession>;
  playback(
    assetReference: string,
    viewerId: string | null,
  ): Promise<ResolvedMedia>;
}
export class MediaUnavailableError extends Error {
  constructor() {
    super("Video publishing and managed streaming are not configured.");
    this.name = "MediaUnavailableError";
  }
}
/** Default deliberately cannot issue signed URLs or claim a processing job exists. */
export const mediaService: MediaService = {
  available: false,
  async createUpload() {
    throw new MediaUnavailableError();
  },
  async playback() {
    throw new MediaUnavailableError();
  },
};

/** Future AI integrations receive genuine source text, never fabricated transcripts. */
export interface LearningIntelligenceAdapter {
  readonly enabled: boolean;
  summarize(input: {
    sourceId: string;
    transcript: string;
    language: string;
  }): Promise<{
    summary: string;
    sourceSpans: { start: number; end: number }[];
  }>;
  searchTranscript(input: {
    sourceId: string;
    transcript: string;
    query: string;
  }): Promise<{ text: string; start: number; end: number }[]>;
  explain(input: {
    question: string;
    sourceText: string;
  }): Promise<{ explanation: string; citations: string[] }>;
  quiz(input: {
    sourceText: string;
    level: string;
  }): Promise<
    {
      question: string;
      answers: string[];
      correctIndex: number;
      explanation: string;
    }[]
  >;
}
// No AI adapter is registered. UI must not present these capabilities as active.
export const learningIntelligence: LearningIntelligenceAdapter | null = null;
