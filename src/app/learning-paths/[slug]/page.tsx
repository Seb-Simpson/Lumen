import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, NotebookPen } from "lucide-react";
import { getPath, getSubject, paths } from "@/lib/catalog";
import { Breadcrumb } from "@/components/discovery";
import { PathProgress } from "@/components/path-progress";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return { title: getPath((await params).slug)?.title || "Learning path" };
}
export default async function PathPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = getPath((await params).slug);
  if (!p) notFound();
  const s = getSubject(p.subject)!;
  return (
    <div className="page-wrap">
      <Breadcrumb
        items={[
          { label: "Learning paths", href: "/learning-paths" },
          { label: p.title },
        ]}
      />
      <header className="page-heading">
        <span className="eyebrow">
          {p.level} · {s.name} · An original Lumen journey
        </span>
        <h1>{p.title}</h1>
        <p>{p.description}</p>
      </header>
      <div className="path-detail-grid">
        <PathProgress pathId={p.slug} steps={p.steps} />
        <aside className="path-aside">
          <img src={"/assets/" + s.image} alt="" />
          <div className="panel">
            <span className="eyebrow">Make the ideas your own</span>
            <h2 className="serif" style={{ fontSize: 30, margin: "12px 0" }}>
              A place for your thoughts.
            </h2>
            <p>
              Write down questions, collect connections and reflect on what
              you’ve explored in Your Space.
            </p>
            <Link
              href="/space?tab=notes"
              className="button"
              style={{ marginTop: 20 }}
            >
              <NotebookPen size={15} />
              Open your notes
            </Link>
          </div>
          <div className="editorial-note">
            <p>
              This is a self-directed exploration guide. No videos or
              assessments are attached. Marking a step records your own
              reflection, rather than a verified qualification.
            </p>
          </div>
          <Link className="text-link" href={"/subjects/" + s.slug}>
            Explore {s.name} <ArrowUpRight size={15} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
