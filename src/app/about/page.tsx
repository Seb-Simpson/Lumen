import Link from "next/link";
export const metadata = { title: "About Lumen" };
export default function About() {
  return (
    <article className="page-wrap prose">
      <header className="page-heading">
        <span className="eyebrow">A new home for learning</span>
        <h1>
          Curiosity deserves
          <br />
          <em>a better platform.</em>
        </h1>
        <p>
          Lumen is a place to explore knowledge with intention. A little like a
          library, a little like an observatory: built for looking closer and
          seeing further.
        </p>
      </header>
      <img
        src="/assets/library-atmosphere.webp"
        alt="An atmospheric library filled with books and warm natural light"
        style={{
          borderRadius: 5,
          width: "100%",
          maxHeight: 320,
          objectFit: "cover",
        }}
      />
      <h2>A thoughtful beginning</h2>
      <p>
        Our first collection is a connected world of editorial subject guides
        and self-directed learning paths. You can create a private space for
        your notes, goals and collections, and bring validated Spotify podcasts
        into your library.
      </p>
      <h2>Built with care</h2>
      <p>
        There are no published videos yet, and we do not invent creators, views
        or recommendations. Your learning progress comes from the steps you
        choose to explore. Public uploads and comments are unavailable while the
        publishing and safety foundations develop.
      </p>
      <p>
        <Link href="/subjects">Begin with a subject</Link>, or{" "}
        <Link href="/space">make a space for your ideas</Link>.
      </p>
    </article>
  );
}
