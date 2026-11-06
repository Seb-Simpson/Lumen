import type { Metadata } from "next";
import { PodcastDiscovery } from "@/components/podcast-discovery";
import { getApprovedPodcasts } from "@/lib/spotify";
export const metadata: Metadata = {
  title: "Podcasts",
  description:
    "A considered home for educational podcasts. Discover, listen and save ideas worth your time.",
};
export const dynamic = "force-dynamic";
export default async function PodcastsPage() {
  const podcasts = await getApprovedPodcasts();
  return (
    <div className="page-wrap">
      <PodcastDiscovery podcasts={podcasts} />
    </div>
  );
}
