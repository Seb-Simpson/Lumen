import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Headphones,
  Orbit,
  BookOpen,
  Bookmark,
  Sparkles,
} from "lucide-react";
import { subjects, paths } from "@/lib/catalog";
import { HomePersonalized } from "@/components/home-personalized";
import { SubjectCard, PathCard, SectionHeading } from "@/components/discovery";
export default function Home() {
  return (
    <div className="home-page page-wrap">
      <div className="home-topline">
        <span>
          <span className="status-dot" /> A new home for learning
        </span>
        <span>
          FOR THE ENDLESSLY CURIOUS <span className="tiny-star">✦</span>
        </span>
      </div>
      <section className="hero">
        <img
          className="hero-art"
          src="/assets/observatory-hero.webp"
          alt="An observatory opens to a star-filled sky above the mountains"
          fetchPriority="high"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="eyebrow hero-eyebrow">
            <span /> Follow your curiosity
          </span>
          <h1>
            There’s a whole world
            <br /> waiting to be <em>understood.</em>
          </h1>
          <p>
            Big questions. New perspectives. Unexpected connections.
            <br className="desktop-break" /> Make a little room for discovery.
          </p>
          <Link href="/explore" className="button hero-button">
            Find your next discovery <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="hero-caption">
          <Orbit size={18} />
          <span>
            A different perspective
            <br /> <small>Begins with looking up.</small>
          </span>
          <span className="hero-coordinate">LOOK CLOSER. THINK FURTHER.</span>
        </div>
        <span className="hero-edge">THE WORLD IS WORTH WONDERING ABOUT</span>
      </section>
      <nav className="topic-strip" aria-label="Featured subjects">
        <Link className="selected" href="/explore">
          <Compass size={15} /> All discoveries
        </Link>
        {[
          "astronomy",
          "physics",
          "mathematics",
          "history",
          "computing",
          "philosophy",
        ].map((slug) => {
          const s = subjects.find((s) => s.slug === slug)!;
          return (
            <Link href={"/subjects/" + slug} key={slug}>
              {s.name}
            </Link>
          );
        })}
        <Link href="/subjects" className="strip-more" aria-label="All subjects">
          <ArrowRight size={16} />
        </Link>
      </nav>
      <HomePersonalized />
      <section className="discovery-section">
        <SectionHeading
          eyebrow="An open invitation"
          title="Where will you begin?"
          href="/subjects"
          action="Explore all subjects"
        >
          <p>Follow a familiar interest. Or find one you never knew you had.</p>
        </SectionHeading>
        <div className="subject-grid home-subjects">
          {[subjects[0], subjects[2], subjects[5], subjects[3]].map((s, i) => (
            <SubjectCard key={s.slug} subject={s} index={i} />
          ))}
        </div>
      </section>
      <section className="curiosity-banner">
        <div className="curiosity-art">
          <img src="/assets/scientific-engraving.svg" alt="" />
        </div>
        <div>
          <span className="eyebrow">Everything is connected</span>
          <h2>
            One question opens
            <br /> <em>a thousand doors.</em>
          </h2>
          <p>
            From the patterns in a sunflower to the mathematics of a galaxy.
            <br /> Discover how ideas connect across the world of knowledge.
          </p>
          <Link href="/explore?view=connections" className="text-link">
            Follow the connections <ArrowRight size={17} />
          </Link>
        </div>
        <span className="curiosity-index">
          FIELD NOTES — No. 001
          <br /> <span>The art of paying attention</span>
        </span>
      </section>
      <section className="discovery-section">
        <SectionHeading
          eyebrow="A little direction for your curiosity"
          title="Ideas worth following"
          href="/learning-paths"
          action="All learning paths"
        >
          <p>Thoughtful journeys through subjects that stay with you.</p>
        </SectionHeading>
        <div className="path-grid">
          {paths.slice(0, 3).map((p, i) => (
            <PathCard path={p} index={i} key={p.slug} />
          ))}
        </div>
      </section>
      <div className="home-bottom-grid">
        <Link href="/space" className="space-invitation">
          <span className="eyebrow">
            <Bookmark size={14} /> Your own corner of Lumen
          </span>
          <h2>
            Make space
            <br /> for what moves you.
          </h2>
          <p>
            Gather ideas. Set intentions. Build a library
            <br /> that grows with your curiosity.
          </p>
          <span className="text-link">
            Discover Your Space <ArrowUpRight size={18} />
          </span>
          <img src="/assets/empty-library.svg" alt="" />
        </Link>
        <Link href="/podcasts" className="podcast-invitation">
          <span className="eyebrow">
            <Headphones size={14} /> Take a different kind of journey
          </span>
          <h2>
            Good ideas.
            <br /> <em>Great company.</em>
          </h2>
          <p>
            Bring your educational podcasts together,
            <br /> with listening powered by Spotify.
          </p>
          <span className="text-link">
            Explore podcasts <ArrowUpRight size={18} />
          </span>
          <img src="/assets/podcast-wave.svg" alt="" />
        </Link>
      </div>
      <section className="quiet-note">
        <span>✦</span>
        <p>
          Knowledge doesn’t have an end point.
          <br /> <em>That’s the beautiful part.</em>
        </p>
        <span>LUMEN — STAY CURIOUS</span>
      </section>
    </div>
  );
}
