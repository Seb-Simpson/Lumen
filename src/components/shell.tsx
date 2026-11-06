"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  Compass,
  Headphones,
  History,
  Home,
  Library,
  Menu,
  Search,
  Settings,
  Sun,
  Moon,
  Route,
  Users,
  X,
  PanelLeftClose,
  Focus,
  LogOut,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { PersonalPreferencesSync } from "@/components/personal-preferences";
const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/podcasts", label: "Podcasts", icon: Headphones },
  { href: "/learning-paths", label: "Learning paths", icon: Route },
];
const personal = [
  { href: "/space", label: "Your Space", icon: Library },
  { href: "/watch-later", label: "Watch later", icon: Bookmark },
  { href: "/history", label: "History", icon: History },
  { href: "/subscriptions", label: "Subscriptions", icon: Users },
];
type Consent = {
  necessary: true;
  analytics: boolean;
  personalisation: boolean;
  embeds: boolean;
};
export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { title: string; url: string; type: string }[]
  >([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profile, setProfile] = useState(false);
  const [light, setLight] = useState(false);
  const [focus, setFocus] = useState(false);
  const [uiMessage, setUiMessage] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const suggestionList = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<{ id: string; query: string }[]>([]);
  const { data: session } = authClient.useSession();
  const [consent, setConsent] = useState<Consent | null>(null);
  const [cookiePanel, setCookiePanel] = useState(false);
  const [embeds, setEmbeds] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const applyTheme = () => {
      const saved = localStorage.getItem("lumen-theme") || "dark";
      const applied =
        saved === "system" ? (media.matches ? "light" : "dark") : saved;
      setLight(applied === "light");
      document.documentElement.dataset.theme = applied;
    };
    applyTheme();
    const systemChanged = () => {
      if (localStorage.getItem("lumen-theme") === "system") applyTheme();
    };
    media.addEventListener("change", systemChanged);
    const f = localStorage.getItem("lumen-focus") === "true";
    setFocus(f);
    document.documentElement.dataset.focus = String(f);
    try {
      const c = JSON.parse(localStorage.getItem("lumen-consent") || "null");
      if (c?.necessary) {
        setConsent(c);
        setEmbeds(c.embeds);
      }
    } catch {}
    return () => media.removeEventListener("change", systemChanged);
  }, []);
  useEffect(() => {
    setMobile(false);
    setProfile(false);
    setSearchOpen(false);
  }, [pathname]);
  useEffect(() => {
    setHistory([]);
  }, [session?.user.id]);
  useEffect(() => {
    if (!searchOpen || query || !session) return;
    const c = new AbortController();
    fetch("/api/search-history", { signal: c.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!c.signal.aborted) setHistory(d.history || []);
      })
      .catch(() => {});
    return () => c.abort();
  }, [searchOpen, query, session]);
  useEffect(() => {
    if (!mobile) return;
    const old = document.activeElement as HTMLElement;
    const first = sidebar.current?.querySelector<HTMLAnchorElement>("a");
    first?.focus();
    function trap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const nodes = Array.from(
        sidebar.current?.querySelectorAll<HTMLElement>(
          "a, button:not([disabled])",
        ) || [],
      );
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      if (old?.isConnected) old.focus();
    };
  }, [mobile]);
  useEffect(() => {
    const cookies = () => setCookiePanel(true);
    const themes = () =>
      setLight(document.documentElement.dataset.theme === "light");
    const focused = () =>
      setFocus(document.documentElement.dataset.focus === "true");
    window.addEventListener("lumen-cookie-preferences", cookies);
    window.addEventListener("lumen-theme-change", themes);
    window.addEventListener("lumen-focus-change", focused);
    document.documentElement.dataset.reduceMotion =
      localStorage.getItem("lumen-reduced-motion") || "false";
    return () => {
      window.removeEventListener("lumen-cookie-preferences", cookies);
      window.removeEventListener("lumen-theme-change", themes);
      window.removeEventListener("lumen-focus-change", focused);
    };
  }, []);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        search.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        if (suggestionList.current?.contains(document.activeElement))
          search.current?.focus();
        setSearchOpen(false);
        setProfile(false);
        setMobile(false);
        setCookiePanel(false);
      }
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(
      () =>
        fetch("/api/search?q=" + encodeURIComponent(query), {
          signal: ctrl.signal,
        })
          .then((r) => r.json())
          .then((d) => setSuggestions(d.results?.slice(0, 5) || []))
          .catch(() => {}),
      160,
    );
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);
  function persistPreference(values: Record<string, unknown>) {
    if (!session) return;
    void fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "preferences", values }),
    })
      .then((r) => {
        if (!r.ok)
          setUiMessage(
            "Your preference is saved on this device. Account sync is unavailable; try again in Settings.",
          );
      })
      .catch(() =>
        setUiMessage(
          "Your preference is saved on this device. Account sync is unavailable; try again in Settings.",
        ),
      );
  }
  function theme() {
    const v = !light;
    setLight(v);
    localStorage.setItem("lumen-theme", v ? "light" : "dark");
    document.documentElement.dataset.theme = v ? "light" : "dark";
    persistPreference({ theme: v ? "light" : "dark" });
  }
  function toggleFocus() {
    const v = !focus;
    setFocus(v);
    localStorage.setItem("lumen-focus", String(v));
    document.documentElement.dataset.focus = String(v);
    persistPreference({ focusMode: v });
  }
  function saveConsent(enable: boolean) {
    const c: Consent = {
      necessary: true,
      analytics: false,
      personalisation: false,
      embeds: enable,
    };
    localStorage.setItem("lumen-consent", JSON.stringify(c));
    setConsent(c);
    setEmbeds(enable);
    setCookiePanel(false);
    window.dispatchEvent(
      new CustomEvent("lumen-consent-change", { detail: c }),
    );
  }
  return (
    <>
      <PersonalPreferencesSync />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="brand-group">
          <button
            ref={menu}
            className="icon-button menu-button"
            aria-expanded={mobile || !collapsed}
            aria-controls="primary-navigation"
            aria-label={mobile ? "Close navigation" : "Toggle navigation"}
            onClick={() => {
              if (window.matchMedia("(max-width:600px)").matches)
                setMobile(!mobile);
              else setCollapsed(!collapsed);
            }}
          >
            <Menu size={21} />
          </button>
          <Link href="/" className="brand" aria-label="Lumen home">
            <img src="/assets/lumen-symbol.svg" alt="" width="33" height="33" />
            <span>
              Lumen<span className="brand-period">.</span>
            </span>
          </Link>
        </div>
        <div
          className="search-wrap"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget))
              setSearchOpen(false);
          }}
        >
          <form
            className="global-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setSearchOpen(false);
              if (query.trim())
                void fetch("/api/search-history", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ query }),
                }).catch(() => {});
              router.push("/search?q=" + encodeURIComponent(query));
            }}
          >
            <Search size={18} />
            <input
              ref={search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  suggestionList.current
                    ?.querySelector<HTMLAnchorElement>("a")
                    ?.focus();
                }
              }}
              aria-label="Search Lumen"
              placeholder="Where will your curiosity take you?"
              autoComplete="off"
            />
            <kbd>⌘ K</kbd>
            <button className="sr-only" type="submit">
              Search
            </button>
          </form>
          {searchOpen && query && (
            <div
              className="suggestions"
              id="search-suggestions"
              ref={suggestionList}
              onKeyDown={(e) => {
                const links = Array.from(e.currentTarget.querySelectorAll("a"));
                const i = links.indexOf(
                  document.activeElement as HTMLAnchorElement,
                );
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  links[(i + 1) % links.length]?.focus();
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  if (i <= 0) search.current?.focus();
                  else links[i - 1]?.focus();
                }
              }}
            >
              <span className="eyebrow">Explore knowledge</span>
              {suggestions.length ? (
                suggestions.map((s) => (
                  <Link
                    key={s.url}
                    href={s.url}
                    onClick={() => setSearchOpen(false)}
                  >
                    <Search size={15} />
                    <span>
                      {s.title}
                      <small>
                        {s.type === "path" ? "Learning path" : s.type}
                      </small>
                    </span>
                    <ArrowUpRight size={16} />
                  </Link>
                ))
              ) : (
                <p>No suggestions. Press Enter to search.</p>
              )}
              <Link href={"/search?q=" + encodeURIComponent(query)}>
                Search all results <ChevronRight size={16} />
              </Link>
            </div>
          )}
          {session && searchOpen && !query && history.length > 0 && (
            <div className="suggestions" id="search-suggestions">
              <span className="eyebrow">Your recent searches</span>
              {history.slice(0, 5).map((h) => (
                <Link
                  key={h.id}
                  href={"/search?q=" + encodeURIComponent(h.query)}
                  onClick={() => {
                    setQuery(h.query);
                    setSearchOpen(false);
                  }}
                >
                  <History size={15} />
                  {h.query}
                </Link>
              ))}
              <button
                className="text-button"
                onClick={async () => {
                  const r = await fetch("/api/search-history", {
                    method: "DELETE",
                  });
                  if (r.ok) setHistory([]);
                }}
              >
                Clear search history
              </button>
            </div>
          )}
        </div>
        <div className="top-actions">
          <Link href="/explore" className="explore-link">
            <Compass size={17} /> Explore
          </Link>
          <span className="top-separator" />
          <button
            className="icon-button"
            aria-label={light ? "Use dark theme" : "Use light theme"}
            onClick={theme}
          >
            {light ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link
            href="/space"
            className="icon-button saved-access"
            aria-label="Your saved content"
          >
            <Bookmark size={18} />
          </Link>
          {session ? (
            <div className="profile-wrap">
              <button
                className="avatar"
                aria-label="Open account menu"
                aria-expanded={profile}
                onClick={() => setProfile(!profile)}
              >
                {session.user.name.slice(0, 1).toUpperCase()}
              </button>
              {profile && (
                <>
                  <button
                    className="popover-dismiss"
                    aria-label="Close account menu"
                    onClick={() => setProfile(false)}
                  />
                  <div className="profile-menu">
                    <strong>{session.user.name}</strong>
                    <small>{session.user.email}</small>
                    <Link href="/space">
                      <Library size={16} />
                      Your Space
                    </Link>
                    <Link href="/settings">
                      <Settings size={16} />
                      Settings
                    </Link>
                    <button
                      onClick={async () => {
                        await authClient.signOut();
                        setProfile(false);
                        router.refresh();
                      }}
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/sign-in" className="button small sign-in">
              Sign in <ArrowUpRight size={14} />
            </Link>
          )}
        </div>
      </header>
      {mobile && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        id="primary-navigation"
        ref={sidebar}
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile ? true : undefined}
        className={
          "sidebar " +
          (collapsed ? "collapsed " : "") +
          (mobile ? "mobile-open" : "")
        }
        aria-label="Main navigation"
      >
        <nav>
          {nav.map((n) => (
            <Link
              className={
                "nav-item " +
                ((
                  n.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(n.href)
                )
                  ? "active"
                  : "")
              }
              href={n.href}
              key={n.href}
              title={n.label}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {n.label === "Explore" && <span className="nav-dot" />}
            </Link>
          ))}
          <div className="nav-rule" />
          <span className="nav-caption">A place of your own</span>
          {personal.map((n) => (
            <Link
              className={
                "nav-item " + (pathname.startsWith(n.href) ? "active" : "")
              }
              href={n.href}
              key={n.href}
              title={n.label}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
            </Link>
          ))}
          <div className="nav-rule" />
          {!session && (
            <div className="sidebar-invite">
              <img
                src="/assets/lumen-symbol.svg"
                width="25"
                height="25"
                alt=""
              />
              <p>
                A little curiosity.
                <br />A world of possibility.
              </p>
              <Link href="/sign-up">
                Make yourself at home <ArrowUpRight size={13} />
              </Link>
            </div>
          )}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={"nav-item " + (focus ? "active" : "")}
            onClick={toggleFocus}
            title="Toggle focus mode"
          >
            <Focus size={18} />
            <span>Focus mode</span>
            {focus && <Check size={14} />}
          </button>
          <Link className="nav-item" href="/settings" title="Settings">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <div className="sidebar-fine">
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
            <button onClick={() => setCookiePanel(true)}>Cookies</button>
            <p>
              © {new Date().getFullYear()} Lumen
              <br />
              Made for curious minds.
            </p>
          </div>
          <button
            className="collapse-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeftClose size={16} />
            <span>Collapse sidebar</span>
          </button>
        </div>
      </aside>
      <main id="main" className={"app-main " + (collapsed ? "wide" : "")}>
        {children}
        <footer className="page-footer">
          <span>Stay curious.</span>
          <div>
            <Link href="/about">About Lumen</Link>
            <Link href="/privacy">Privacy & community</Link>
            <button onClick={() => setCookiePanel(true)}>
              Cookie preferences
            </button>
          </div>
          <img src="/assets/lumen-symbol.svg" alt="" width="24" height="24" />
        </footer>
      </main>
      {uiMessage && (
        <div className="shell-notice" role="status">
          {uiMessage}
          <button
            className="icon-button"
            aria-label="Dismiss notice"
            onClick={() => setUiMessage("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {(!consent || cookiePanel) && (
        <section
          className={"cookie-banner " + (cookiePanel ? "cookie-custom" : "")}
          aria-label="Cookie preferences"
        >
          <div>
            <span className="eyebrow">Your curiosity. Your privacy.</span>
            <p>
              Essential cookies keep your account secure. Spotify players only
              load with your permission. We don’t use analytics or advertising
              cookies.
            </p>
            {cookiePanel && (
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={embeds}
                  onChange={(e) => setEmbeds(e.target.checked)}
                />
                Allow third-party Spotify embeds{" "}
                <small>Spotify may set its own cookies.</small>
              </label>
            )}
          </div>
          <div className="cookie-actions">
            {cookiePanel ? (
              <button
                className="button primary"
                onClick={() => saveConsent(embeds)}
              >
                Save preferences
              </button>
            ) : (
              <>
                <button
                  className="button primary"
                  onClick={() => saveConsent(true)}
                >
                  Accept optional
                </button>
                <button className="button" onClick={() => saveConsent(false)}>
                  Reject optional
                </button>
                <button
                  className="text-button"
                  onClick={() => setCookiePanel(true)}
                >
                  Customise
                </button>
              </>
            )}
            {cookiePanel && consent && (
              <button
                className="icon-button"
                onClick={() => setCookiePanel(false)}
                aria-label="Close preferences"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
