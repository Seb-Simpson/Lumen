/** Spotify links are untrusted input: all requests stay on Spotify's fixed oEmbed endpoint. */
export type SpotifyLink = {
  kind: "show" | "episode";
  spotifyId: string;
  url: string;
};
export type SpotifyMetadata = SpotifyLink & {
  title: string;
  thumbnailUrl: string | null;
  provider: "Spotify";
};

export function validateSpotifyUrl(input: string): SpotifyLink | null {
  try {
    const url = new URL(input.trim());
    if (
      url.protocol !== "https:" ||
      url.hostname !== "open.spotify.com" ||
      url.port ||
      url.username ||
      url.password
    )
      return null;
    const match = /^\/(show|episode)\/([a-zA-Z0-9]{22})\/?$/.exec(url.pathname);
    if (!match) return null;
    const kind = match[1] as SpotifyLink["kind"];
    return {
      kind,
      spotifyId: match[2],
      url: `https://open.spotify.com/${kind}/${match[2]}`,
    };
  } catch {
    return null;
  }
}

export async function fetchSpotifyMetadata(
  link: SpotifyLink,
): Promise<SpotifyMetadata> {
  const parsed = validateSpotifyUrl(link.url);
  if (!parsed) throw new Error("Use a Spotify podcast show or episode link.");
  const endpoint = new URL("https://open.spotify.com/oembed");
  endpoint.searchParams.set("url", parsed.url);
  const response = await fetch(endpoint, {
    signal: AbortSignal.timeout(7000),
    redirect: "error",
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!response.ok)
    throw new Error(
      "Spotify could not find this podcast. Check the link or try again later.",
    );
  const body: unknown = await response.json();
  if (
    !body ||
    typeof body !== "object" ||
    !("title" in body) ||
    typeof body.title !== "string" ||
    !body.title.trim()
  )
    throw new Error(
      "Spotify returned incomplete podcast information. Try another link.",
    );
  let thumbnailUrl: string | null = null;
  if ("thumbnail_url" in body && typeof body.thumbnail_url === "string") {
    try {
      const thumbnail = new URL(body.thumbnail_url);
      if (
        thumbnail.protocol === "https:" &&
        [
          "i.scdn.co",
          "image-cdn-ak.spotifycdn.com",
          "image-cdn-fa.spotifycdn.com",
        ].includes(thumbnail.hostname)
      )
        thumbnailUrl = thumbnail.href;
    } catch {
      /* A missing image must not break the catalogue. */
    }
  }
  return {
    ...parsed,
    title: body.title.trim().slice(0, 300),
    thumbnailUrl,
    provider: "Spotify",
  };
}

/** Approved catalogue is operator maintained. An unset catalogue means zero public podcasts. */
export async function getApprovedPodcasts(): Promise<SpotifyMetadata[]> {
  const uniqueUrls = [
    ...new Set(
      (process.env.SPOTIFY_APPROVED_URLS ?? "")
        .split(",")
        .map((value) => validateSpotifyUrl(value)?.url)
        .filter((value): value is string => !!value),
    ),
  ];
  const links = uniqueUrls
    .slice(0, 30)
    .map((value) => validateSpotifyUrl(value)!)
    .filter(Boolean);
  const results = await Promise.allSettled(
    links.map((link) => fetchSpotifyMetadata(link)),
  );
  return results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
}
