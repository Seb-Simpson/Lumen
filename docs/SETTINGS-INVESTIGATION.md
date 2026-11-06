# Settings suspension investigation

Investigated 6 November 2026. The reported diagnostic is:

> This library called use() to suspend in a previous render but did not call use() when it finished.

## Confirmed dependency source

The installed Next.js 16.4.5 App Router uses its own bundled React 19.3.0-canary-278794d7-20261002 renderer. The direct project dependencies are React/React DOM 19.2.4, within Next's supported peer range. Updating only those direct React packages would not change the renderer that emits this diagnostic.

`node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js` captures this Error inside `trackUsedThenable` (around line 6354). `finishRenderingHooks` (around lines 8066–8072) emits the captured stack when a first-mount component suspended through `use(thenable)` and its matching retry completes without a thenable hook state. A React owner/component stack by itself does not identify which dependency actually called `use()`.

Lumen's relevant component path is root layout → Shell → settings page → PersonalSettings → PrivateGate → SettingsContent. `PrivateGate` reads Next's `usePathname`; `SettingsContent` calls `useRouter`, Better Auth's `useSession` and Lumen's `useLibrary`. Inspection found no conditional hook calls, async client component render or application `use(promise)` in these components. The installed `useRouter` uses context/memo; Better Auth's React store uses ref/callback/external-store hooks, not promise suspension. Therefore neither should be blamed merely because its component appears in an owner stack.

Next's internal `InnerLayoutRouter` and `useActionQueue` do consume pending RSC/navigation promises. They are investigation candidates, not a proven source of this particular report. Next's development navigation instrumentation also uses `use()` on already-fulfilled navigation promises. No speculative framework patch, dependency downgrade, disabled hook checks, console filtering, lost Settings feature or forced full-page navigation was introduced.

## Reproduction results

The exact diagnostic was **not reproduced** in this workspace. Tested signed-out and signed-in Settings hard loads, direct sign-in with `next=/settings`, navigation from Home/Space/paths/podcasts, profile updates, preference changes and refresh persistence. Local tests included CPU/network delay and 1.6-second RSC delays.

The committed real-browser HTTPS forwarding harness also covers authenticated Settings editing, refresh persistence, sign-out/sign-in and cold delayed client navigation. It captures console errors with their original Error stacks and all uncaught page errors, and fails rather than ignores the reported React diagnostic. Its run passed with zero such errors. See FORWARDED-AUTH-TEST.md for exact scope.

During development of the authentication changes, runtime imports of a CLI/environment-loader wrapper were separated into a side-effect-free origin module. Native Node CLI imports and shell failure handling were also checked directly. These are concrete startup/runtime corrections; they do not establish the root cause of the originally reported React diagnostic.

## Status and information still needed

**The original crash is investigated but not confirmed resolved.** The failing remote runtime is unavailable, and no original React stack trace was supplied beyond the message. The first Error stack frames below this diagnostic, the component stack, sign-in state and exact navigation steps are needed to identify and fix the actual failing promise owner without guessing. Please do not include verification links, cookies or passwords in that trace.

Primary references: [React diagnostic implementation](https://github.com/facebook/react/pull/37104), [canary enablement and intended semantics](https://github.com/facebook/react/pull/37491). [An upstream Next issue](https://github.com/vercel/next.js/issues/100115) contains the same text but involves a different routing configuration, so it is not evidence that Lumen has that same defect.
