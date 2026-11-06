"use client";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function SearchForm({ initialQuery }: { initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const router = useRouter();
  return (
    <form
      role="search"
      className="search-form-large"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim())
          void fetch("/api/search-history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: q }),
          }).catch(() => {});
        router.push("/search?q=" + encodeURIComponent(q));
      }}
    >
      <Search size={20} style={{ color: "var(--gold)" }} />
      <input
        aria-label="Search all knowledge"
        placeholder="Search subjects, journeys and podcasts"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        maxLength={120}
      />
      <button type="submit" className="button primary">
        Search
      </button>
    </form>
  );
}
export function SearchFilters({
  query,
  type,
  subject,
  level,
  sort,
  subjects,
}: {
  query: string;
  type: string;
  subject: string;
  level: string;
  sort: string;
  subjects: { slug: string; name: string }[];
}) {
  const router = useRouter();
  function filter(key: string, value: string) {
    const p = new URLSearchParams({ q: query, type, subject, level, sort });
    p.set(key, value);
    router.push("/search?" + p.toString());
  }
  return (
    <div className="filter-bar">
      <label className="sr-only" htmlFor="search-type">
        Content type
      </label>
      <select
        id="search-type"
        value={type}
        onChange={(e) => filter("type", e.target.value)}
      >
        <option value="">All content</option>
        <option value="subject">Subjects</option>
        <option value="path">Learning paths</option>
        <option value="podcast">Podcasts</option>
        <option value="video">Videos</option>
        <option value="channel">Channels</option>
      </select>
      <label className="sr-only" htmlFor="search-subject">
        Subject
      </label>
      <select
        id="search-subject"
        value={subject}
        onChange={(e) => filter("subject", e.target.value)}
      >
        <option value="">All subjects</option>
        {subjects.map((s) => (
          <option value={s.slug} key={s.slug}>
            {s.name}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="search-level">
        Educational level
      </label>
      <select
        id="search-level"
        value={level}
        onChange={(e) => filter("level", e.target.value)}
      >
        <option value="">All levels</option>
        <option>Beginner</option>
        <option>Intermediate</option>
        <option>Advanced</option>
      </select>
      <label className="sr-only" htmlFor="search-sort">
        Sort results
      </label>
      <select
        id="search-sort"
        value={sort}
        onChange={(e) => filter("sort", e.target.value)}
      >
        <option value="relevance">Most relevant</option>
        <option value="alphabetical">Alphabetical</option>
      </select>
    </div>
  );
}
