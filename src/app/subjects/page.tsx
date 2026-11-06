import type { Metadata } from "next";
import { subjects } from "@/lib/catalog";
import { SubjectCard, Breadcrumb } from "@/components/discovery";
export const metadata: Metadata = { title: "Subjects" };
export default function Subjects() {
  return (
    <div className="page-wrap">
      <Breadcrumb items={[{ label: "Subjects" }]} />
      <header className="page-heading page-heading-row">
        <div>
          <span className="eyebrow">The world of knowledge</span>
          <h1>
            A thousand ways
            <br />
            to see <em>the world.</em>
          </h1>
          <p>
            Science and stories. Patterns and possibilities. Find a familiar
            fascination or venture somewhere entirely new.
          </p>
        </div>
        <img src="/assets/scientific-engraving.svg" alt="" />
      </header>
      <div className="filter-bar">
        <span
          className="eyebrow"
          style={{ marginLeft: 0, color: "var(--teal)" }}
        >
          Every subject is a beginning
        </span>
        <span>{subjects.length} connected subjects</span>
      </div>
      <div className="subject-grid all-subjects">
        {subjects.map((s, i) => (
          <SubjectCard key={s.slug} subject={s} index={i} />
        ))}
      </div>
    </div>
  );
}
