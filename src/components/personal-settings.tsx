"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Download, LogOut, Shield, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  FormDialog,
  libraryMutation,
  PrivateGate,
  useLibrary,
} from "./personal-space";
import "./personal.css";

function SettingsContent() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { library, reload, error } = useLibrary();
  const [name, setName] = useState(session?.user.name || "");
  const [status, setStatus] = useState("");
  const [failure, setFailure] = useState("");
  const [pending, setPending] = useState(false);
  const [preferencePending, setPreferencePending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    if (session?.user.name) setName(session.user.name);
  }, [session?.user.name]);
  async function profile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFailure("");
    setStatus("");
    try {
      const result = await authClient.updateUser({ name: name.trim() });
      if (result.error)
        throw new Error(
          result.error.message || "Unable to update your profile.",
        );
      setStatus("Your profile has been updated.");
    } catch (cause) {
      setFailure(
        cause instanceof Error ? cause.message : "Unable to save profile.",
      );
    } finally {
      setPending(false);
    }
  }
  async function preference(key: string, value: unknown) {
    if (preferencePending) return;
    setPreferencePending(true);
    setFailure("");
    setStatus("");
    try {
      await libraryMutation("POST", {
        entity: "preferences",
        values: { [key]: value },
      });
      await reload();
      if (key === "theme" && typeof value === "string") {
        localStorage.setItem("lumen-theme", value);
        document.documentElement.dataset.theme =
          value === "system"
            ? window.matchMedia("(prefers-color-scheme: light)").matches
              ? "light"
              : "dark"
            : value;
        window.dispatchEvent(new Event("lumen-theme-change"));
      }
      if (key === "reducedMotion") {
        localStorage.setItem("lumen-reduced-motion", String(value));
        document.documentElement.dataset.reduceMotion = String(value);
      }
      if (key === "focusMode") {
        localStorage.setItem("lumen-focus", String(value));
        document.documentElement.dataset.focus = String(value);
        window.dispatchEvent(new Event("lumen-focus-change"));
      }
      setStatus("Preference saved.");
    } catch (cause) {
      setFailure(
        cause instanceof Error ? cause.message : "Unable to save preference.",
      );
    } finally {
      setPreferencePending(false);
    }
  }
  async function logout() {
    setPending(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message);
      router.push("/");
      router.refresh();
    } catch {
      setFailure("Unable to sign out. Please try again.");
    } finally {
      setPending(false);
    }
  }
  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== "DELETE") return;
    setPending(true);
    setFailure("");
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to delete your account.");
      await authClient.signOut();
      router.push("/?account=deleted");
      router.refresh();
    } catch (cause) {
      setFailure(
        cause instanceof Error
          ? cause.message
          : "Unable to delete your account.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="page-wrap settings-page">
      <span className="eyebrow">MAKE YOURSELF AT HOME</span>
      <h1 className="serif">Your preferences.</h1>
      <p className="muted">A learning environment that works for you.</p>
      {status && (
        <div className="personal-notice" role="status">
          <Check size={16} />
          {status}
        </div>
      )}
      {(failure || error) && (
        <p className="form-message error" role="alert">
          {failure || error}
        </p>
      )}
      <div className="settings-columns">
        <aside className="settings-index">
          <a href="#profile">Your profile</a>
          <a href="#learning">Learning & appearance</a>
          <a href="#privacy">Privacy & your data</a>
          <a href="#account">Your account</a>
        </aside>
        <div className="settings-content">
          <section className="settings-section" id="profile">
            <div className="settings-section-heading">
              <span>01</span>
              <div>
                <h2>Your profile</h2>
                <p>The person behind the curiosity.</p>
              </div>
            </div>
            <form onSubmit={profile} className="settings-profile">
              <label className="field">
                Display name
                <input
                  required
                  minLength={1}
                  maxLength={80}
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="field">
                Email address
                <input
                  readOnly
                  type="email"
                  value={session?.user.email || ""}
                />
              </label>
              <p className="form-help">
                {session?.user.emailVerified
                  ? "Your email address is verified."
                  : "Your email address has not been verified."}
              </p>
              <button className="button" disabled={pending} type="submit">
                {pending ? "Saving…" : "Save profile"} <Check size={15} />
              </button>
            </form>
          </section>
          <section className="settings-section" id="learning">
            <div className="settings-section-heading">
              <span>02</span>
              <div>
                <h2>Learning & appearance</h2>
                <p>Set a comfortable pace and place.</p>
              </div>
            </div>
            {!library ? (
              <p role="status">Loading your preferences…</p>
            ) : (
              <div className="settings-rows">
                <label className="settings-row">
                  <span>
                    <strong>Colour theme</strong>
                    <small>Deep observatory or warm reading room.</small>
                  </span>
                  <select
                    aria-label="Colour theme"
                    disabled={preferencePending}
                    value={String(library.preferences.theme || "dark")}
                    onChange={(e) => void preference("theme", e.target.value)}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">Use device setting</option>
                  </select>
                </label>
                <label className="settings-row">
                  <span>
                    <strong>Learning level</strong>
                    <small>
                      Your preferred starting point for discoveries.
                    </small>
                  </span>
                  <select
                    aria-label="Learning level"
                    disabled={preferencePending}
                    value={String(library.preferences.level || "all")}
                    onChange={(e) => void preference("level", e.target.value)}
                  >
                    <option value="all">All levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
                <label className="settings-row">
                  <span>
                    <strong>Focus mode</strong>
                    <small>
                      Simplify the interface and quiet decorative motion.
                    </small>
                  </span>
                  <input
                    className="settings-toggle"
                    type="checkbox"
                    disabled={preferencePending}
                    checked={Boolean(library.preferences.focusMode)}
                    onChange={(e) =>
                      void preference("focusMode", e.target.checked)
                    }
                  />
                </label>
                <label className="settings-row">
                  <span>
                    <strong>Reduce motion</strong>
                    <small>Limit decorative transitions and animations.</small>
                  </span>
                  <input
                    className="settings-toggle"
                    type="checkbox"
                    disabled={preferencePending}
                    checked={Boolean(library.preferences.reducedMotion)}
                    onChange={(e) =>
                      void preference("reducedMotion", e.target.checked)
                    }
                  />
                </label>
                <label className="settings-row">
                  <span>
                    <strong>Remember search history</strong>
                    <small>
                      Off by default. Searches remain private to your account.
                    </small>
                  </span>
                  <input
                    className="settings-toggle"
                    type="checkbox"
                    disabled={preferencePending}
                    checked={Boolean(library.preferences.searchHistory)}
                    onChange={(e) =>
                      void preference("searchHistory", e.target.checked)
                    }
                  />
                </label>
              </div>
            )}
          </section>
          <section className="settings-section" id="privacy">
            <div className="settings-section-heading">
              <span>03</span>
              <div>
                <h2>Privacy & your data</h2>
                <p>Your curiosity belongs to you.</p>
              </div>
            </div>
            <div className="settings-rows">
              <div className="settings-row">
                <span>
                  <strong>Cookie preferences</strong>
                  <small>Choose whether third-party players may load.</small>
                </span>
                <button
                  className="button"
                  onClick={() =>
                    window.dispatchEvent(new Event("lumen-cookie-preferences"))
                  }
                >
                  Manage cookies
                </button>
              </div>
              <div className="settings-row">
                <span>
                  <strong>Export your data</strong>
                  <small>
                    Download your profile, library, goals and notes as JSON.
                  </small>
                </span>
                <a className="button" href="/api/account/export" download>
                  <Download size={15} /> Export
                </a>
              </div>
              <div className="privacy-note">
                <Shield size={22} strokeWidth={1.4} />
                <p>
                  Optional tracking is off by default. Your saved content and
                  notes are private. Lumen does not sell your personal data.{" "}
                  <a href="/privacy">Read the privacy policy</a>.
                </p>
              </div>
            </div>
          </section>
          <section className="settings-section" id="account">
            <div className="settings-section-heading">
              <span>04</span>
              <div>
                <h2>Your account</h2>
                <p>Always in your hands.</p>
              </div>
            </div>
            <div className="settings-rows">
              <div className="settings-row">
                <span>
                  <strong>Sign out</strong>
                  <small>End your session on this device.</small>
                </span>
                <button
                  className="button"
                  disabled={pending}
                  onClick={() => void logout()}
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
              <div className="settings-row">
                <span>
                  <strong>Delete your account</strong>
                  <small>
                    Permanently remove your account and personal learning data.
                  </small>
                </span>
                <button
                  className="button danger-button"
                  onClick={() => {
                    setDeleteOpen(true);
                    setFailure("");
                  }}
                >
                  <Trash2 size={15} /> Delete account
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
      {deleteOpen && (
        <FormDialog
          title="Delete your account?"
          close={() => {
            if (!pending) setDeleteOpen(false);
          }}
        >
          <form className="personal-edit-form" onSubmit={deleteAccount}>
            <p>
              Your profile, collections, saved podcasts, goals and notes will be
              permanently deleted. Export anything you would like to keep first.
            </p>
            <label className="field">
              Your password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="field">
              Type DELETE to confirm
              <input
                required
                autoComplete="off"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="DELETE"
              />
            </label>
            {failure && (
              <p className="form-message error" role="alert">
                {failure}
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="button"
                disabled={pending}
                onClick={() => setDeleteOpen(false)}
              >
                Keep my account
              </button>
              <button
                className="button danger-button"
                disabled={pending || confirmation !== "DELETE"}
                type="submit"
              >
                {pending ? "Deleting…" : "Permanently delete"}
              </button>
            </div>
          </form>
        </FormDialog>
      )}
    </div>
  );
}
export function PersonalSettings() {
  return (
    <PrivateGate feature="your settings">
      <SettingsContent />
    </PrivateGate>
  );
}
