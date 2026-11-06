import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Route,
  BookOpen,
  Orbit,
  ChevronRight,
} from "lucide-react";
import { Subject, LearningPath, getSubject } from "@/lib/catalog";
export function SubjectCard({
  subject,
  index = 0,
  featured = false,
}: {
  subject: Subject;
  index?: number;
  featured?: boolean;
}) {
  return (
    <Link
      href={"/subjects/" + subject.slug}
      className={"subject-card " + (featured ? "subject-featured" : "")}
    >
      <div className="subject-image">
        <img src={"/assets/" + subject.image} alt="" loading="lazy" />
        <span className="subject-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="subject-arrow">
          <ArrowUpRight size={20} />
        </span>
      </div>
      <div className="subject-copy">
        <span className="eyebrow">{subject.category}</span>
        <h3>{subject.name}</h3>
        <p>{subject.description}</p>
        <span className="subject-meta">
          {subject.topics.length} topics to explore <span>·</span> All levels
        </span>
      </div>
    </Link>
  );
}
export function PathCard({
  path,
  index = 0,
}: {
  path: LearningPath;
  index?: number;
}) {
  const subject = getSubject(path.subject)!;
  return (
    <Link href={"/learning-paths/" + path.slug} className="path-card">
      <div className="path-art">
        <img src={"/assets/" + subject.image} alt="" loading="lazy" />
        <span className="path-icon">
          <Route size={22} />
        </span>
      </div>
      <div>
        <span className="eyebrow">Learning journey · {path.level}</span>
        <h3>{path.title}</h3>
        <p>{path.description}</p>
        <span className="path-meta">
          {path.steps.length} connected steps <ArrowRight size={17} />
        </span>
      </div>
    </Link>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  href,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  action?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {children}
      </div>
      {href && (
        <Link className="section-link" href={href}>
          {action || "Explore all"}
          <ArrowRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      {items.map((i, n) => (
        <span key={n}>
          <ChevronRight size={13} />
          {i.href ? (
            <Link href={i.href}>{i.label}</Link>
          ) : (
            <span aria-current="page">{i.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
