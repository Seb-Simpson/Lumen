import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
export default function NotFound() {
  return (
    <div className="page-wrap">
      <section className="empty-state" style={{ margin: "35px 0" }}>
        <span className="eyebrow" style={{ justifyContent: "center" }}>
          404 · A little off the map
        </span>
        <img src="/assets/empty-search.svg" alt="" />
        <h1 className="serif" style={{ fontSize: 45 }}>
          There’s still a world to discover.
        </h1>
        <p>
          This page isn’t in our library. Follow your curiosity back to a
          familiar place.
        </p>
        <Link href="/" className="button primary">
          <ArrowLeft size={16} />
          Return home
        </Link>{" "}
        <Link href="/explore" className="button">
          <Compass size={16} />
          Explore Lumen
        </Link>
      </section>
    </div>
  );
}
