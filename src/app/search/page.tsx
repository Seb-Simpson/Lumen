import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { subjects } from "@/lib/catalog";
import { searchContent } from "@/lib/search";
import { SearchForm, SearchFilters } from "@/components/search-form";
export const metadata: Metadata = { title: "Search" };
export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    subject?: string;
    level?: string;
    sort?: string;
  }>;
}) {
  const p = await searchParams;
  const q = (p.q || "").slice(0, 120),
    type = p.type || "",
    subject = p.subject || "",
    level = p.level || "",
    sort = p.sort || "relevance";
  const results = await searchContent(q, type, subject, level, sort);
  return (
    <div className="page-wrap">
      <header className="page-heading">
        <span className="eyebrow">A good question is a beginning</span>
        <h1>
          {q ? (
            <>
              Following <em>“{q}”</em>
            </>
          ) : (
            <>
              What are you <em>curious about?</em>
            </>
          )}
        </h1>
        <p>
          Search our subject guides, self-directed journeys and approved podcast
          catalogue. New knowledge begins with a little curiosity.
        </p>
      </header>
      <SearchForm key={q} initialQuery={q} />
      <SearchFilters
        query={q}
        type={type}
        subject={subject}
        level={level}
        sort={sort}
        subjects={subjects.map(({ name, slug }) => ({ name, slug }))}
      />
      <p style={{ color: "var(--muted)", fontSize: 11, marginBottom: 20 }}>
        {results.length} {results.length === 1 ? "discovery" : "discoveries"}
        {q ? " for “" + q + "”" : ""}
      </p>
      {results.length ? (
        <div className="search-results">
          {results.map((r) => (
            <Link className="search-result" key={r.id} href={r.url}>
              <img src={"/assets/" + r.image} alt="" />
              <div>
                <span className="eyebrow">
                  {r.type === "path" ? "Learning journey" : r.type}
                </span>
                <h2>{r.title}</h2>
                <p>{r.description}</p>
              </div>
              <ArrowUpRight size={20} />
            </Link>
          ))}
        </div>
      ) : (
        <section className="empty-state" style={{ marginBottom: 45 }}>
          <img src="/assets/empty-search.svg" alt="" />
          <h2>There’s more to discover.</h2>
          <p>
            No matches this time. Try a broader idea, check your spelling or
            explore a subject. No videos or channels have been published yet.
          </p>
          <Link href="/subjects" className="button">
            Explore subjects <ArrowUpRight size={16} />
          </Link>
        </section>
      )}
    </div>
  );
}
