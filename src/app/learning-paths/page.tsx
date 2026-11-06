import type { Metadata } from "next";
import { paths } from "@/lib/catalog";
import { PathCard, Breadcrumb } from "@/components/discovery";
export const metadata: Metadata = { title: "Learning paths" };
export default function LearningPaths() {
  return (
    <div className="page-wrap">
      <Breadcrumb items={[{ label: "Learning paths" }]} />
      <header className="page-heading page-heading-row">
        <div>
          <span className="eyebrow">
            A little direction. Endless possibilities.
          </span>
          <h1>
            Follow an idea.
            <br />
            <em>See where it takes you.</em>
          </h1>
          <p>
            Self-directed journeys that connect big ideas in small, thoughtful
            steps. Use each prompt as a starting point, keep your own notes, and
            mark the steps you’ve explored.
          </p>
        </div>
        <img src="/assets/empty-learning-path.svg" alt="" />
      </header>
      <div className="editorial-note">
        <p>
          These are original exploration guides, rather than video courses.
          There are no attached videos or certificates. Progress reflects the
          steps you choose to mark as explored.
        </p>
      </div>
      <div className="path-grid" style={{ margin: "30px 0 55px" }}>
        {paths.map((p, i) => (
          <PathCard key={p.slug} path={p} index={i} />
        ))}
      </div>
    </div>
  );
}
