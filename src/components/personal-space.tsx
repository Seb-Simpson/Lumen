"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  Compass,
  Folder,
  FolderPlus,
  Headphones,
  Loader2,
  Pencil,
  Plus,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { usePathname } from "next/navigation";
import { paths, getSubject } from "@/lib/catalog";
import "./personal.css";

export type Collection = {
  id: string;
  name: string;
  description: string | null;
};
export type Goal = { id: string; title: string; completed: boolean };
export type Note = { id: string; title: string; body: string };
export type SavedPodcast = {
  id: string;
  url: string;
  title: string;
  kind: string;
  spotifyId: string;
  collectionId?: string | null;
};
export type Library = {
  collections: Collection[];
  goals: Goal[];
  notes: Note[];
  savedPodcasts: SavedPodcast[];
  interests: string[];
  preferences: Record<string, unknown>;
  progress?: {
    pathId: string;
    stepIndex: number;
    completed: boolean;
    updatedAt?: string;
  }[];
};
export async function libraryMutation(
  method: "POST" | "PATCH" | "DELETE",
  body: Record<string, unknown>,
) {
  const response = await fetch("/api/library", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error || "We couldn’t save your changes. Please try again.",
    );
  return result;
}
export function useLibrary() {
  const [library, setLibrary] = useState<Library | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/library", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Your library could not be loaded.");
      setLibrary(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your library could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  return { library, error, loading, reload };
}

export function PrivateGate({
  children,
  feature = "Your Space",
}: {
  children: ReactNode;
  feature?: string;
}) {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();
  if (isPending)
    return (
      <div className="page-wrap personal-loading" role="status">
        <Loader2 className="spin" size={24} /> Opening your space…
      </div>
    );
  if (!session)
    return (
      <div className="page-wrap private-gate">
        <span className="eyebrow">A PLACE OF YOUR OWN</span>
        <h1 className="serif">
          Every great discovery
          <br />
          begins somewhere.
        </h1>
        <img
          src="/assets/empty-library.svg"
          alt="An open book beneath a constellation"
        />
        <p>
          Sign in to keep your discoveries in {feature},<br />
          and pick up wherever curiosity takes you.
        </p>
        <div className="personal-actions">
          <Link
            className="button primary"
            href={"/sign-in?next=" + encodeURIComponent(pathname)}
          >
            Sign in <ChevronRight size={16} />
          </Link>
          <Link className="button" href="/sign-up">
            Create an account
          </Link>
        </div>
        <Link href="/explore" className="text-link">
          Keep exploring <Compass size={15} />
        </Link>
      </div>
    );
  return <>{children}</>;
}

