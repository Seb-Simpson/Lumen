"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import "./personal.css";

/** Apply account preferences after login without transferring any private data to storage. */
export function PersonalPreferencesSync() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    let removeMediaListener: (() => void) | undefined;
    void fetch("/api/library", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (controller.signal.aborted) return;
        const prefs = data.preferences as Record<string, unknown> | undefined;
        if (!prefs) return;
        if (
          typeof prefs.theme === "string" &&
          ["dark", "light", "system"].includes(prefs.theme)
        ) {
          const theme = prefs.theme;
          localStorage.setItem("lumen-theme", theme);
          const media = window.matchMedia("(prefers-color-scheme: light)");
          const applyTheme = () => {
            document.documentElement.dataset.theme =
              theme === "system" ? (media.matches ? "light" : "dark") : theme;
            window.dispatchEvent(new Event("lumen-theme-change"));
          };
          applyTheme();
          if (theme === "system") {
            media.addEventListener("change", applyTheme);
            removeMediaListener = () =>
              media.removeEventListener("change", applyTheme);
          }
        }
        if (typeof prefs.focusMode === "boolean") {
          localStorage.setItem("lumen-focus", String(prefs.focusMode));
          document.documentElement.dataset.focus = String(prefs.focusMode);
          window.dispatchEvent(new Event("lumen-focus-change"));
        }
        if (typeof prefs.reducedMotion === "boolean") {
          localStorage.setItem(
            "lumen-reduced-motion",
            String(prefs.reducedMotion),
          );
          document.documentElement.dataset.reduceMotion = String(
            prefs.reducedMotion,
          );
        }
      })
      .catch(() => {
        /* Preference hydration is optional; settings exposes retryable data errors. */
      });
    return () => {
      controller.abort();
      removeMediaListener?.();
    };
  }, [userId]);
  return null;
}
