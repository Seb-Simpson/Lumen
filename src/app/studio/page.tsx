import Link from "next/link";
import { Film, LockKeyhole, ShieldCheck, Upload } from "lucide-react";
import "@/components/video.css";
export const metadata = { title: "Creator Studio" };
export default function StudioPage() {
  return (
    <div className="page-wrap studio-page">
      <p className="eyebrow">LUMEN CREATOR STUDIO</p>
      <h1 className="serif">
        Good knowledge.
        <br />
        Thoughtfully shared.
      </h1>
      <p className="studio-intro">
        A future home for educators, storytellers and people with something
        worth understanding. Publishing is being prepared with care.
      </p>
      <section className="panel studio-status">
        <Film size={32} strokeWidth={1} />
        <div>
          <h2 className="serif">The studio is not open for publishing.</h2>
          <p>
            Public uploads, channel creation and comments remain unavailable
            while storage, media processing, permissions and moderation are
            integrated and reviewed.
          </p>
          <button className="button" disabled>
            <Upload size={16} /> Uploads not yet available
          </button>
        </div>
      </section>
      <div className="studio-grid">
        <article className="panel">
          <LockKeyhole size={23} />
          <h3>Permission before publication</h3>
          <p>
            Creator access and channel approval must be verified before
            publishing is enabled.
          </p>
        </article>
        <article className="panel">
          <Film size={23} />
          <h3>A proper media pipeline</h3>
          <p>
            Validated uploads, signed storage, transcoding and caption handling
            will connect through dedicated adapters.
          </p>
        </article>
        <article className="panel">
          <ShieldCheck size={23} />
          <h3>Care for the community</h3>
          <p>
            Content review, reporting and administrator workflows must be
            operational before public uploads open.
          </p>
        </article>
      </div>
      <Link className="button primary" href="/explore">
        Return to discovery →
      </Link>
    </div>
  );
}
