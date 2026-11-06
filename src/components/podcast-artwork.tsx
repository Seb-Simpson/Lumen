"use client";
import { useState } from "react";
import { AudioLines } from "lucide-react";
/** Broken or unavailable remote artwork becomes a deliberate local audio emblem. */
export function PodcastArtwork({ url }: { url: string | null | undefined }) {
  const [failed, setFailed] = useState(false);
  return url && !failed ? (
    <img
      src={`/api/podcasts/artwork?url=${encodeURIComponent(url)}`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <AudioLines size={52} strokeWidth={1} />
  );
}
