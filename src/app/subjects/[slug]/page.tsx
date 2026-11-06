import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Play, Route } from "lucide-react";
import { getSubject, subjects, paths } from "@/lib/catalog";
import { Breadcrumb, PathCard, SectionHeading } from "@/components/discovery";
export function generateStaticParams() {
  return subjects.map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const s = getSubject((await params).slug);
  return { title: s?.name || "Subject not found", description: s?.description };
}
export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const s = getSubject((await params).slug);
  if (!s) notFound();
  const journeys = paths.filter((p) => p.subject === s.slug);
  return (
    <div className="page-wrap">
      <Breadcrumb
        items={[{ label: "Subjects", href: "/subjects" }, { label: s.name }]}
      />
      <section className="subject-hero">
        <img src={"/assets/" + s.image} alt="" />
        <div>
          <span className="eyebrow">{s.category}</span>
          <h1>{s.name}</h1>
          <p>{s.description}</p>
          <Link
            href={"/search?subject=" + s.slug}
            className="button"
            style={{ marginTop: 24 }}
          >
            Explore this subject <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
      <div className="subject-body">
        <section>
          <span className="eyebrow">Start with a question</span>
          <h2>{s.question}</h2>
          <p>{s.detail}</p>
          <div className="topic-list">
            {s.topics.map((t, i) => (
              <div className="topic-item" key={t}>
                <span>0{i + 1}</span>
                {t}
              </div>
            ))}
          </div>
          <div className="editorial-note">
            <p>
              These are editorial starting points for your own exploration. Our
              video library is still growing its foundations; no videos have
              been published yet.
            </p>
          </div>
        </section>
        <aside className="subject-side">
          <span className="eyebrow">Follow a connection</span>
          <h2>No idea stands alone.</h2>
          {s.related.map((slug) => {
            const r = getSubject(slug)!;
            return (
              <Link key={slug} href={"/subjects/" + slug}>
                <span>
                  <img src={"/assets/" + r.image} alt="" />
                  {r.name}
                </span>
                <ArrowUpRight size={17} />
              </Link>
            );
          })}
          <Link href="/explore?view=connections">
            Explore connected knowledge <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
      {journeys.length > 0 && (
        <section className="discovery-section">
          <SectionHeading
            eyebrow="Give your curiosity a little direction"
            title="Take the next step"
          />
          <div className="path-grid">
            {journeys.map((p) => (
              <PathCard key={p.slug} path={p} />
            ))}
          </div>
        </section>
      )}
      <section className="empty-state" style={{ marginBottom: 40 }}>
        <Play
          size={26}
          style={{ color: "var(--gold)", margin: "0 auto 14px" }}
        />
        <h2>Good things take a little care.</h2>
        <p>
          There are no published {s.name.toLowerCase()} videos yet. In the
          meantime, follow the connected subjects and self-directed learning
          journeys.
        </p>
        <Link href="/learning-paths" className="button">
          Explore learning paths <Route size={16} />
        </Link>
      </section>
    </div>
  );
}