export function FormDialog({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      className="personal-dialog"
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="dialog-title">
        <h2>{title}</h2>
        <button
          type="button"
          aria-label="Close dialog"
          className="icon-action"
          onClick={close}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

const subjectOptions = [
  ["astronomy", "Astronomy"],
  ["physics", "Physics"],
  ["mathematics", "Mathematics"],
  ["biology", "Biology"],
  ["chemistry", "Chemistry"],
  ["history", "History"],
  ["computing", "Computing"],
  ["economics", "Economics"],
  ["literature", "Literature"],
  ["earth-science", "Earth science"],
  ["philosophy", "Philosophy"],
  ["arts", "Arts"],
];
type Editor =
  | { kind: "collection"; item?: Collection }
  | { kind: "goal"; item?: Goal }
  | { kind: "note"; item?: Note }
  | { kind: "podcast" };

function SpaceContent({
  initialTab = "library",
}: {
  initialTab?: "library" | "learning" | "notes";
}) {
  const { data: session } = authClient.useSession();
  const { library, error, loading, reload } = useLibrary();
  const [tab, setTab] = useState<"library" | "learning" | "notes">(initialTab);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null,
  );
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
  function openEditor(next: Editor) {
    setEditor(next);
    setFormError("");
    setCollectionId(selectedCollection || "");
    setName(
      "item" in next && next.item
        ? "name" in next.item
          ? next.item.name
          : next.item.title
        : "",
    );
    setBody(
      "item" in next && next.item
        ? "body" in next.item
          ? next.item.body
          : "description" in next.item
            ? next.item.description || ""
            : ""
        : "",
    );
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    setPending(true);
    setFormError("");
    setMessageError(false);
    try {
      const item = "item" in editor ? editor.item : undefined;
      await libraryMutation(item ? "PATCH" : "POST", {
        entity: editor.kind,
        ...(item ? { id: item.id } : {}),
        ...(editor.kind === "collection"
          ? { name: name.trim(), description: body.trim() }
          : editor.kind === "podcast"
            ? { url: name.trim(), ...(collectionId ? { collectionId } : {}) }
            : {
                title: name.trim(),
                ...(editor.kind === "note" ? { body } : {}),
              }),
      });
      await reload();
      setEditor(null);
      setMessage(
        editor.kind === "podcast"
          ? "Podcast saved to your library."
          : `${editor.kind[0].toUpperCase()}${editor.kind.slice(1)} ${item ? "updated" : "created"}.`,
      );
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "Unable to save. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  async function remove(
    entity: "collection" | "goal" | "note" | "podcast",
    id: string,
    label: string,
  ) {
    if (
      !window.confirm(
        `Delete “${label}”?${entity === "collection" ? " Podcasts in this collection will stay in your library." : " This cannot be undone."}`,
      )
    )
      return;
    setMessageError(false);
    try {
      await libraryMutation("DELETE", { entity, id });
      await reload();
      if (entity === "collection" && selectedCollection === id)
        setSelectedCollection(null);
      setMessage(`${entity[0].toUpperCase()}${entity.slice(1)} deleted.`);
    } catch (cause) {
      setMessageError(true);
      setMessage(
        cause instanceof Error ? cause.message : "Could not delete this item.",
      );
    }
  }
  async function toggleGoal(goal: Goal) {
    setMessageError(false);
    try {
      await libraryMutation("PATCH", {
        entity: "goal",
        id: goal.id,
        completed: !goal.completed,
      });
      await reload();
      setMessage(
        goal.completed
          ? "Goal reopened."
          : "A little further along. Goal completed.",
      );
    } catch (cause) {
      setMessageError(true);
      setMessage(
        cause instanceof Error ? cause.message : "Could not update goal.",
      );
    }
  }
  async function toggleInterest(id: string) {
    if (!library) return;
    setMessageError(false);
    try {
      await libraryMutation("POST", {
        entity: "interests",
        values: library.interests.includes(id)
          ? library.interests.filter((item) => item !== id)
          : [...library.interests, id],
      });
      await reload();
      setMessage("Your interests have been updated.");
    } catch (cause) {
      setMessageError(true);
      setMessage(
        cause instanceof Error ? cause.message : "Could not update interests.",
      );
    }
  }
  async function movePodcast(podcast: SavedPodcast, value: string) {
    setMessageError(false);
    try {
      await libraryMutation("PATCH", {
        entity: "podcast",
        id: podcast.id,
        collectionId: value || null,
      });
      await reload();
      setMessage("Podcast collection updated.");
    } catch (cause) {
      setMessageError(true);
      setMessage(
        cause instanceof Error ? cause.message : "Could not move podcast.",
      );
    }
  }
  const podcasts =
    library?.savedPodcasts.filter(
      (item) => !selectedCollection || item.collectionId === selectedCollection,
    ) || [];
  const selectedName = library?.collections.find(
    (item) => item.id === selectedCollection,
  )?.name;
  const continuedPaths = paths.filter((path) =>
    library?.progress?.some(
      (item) => item.pathId === path.slug && item.completed,
    ),
  );
  return (
    <div className="page-wrap personal-page">
      <div className="personal-welcome">
        <div>
          <span className="eyebrow">YOUR PERSONAL LEARNING ENVIRONMENT</span>
          <h1 className="serif">Your curiosity, collected.</h1>
          <p>
            A little space for big ideas
            {session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}.
          </p>
        </div>
        <Link className="button" href="/settings">
          Your preferences <ChevronRight size={15} />
        </Link>
      </div>
      <div
        className="personal-tabs"
        role="tablist"
        aria-label="Your Space sections"
        onKeyDown={(event) => {
          const values = ["library", "learning", "notes"] as const;
          const index = values.indexOf(tab);
          let target = index;
          if (event.key === "ArrowRight") target = (index + 1) % values.length;
          else if (event.key === "ArrowLeft")
            target = (index + values.length - 1) % values.length;
          else if (event.key === "Home") target = 0;
          else if (event.key === "End") target = values.length - 1;
          else return;
          event.preventDefault();
          setTab(values[target]);
          document.getElementById("space-tab-" + values[target])?.focus();
        }}
      >
        {(["library", "learning", "notes"] as const).map((item) => (
          <button
            key={item}
            id={"space-tab-" + item}
            role="tab"
            aria-controls={"space-panel-" + item}
            tabIndex={tab === item ? 0 : -1}
            aria-selected={tab === item}
            className={tab === item ? "active" : ""}
            onClick={() => {
              setTab(item);
              setMessage("");
            }}
          >
            {item === "library" ? (
              <Bookmark size={16} />
            ) : item === "learning" ? (
              <Compass size={16} />
            ) : (
              <Pencil size={16} />
            )}
            {item === "library"
              ? "Your library"
              : item === "learning"
                ? "Your learning"
                : "Learning notes"}
          </button>
        ))}
      </div>
      {message && (
        <div
          className={
            messageError
              ? "form-message error personal-notice"
              : "personal-notice"
          }
          role={messageError ? "alert" : "status"}
        >
          {!messageError && <Check size={16} />}
          {message}
          <button
            className="icon-action"
            aria-label="Dismiss message"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {loading && (
        <div className="personal-loading" role="status">
          <Loader2 className="spin" size={20} /> Gathering your discoveries…
        </div>
      )}
      {error && (
        <div className="form-message error" role="alert">
          {error}{" "}
          <button className="text-link" onClick={() => void reload()}>
            Try again
          </button>
        </div>
      )}
      {library && tab === "library" && (
        <div
          role="tabpanel"
          id="space-panel-library"
          aria-labelledby="space-tab-library"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">ORDER YOUR IDEAS</span>
              <h2>Collections</h2>
            </div>
            <button
              className="button"
              onClick={() => openEditor({ kind: "collection" })}
            >
              <FolderPlus size={16} /> New collection
            </button>
          </div>
          {library.collections.length ? (
            <div className="collection-grid">
              {library.collections.map((collection) => (
                <article
                  className={`collection-card ${selectedCollection === collection.id ? "selected" : ""}`}
                  key={collection.id}
                >
                  <button
                    className="collection-open"
                    onClick={() =>
                      setSelectedCollection(
                        selectedCollection === collection.id
                          ? null
                          : collection.id,
                      )
                    }
                    aria-pressed={selectedCollection === collection.id}
                  >
                    <img src="/assets/collection-cover.svg" alt="" />
                    <span>
                      <Folder size={17} />
                      <strong>{collection.name}</strong>
                      <small>
                        {collection.description ||
                          "A place for connected discoveries."}
                      </small>
                      <span className="collection-count">
                        {
                          library.savedPodcasts.filter(
                            (p) => p.collectionId === collection.id,
                          ).length
                        }{" "}
                        saved podcasts <ChevronRight size={13} />
                      </span>
                    </span>
                  </button>
                  <div className="collection-controls">
                    <button
                      className="icon-action"
                      aria-label={`Rename ${collection.name}`}
                      onClick={() =>
                        openEditor({ kind: "collection", item: collection })
                      }
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-action"
                      aria-label={`Delete ${collection.name}`}
                      onClick={() =>
                        void remove(
                          "collection",
                          collection.id,
                          collection.name,
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="collection-empty">
              <Folder size={32} strokeWidth={1} />
              <div>
                <h3>A place for every thread of curiosity.</h3>
                <p>
                  Create collections to organise the podcasts you want to return
                  to.
                </p>
              </div>
              <button
                className="text-link"
                onClick={() => openEditor({ kind: "collection" })}
              >
                Create your first collection <Plus size={15} />
              </button>
            </div>
          )}
          <div className="section-heading library-heading">
            <div>
              <span className="eyebrow">KEEP SOMETHING GOOD</span>
              <h2>{selectedName || "Saved podcasts"}</h2>
            </div>
            <div className="personal-actions">
              {selectedCollection && (
                <button
                  className="text-link"
                  onClick={() => setSelectedCollection(null)}
                >
                  View all
                </button>
              )}
              <button
                className="button"
                onClick={() => openEditor({ kind: "podcast" })}
              >
                <Plus size={16} /> Save a Spotify link
              </button>
            </div>
          </div>
          {podcasts.length ? (
            <div className="saved-podcasts">
              {podcasts.map((podcast) => (
                <article key={podcast.id} className="saved-podcast">
                  <div className="podcast-emblem">
                    <Headphones size={25} strokeWidth={1.3} />
                  </div>
                  <div className="saved-podcast-main">
                    <span className="eyebrow">SPOTIFY {podcast.kind}</span>
                    <h3>
                      <Link
                        href={`/podcasts/${podcast.kind}/${podcast.spotifyId}`}
                      >
                        {podcast.title}
                      </Link>
                    </h3>
                    <a
                      href={podcast.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link"
                    >
                      Open in Spotify ↗
                    </a>
                  </div>
                  <label className="podcast-move">
                    <span className="sr-only">
                      Collection for {podcast.title}
                    </span>
                    <select
                      value={podcast.collectionId || ""}
                      onChange={(e) =>
                        void movePodcast(podcast, e.target.value)
                      }
                    >
                      <option value="">Uncollected</option>
                      {library.collections.map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="icon-action"
                    aria-label={`Remove ${podcast.title}`}
                    onClick={() =>
                      void remove("podcast", podcast.id, podcast.title)
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="personal-empty">
              <img
                src="/assets/empty-library.svg"
                alt="An open book beneath the stars"
              />
              <span className="eyebrow">THE BEGINNING OF SOMETHING</span>
              <h3>Every great discovery begins somewhere.</h3>
              <p>
                {selectedCollection
                  ? "Save a podcast to this collection and let an idea grow."
                  : "Save an educational podcast, collect an idea, or follow a question."}
              </p>
              <Link href="/podcasts" className="button">
                Discover podcasts <ChevronRight size={15} />
              </Link>
            </div>
          )}
          <div className="personal-library-links">
            <Link href="/watch-later">
              <Bookmark size={17} /> Watch Later <ChevronRight size={15} />
            </Link>
            <Link href="/history">
              <BookOpen size={17} /> Learning history <ChevronRight size={15} />
            </Link>
            <Link href="/subscriptions">
              <Headphones size={17} /> Subscriptions <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      )}
      {library && tab === "learning" && (
        <div
          role="tabpanel"
          id="space-panel-learning"
          aria-labelledby="space-tab-learning"
          className="learning-space"
        >
          {continuedPaths.length > 0 && (
            <section className="continue-learning">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">ONE MORE STEP</span>
                  <h2>Continue learning</h2>
                </div>
              </div>
              <div className="continue-path-grid">
                {continuedPaths.map((path) => {
                  const complete = new Set(
                    library.progress
                      ?.filter(
                        (item) => item.pathId === path.slug && item.completed,
                      )
                      .map((item) => item.stepIndex),
                  ).size;
                  const next = path.steps.find(
                    (_, i) =>
                      !library.progress?.some(
                        (item) =>
                          item.pathId === path.slug &&
                          item.stepIndex === i &&
                          item.completed,
                      ),
                  );
                  return (
                    <Link
                      className="continue-path"
                      href={"/learning-paths/" + path.slug}
                      key={path.slug}
                    >
                      <img
                        src={"/assets/" + getSubject(path.subject)!.image}
                        alt=""
                      />
                      <div>
                        <span className="eyebrow">
                          {complete === path.steps.length
                            ? "Journey explored"
                            : "Your learning journey"}
                        </span>
                        <h3>{path.title}</h3>
                        <progress
                          max={path.steps.length}
                          value={complete}
                          aria-label={`${path.title}: ${complete} of ${path.steps.length} steps explored`}
                        />
                        <p>
                          {complete} of {path.steps.length} steps explored
                          {next ? ` · Next: ${next.title}` : ""}
                        </p>
                        <span className="text-link">
                          {next
                            ? "Continue your journey"
                            : "Revisit your journey"}{" "}
                          <ChevronRight size={14} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
          <section>
            <div className="section-heading">
              <div>
                <span className="eyebrow">GIVE YOUR CURIOSITY DIRECTION</span>
                <h2>Learning goals</h2>
              </div>
              <button
                className="button"
                onClick={() => openEditor({ kind: "goal" })}
              >
                <Plus size={16} /> Add a goal
              </button>
            </div>
            {library.goals.length ? (
              <div className="goal-list">
                {library.goals.map((goal) => (
                  <article
                    className={`goal-item ${goal.completed ? "complete" : ""}`}
                    key={goal.id}
                  >
                    <button
                      className="goal-check"
                      aria-label={`${goal.completed ? "Reopen" : "Complete"} goal: ${goal.title}`}
                      aria-pressed={goal.completed}
                      onClick={() => void toggleGoal(goal)}
                    >
                      {goal.completed && <Check size={17} />}
                    </button>
                    <span>{goal.title}</span>
                    <button
                      className="icon-action"
                      aria-label={`Edit ${goal.title}`}
                      onClick={() => openEditor({ kind: "goal", item: goal })}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-action"
                      aria-label={`Delete ${goal.title}`}
                      onClick={() => void remove("goal", goal.id, goal.title)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="goal-empty">
                <Target size={32} strokeWidth={1} />
                <h3>What would you like to understand?</h3>
                <p>A good question is a wonderful place to start.</p>
                <button
                  className="text-link"
                  onClick={() => openEditor({ kind: "goal" })}
                >
                  Set your first learning goal <Plus size={15} />
                </button>
              </div>
            )}
          </section>
          <section className="interests-section">
            <span className="eyebrow">FOLLOW YOUR INTERESTS</span>
            <h2>What draws you in?</h2>
            <p className="muted">
              Choose the subjects you care about. These choices help shape your
              exploration; you can change them any time.
            </p>
            <div className="interest-chips">
              {subjectOptions.map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={library.interests.includes(id)}
                  className={library.interests.includes(id) ? "selected" : ""}
                  onClick={() => void toggleInterest(id)}
                >
                  {library.interests.includes(id) && <Check size={13} />}
                  {label}
                </button>
              ))}
            </div>
          </section>
          <Link href="/learning-paths" className="learning-path-callout">
            <img src="/assets/empty-learning-path.svg" alt="" />
            <div>
              <span className="eyebrow">ONE IDEA LEADS TO ANOTHER</span>
              <h3>Take the scenic route.</h3>
              <p>Follow a learning path through connected ideas.</p>
            </div>
            <ChevronRight size={22} />
          </Link>
        </div>
      )}
      {library && tab === "notes" && (
        <div
          role="tabpanel"
          id="space-panel-notes"
          aria-labelledby="space-tab-notes"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">THINK IT THROUGH</span>
              <h2>Learning notes</h2>
            </div>
            <button
              className="button"
              onClick={() => openEditor({ kind: "note" })}
            >
              <Plus size={16} /> New note
            </button>
          </div>
          {library.notes.length ? (
            <div className="notes-grid">
              {library.notes.map((note) => (
                <article className="note-card" key={note.id}>
                  <div>
                    <Pencil size={16} />
                    <button
                      className="icon-action"
                      aria-label={`Delete note ${note.title}`}
                      onClick={() => void remove("note", note.id, note.title)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <button
                    className="note-open"
                    onClick={() => openEditor({ kind: "note", item: note })}
                  >
                    <h3>{note.title}</h3>
                    <p>
                      {note.body ||
                        "A blank page, ready for your next thought."}
                    </p>
                    <span className="text-link">
                      Open note <ChevronRight size={14} />
                    </span>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="personal-empty">
              <Pencil size={40} strokeWidth={1} />
              <span className="eyebrow">MAKE THE CONNECTION YOUR OWN</span>
              <h3>Good ideas deserve a margin.</h3>
              <p>
                Keep your questions, observations and moments of understanding.
              </p>
              <button
                className="button"
                onClick={() => openEditor({ kind: "note" })}
              >
                Write your first note <Plus size={15} />
              </button>
            </div>
          )}
        </div>
      )}
      {editor && (
        <FormDialog
          title={`${"item" in editor && editor.item ? "Edit" : editor.kind === "podcast" ? "Save a" : "New"} ${editor.kind === "podcast" ? "Spotify podcast" : editor.kind}`}
          close={() => {
            if (!pending) setEditor(null);
          }}
        >
          <form onSubmit={save} className="personal-edit-form">
            <label className="field">
              {editor.kind === "collection"
                ? "Collection name"
                : editor.kind === "podcast"
                  ? "Spotify show or episode URL"
                  : editor.kind === "goal"
                    ? "What would you like to learn?"
                    : "Note title"}
              <input
                autoFocus
                required
                type={editor.kind === "podcast" ? "url" : "text"}
                maxLength={editor.kind === "podcast" ? 500 : 160}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  editor.kind === "podcast"
                    ? "https://open.spotify.com/show/…"
                    : editor.kind === "collection"
                      ? "e.g. The night sky"
                      : editor.kind === "goal"
                        ? "e.g. Understand how stars are born"
                        : "A thought worth keeping"
                }
              />
            </label>
            {(editor.kind === "collection" || editor.kind === "note") && (
              <label className="field">
                {editor.kind === "collection"
                  ? "Description (optional)"
                  : "Your notes"}
                <textarea
                  rows={editor.kind === "note" ? 9 : 3}
                  maxLength={editor.kind === "note" ? 20000 : 1000}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    editor.kind === "note"
                      ? "Questions, connections, things to remember…"
                      : "What connects the discoveries in this collection?"
                  }
                />
              </label>
            )}
            {editor.kind === "podcast" && (
              <>
                <label className="field">
                  Collection
                  <select
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                  >
                    <option value="">No collection</option>
                    {library?.collections.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="form-help">
                  Only official Spotify show and episode links are supported.
                  Metadata is fetched from Spotify. Playback availability
                  depends on Spotify, your region and your account.
                </p>
              </>
            )}
            {formError && (
              <p className="form-message error" role="alert">
                {formError}
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="button"
                disabled={pending}
                onClick={() => setEditor(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={pending}
              >
                {pending
                  ? "Saving…"
                  : editor.kind === "podcast"
                    ? "Save podcast"
                    : "Save changes"}
                {!pending && <Check size={15} />}
              </button>
            </div>
          </form>
        </FormDialog>
      )}
    </div>
  );
}
export function PersonalSpace({
  initialTab,
}: {
  initialTab?: "library" | "learning" | "notes";
}) {
  return (
    <PrivateGate>
      <SpaceContent initialTab={initialTab} />
    </PrivateGate>
  );
}

function LearningHistory() {
  const { library, loading, error, reload } = useLibrary();
  useEffect(() => {
    void reload();
  }, [reload]);
  const activity = (library?.progress || [])
    .filter(
      (item) =>
        item.completed &&
        paths.some(
          (path) => path.slug === item.pathId && path.steps[item.stepIndex],
        ),
    )
    .sort(
      (a, b) =>
        (b.updatedAt ? Date.parse(b.updatedAt) : 0) -
        (a.updatedAt ? Date.parse(a.updatedAt) : 0),
    );
  return (
    <div className="page-wrap personal-page">
      <span className="eyebrow">YOUR SPACE / LEARNING HISTORY</span>
      <h1 className="serif" style={{ fontSize: 48, margin: "14px 0 12px" }}>
        Learning history
      </h1>
      <p className="muted" style={{ fontSize: 12, marginBottom: 30 }}>
        A record of the steps you have chosen to mark as explored.
      </p>
      {loading ? (
        <p role="status">Loading your learning history…</p>
      ) : error ? (
        <p role="alert" className="form-message error">
          {error}{" "}
          <button className="text-link" onClick={() => void reload()}>
            Try again
          </button>
        </p>
      ) : activity.length ? (
        <div className="learning-history-list">
          {activity.map((item) => {
            const path = paths.find((path) => path.slug === item.pathId)!;
            const subject = getSubject(path.subject)!;
            return (
              <Link
                href={"/learning-paths/" + path.slug}
                className="learning-history-item"
                key={item.pathId + item.stepIndex}
              >
                <img src={"/assets/" + subject.image} alt="" loading="lazy" />
                <div>
                  <span className="eyebrow">{path.title}</span>
                  <h2>{path.steps[item.stepIndex].title}</h2>
                  <p>
                    Marked as explored
                    {item.updatedAt
                      ? " · " +
                        new Intl.DateTimeFormat("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(item.updatedAt))
                      : ""}
                  </p>
                </div>
                <Check size={18} />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="personal-empty">
          <img src="/assets/empty-library.svg" alt="" />
          <h2>A record of your curiosity.</h2>
          <p>
            Your learning-path progress will appear here when you mark a step as
            explored. Video history will become available when videos are
            published.
          </p>
          <Link href="/learning-paths" className="button">
            Find a learning path <ChevronRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}

export function PrivateEmptyPage({
  kind,
}: {
  kind: "watch-later" | "history" | "subscriptions";
}) {
  if (kind === "history")
    return (
      <PrivateGate feature="your learning history">
        <LearningHistory />
      </PrivateGate>
    );
  const titles = {
    "watch-later": "Good things can wait.",
    history: "A record of your curiosity.",
    subscriptions: "Stay close to great ideas.",
  };
  const headings = {
    "watch-later": "Watch Later",
    history: "Learning history",
    subscriptions: "Subscriptions",
  };
  return (
    <PrivateGate feature={headings[kind]}>
      <div className="page-wrap">
        <span className="eyebrow">
          YOUR SPACE / {headings[kind].toUpperCase()}
        </span>
        <h1 className="serif">{headings[kind]}</h1>
        <div className="personal-empty">
          <img src="/assets/empty-library.svg" alt="" />
          <h2>{titles[kind]}</h2>
          <p>
            {kind === "watch-later"
              ? "There are no published videos to save yet. In the meantime, collect an educational podcast in Your Space."
              : "Creator subscriptions will be available when channels begin publishing. Explore connected subjects while the library grows."}
          </p>
          <Link
            href={kind === "subscriptions" ? "/subjects" : "/space"}
            className="button"
          >
            {kind === "subscriptions" ? "Explore subjects" : "Go to Your Space"}{" "}
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </PrivateGate>
  );
}
