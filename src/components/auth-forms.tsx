"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Mail,
  MoveUpRight,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import "./personal.css";

type AuthMode =
  "sign-in" | "sign-up" | "forgot-password" | "reset-password" | "verify-email";
const copy: Record<
  AuthMode,
  { eyebrow: string; title: string; description: string }
> = {
  "sign-in": {
    eyebrow: "WELCOME BACK",
    title: "A little more curious.",
    description: "Sign in to your own corner of the world of knowledge.",
  },
  "sign-up": {
    eyebrow: "A NEW CHAPTER",
    title: "Make room for wonder.",
    description:
      "Build a library, follow your curiosity, and make learning your own.",
  },
  "forgot-password": {
    eyebrow: "FIND YOUR WAY BACK",
    title: "A fresh beginning.",
    description:
      "Enter your email and we’ll send instructions to reset your password.",
  },
  "reset-password": {
    eyebrow: "A FRESH BEGINNING",
    title: "Choose a new password.",
    description: "Use a unique password of at least 12 characters.",
  },
  "verify-email": {
    eyebrow: "ONE MORE STEP",
    title: "Your invitation awaits.",
    description: "Verify your email to keep your Lumen account secure.",
  },
};

function AuthFormInner({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const text = copy[mode];
  const needsPassword = ["sign-in", "sign-up", "reset-password"].includes(mode);
  const safeNext = params.get("next");
  const destination =
    safeNext?.startsWith("/") &&
    !safeNext.startsWith("//") &&
    !safeNext.includes("\\")
      ? safeNext
      : "/space";
  const token = params.get("token");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    try {
      if (mode === "sign-in") {
        const result = await authClient.signIn.email({ email, password });
        if (result.error)
          throw new Error(
            result.error.message ||
              "Unable to sign in. Check your email and password.",
          );
        router.push(destination);
        router.refresh();
      } else if (mode === "sign-up") {
        const result = await authClient.signUp.email({
          name: name.trim(),
          email,
          password,
          callbackURL: window.location.origin + "/space",
        });
        if (result.error)
          throw new Error(
            result.error.message ||
              "Unable to create your account. Please try again.",
          );
        setNotice(
          "Your account has been created. Check your inbox for a verification link before signing in.",
        );
        setPassword("");
      } else if (mode === "forgot-password") {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: window.location.origin + "/reset-password",
        });
        if (result.error)
          throw new Error(
            result.error.message ||
              "Unable to send recovery instructions. Please try again.",
          );
        setNotice(
          "If an account matches this email, recovery instructions are on their way. Check your inbox and spam folder.",
        );
      } else if (mode === "reset-password") {
        if (!token)
          throw new Error(
            "This reset link is missing a token. Request a new recovery email.",
          );
        const result = await authClient.resetPassword({
          newPassword: password,
          token,
        });
        if (result.error)
          throw new Error(
            result.error.message ||
              "This reset link has expired. Request a new recovery email.",
          );
        setNotice(
          "Password updated. You can now sign in with your new password.",
        );
        setPassword("");
      } else {
        const result = await authClient.sendVerificationEmail({
          email,
          callbackURL: window.location.origin + "/space",
        });
        if (result.error)
          throw new Error(
            result.error.message ||
              "Unable to send verification email. Please try again.",
          );
        setNotice(
          "If this account needs verification, a fresh link is on its way. Check your inbox.",
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-art" aria-label="An invitation to discovery">
        <img
          src="/assets/auth-environment.webp"
          alt=""
          className="auth-environment"
        />
        <div className="auth-art-shade" />
        <Link href="/" className="auth-brand">
          LUMEN<span>∞</span>
        </Link>
        <div className="auth-art-copy">
          <span className="eyebrow">CURIOSITY DESERVES A BETTER PLATFORM</span>
          <h2>
            The world is full
            <br />
            of beginnings.
          </h2>
          <p>
            Follow a question. Discover a connection.
            <br />
            Find something that changes how you see.
          </p>
        </div>
        <span className="auth-art-caption">
          A NEW HOME FOR LEARNING <MoveUpRight size={14} />
        </span>
      </section>
      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <Link className="auth-back" href="/">
            ← Back to discovery
          </Link>
          <span className="eyebrow">{text.eyebrow}</span>
          <h1>{text.title}</h1>
          <p className="muted auth-description">{text.description}</p>
          {params.get("error") && (
            <p className="form-message error" role="alert">
              This link is invalid or has expired. Request a new verification
              email below.
            </p>
          )}
          {notice ? (
            <div className="auth-success">
              <span className="success-icon">
                <Check size={22} />
              </span>
              <p role="status">{notice}</p>
              <Link className="button primary" href="/sign-in">
                Go to sign in <ArrowRight size={16} />
              </Link>
              {mode === "sign-up" && (
                <Link href="/verify-email" className="text-link">
                  Resend verification email
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="auth-form">
              {mode === "sign-up" && (
                <label className="field">
                  Your name
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="How should we address you?"
                  />
                </label>
              )}
              {mode !== "reset-password" && (
                <label className="field">
                  Email address
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
              )}
              {needsPassword && (
                <label className="field">
                  {mode === "reset-password" ? "New password" : "Password"}
                  <span className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete={
                        mode === "sign-in" ? "current-password" : "new-password"
                      }
                      required
                      minLength={mode === "sign-in" ? 1 : 12}
                      maxLength={128}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        mode === "sign-in"
                          ? "Your password"
                          : "At least 12 characters"
                      }
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </label>
              )}
              {mode === "sign-in" && (
                <Link href="/forgot-password" className="auth-forgot">
                  Forgot password?
                </Link>
              )}
              {mode === "sign-up" && (
                <p className="form-help">
                  By creating an account, you agree to our{" "}
                  <Link href="/community">community standards</Link> and
                  acknowledge our <Link href="/privacy">privacy policy</Link>.
                </p>
              )}
              {error && (
                <p className="form-message error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="button primary auth-submit"
                disabled={pending || (mode === "reset-password" && !token)}
                type="submit"
              >
                {pending
                  ? "Please wait…"
                  : mode === "sign-in"
                    ? "Sign in"
                    : mode === "sign-up"
                      ? "Create your account"
                      : mode === "reset-password"
                        ? "Update password"
                        : mode === "verify-email"
                          ? "Send verification link"
                          : "Send recovery instructions"}
                {mode === "forgot-password" || mode === "verify-email" ? (
                  <Mail size={17} />
                ) : (
                  <ArrowRight size={17} />
                )}
              </button>
              {mode === "reset-password" && !token && (
                <p className="form-message error">
                  Open the link in your recovery email, or{" "}
                  <Link href="/forgot-password">request a new link</Link>.
                </p>
              )}
            </form>
          )}
          {mode === "sign-in" && (
            <p className="auth-switch">
              New to Lumen? <Link href="/sign-up">Begin your journey</Link>
            </p>
          )}
          {mode === "sign-up" && (
            <p className="auth-switch">
              Already have an account? <Link href="/sign-in">Sign in</Link>
            </p>
          )}
          {(mode === "forgot-password" || mode === "verify-email") && (
            <p className="auth-switch">
              <Link href="/sign-in">Return to sign in</Link>
            </p>
          )}
          <p className="auth-privacy">
            Your curiosity is yours. No ads. No invasive tracking.
          </p>
          {process.env.NODE_ENV === "development" && mode !== "sign-in" && (
            <p className="form-help">
              Local development: emails are written to <code>.data/mail/</code>.
              Open the latest message’s link to continue. External delivery
              requires an email provider.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  return (
    <Suspense
      fallback={
        <div className="page-wrap">
          <p role="status">Preparing your next chapter…</p>
        </div>
      }
    >
      <AuthFormInner mode={mode} />
    </Suspense>
  );
}
