import Link from "next/link";
export const metadata = { title: "Privacy" };
export default function Privacy() {
  return (
    <article className="page-wrap prose">
      <header className="page-heading">
        <span className="eyebrow">Privacy by design</span>
        <h1>
          Your curiosity.
          <br />
          <em>Your space.</em>
        </h1>
        <p>
          This development privacy notice describes the data used by the current
          application. An operator-specific policy and legal review are required
          before public launch.
        </p>
      </header>
      <h2>What Lumen stores</h2>
      <p>
        Accounts contain your name, email address and authentication records.
        Your private learning data includes collections, saved podcast links,
        goals, notes, selected interests, preferences and the learning steps you
        mark as explored. Session cookies are essential to sign-in.
      </p>
      <h2>Your choices</h2>
      <p>
        No analytics, advertising or behavioural profiling is enabled. Search
        history is off by default and only stored after you enable it in
        settings. Personalisation is based on interests you explicitly choose.
        Theme, focus and cookie preferences use browser storage so they apply
        before sign-in.
      </p>
      <h2>Third-party podcasts</h2>
      <p>
        Spotify players load only when you permit embeds or explicitly load a
        player. Spotify then receives connection information and may use cookies
        under its own policy. Metadata is fetched by Lumen’s server using
        Spotify’s official oEmbed service. Playback availability and login
        requirements are controlled by Spotify.
      </p>
      <h2>Access and deletion</h2>
      <p>
        Signed-in users can export their data and delete their account from{" "}
        <Link href="/settings">Settings</Link>. Account deletion removes the
        account and associated private learning records. Operators must define
        database backup retention and support contact details before launch.
      </p>
      <h2>Young learners</h2>
      <p>
        Profiles and libraries are private by default. Public comments and
        unrestricted uploads are disabled. Lumen does not use learning data for
        advertising or optimise for time spent watching.
      </p>
      <h2>Cookies and storage</h2>
      <p>
        Reopen Cookie preferences from the footer to reject optional Spotify
        embeds. Necessary authentication and preference storage remains
        available. Preferences do not initialise analytics because no analytics
        service is installed.
      </p>
      <p>
        See our <Link href="/community">community principles</Link> for the
        safeguards required before social features become available.
      </p>
    </article>
  );
}
