import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { subjects, getSubject } from "@/lib/catalog";
import {
  SubjectCard,
  SectionHeading,
  Breadcrumb,
} from "@/components/discovery";
export const metadata: Metadata = { title: "Explore" };
const connections = [
  {
    from: "astronomy",
    to: "mathematics",
    question: "How do we measure the unreachable?",
    text: "Geometry and light help astronomers turn observations into distances across the cosmos.",
  },
  {
    from: "biology",
    to: "chemistry",
    question: "Where does life begin?",
    text: "Chemical interactions underpin the living systems we study in biology.",
  },
  {
    from: "history",
    to: "economics",
    question: "What makes a civilisation flourish?",
    text: "Resources, exchange and institutions connect economic ideas to the histories of societies.",
  },
  {
    from: "computing",
    to: "philosophy",
    question: "Can a machine think?",
    text: "Computing meets philosophical questions about knowledge, intelligence and consciousness.",
  },
  {
    from: "arts",
    to: "mathematics",
    question: "Why do patterns move us?",
    text: "Proportion, symmetry and rhythm offer a meeting place between mathematics and creative work.",
  },
  {
    from: "earth-science",
    to: "biology",
    question: "How does a planet shape its life?",
    text: "Climate, geology and the evolution of living things form a closely connected story.",
  },
];
export default async function Explore({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const connected = (await searchParams).view === "connections";
  return (
    <div className="page-wrap">
      <Breadcrumb items={[{ label: "Explore" }]} />
      <header className="page-heading">
        <span className="eyebrow">Leave a little room for wonder</span>
        <h1>
          {connected ? (
            <>
              Everything is <em>connected.</em>
            </>
          ) : (
            <>
              Let one good question
              <br />
              lead to <em>another.</em>
            </>
          )}
        </h1>
        <p>
          Knowledge is a landscape, not a list. Follow the threads between
          subjects and find something you didn’t know you were looking for.
        </p>
      </header>
      <nav className="topic-strip">
        <Link className={!connected ? "selected" : ""} href="/explore">
          Explore subjects
        </Link>
        <Link
          className={connected ? "selected" : ""}
          href="/explore?view=connections"
        >
          Connected knowledge
        </Link>
        <Link href="/learning-paths">
          Learning journeys <ArrowUpRight size={14} />
        </Link>
      </nav>
      {connected ? (
        <section className="discovery-section">
          <SectionHeading
            eyebrow="Follow the threads"
            title="Unexpected neighbours"
          />
          <div className="connection-grid">
            {connections.map((c) => (
              <article className="connection-card" key={c.from + c.to}>
                <span className="eyebrow">
                  {getSubject(c.from)!.name} ↔ {getSubject(c.to)!.name}
                </span>
                <h3>{c.question}</h3>
                <p>{c.text}</p>
                <Link href={"/subjects/" + c.to}>
                  Explore {getSubject(c.to)!.name.toLowerCase()}
                  <ArrowRight size={17} />
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="discovery-section">
            <SectionHeading
              eyebrow="Look a little closer"
              title="Science & the natural world"
            />
            <div className="subject-grid">
              {subjects
                .filter((s) =>
                  [
                    "astronomy",
                    "physics",
                    "biology",
                    "chemistry",
                    "earth-science",
                    "mathematics",
                  ].includes(s.slug),
                )
                .map((s, i) => (
                  <SubjectCard key={s.slug} subject={s} index={i} />
                ))}
            </div>
          </section>
          <section className="discovery-section">
            <SectionHeading
              eyebrow="Understand our shared world"
              title="People, ideas & possibilities"
            />
            <div className="subject-grid">
              {subjects
                .filter(
                  (s) =>
                    ![
                      "astronomy",
                      "physics",
                      "biology",
                      "chemistry",
                      "earth-science",
                      "mathematics",
                    ].includes(s.slug),
                )
                .map((s, i) => (
                  <SubjectCard key={s.slug} subject={s} index={i + 6} />
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
