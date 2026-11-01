# Cookie Storage Notice Implementation Plan

> **For agentic workers:** Use subagent-driven-development for the independent notice module and route-boundary work, followed by independent specification and code-quality review. Steps use checkbox syntax for tracking.

**Goal:** Publish the approved truthful browser-storage notice without granting AI approval or starting authentication on ordinary public-page visits.

**Architecture:** A dependency-free notice entry serves all six HTML pages. Pure modules handle the acknowledgement lifetime and URL-only legacy callback routing. Landing rendering is separated from the lazily loaded authenticated application. Existing AI/auth storage and backend remain unchanged.

**Tech Stack:** TypeScript, React 19, Vite, Node test runner, existing GitHub Pages pipeline.

---

### Task 1: Notice state and accessible shared UI

Files: create `src/storage-notice-state.ts`, `src/storage-notice-state.test.mjs`, `src/storage-notice.ts`, `src/storage-notice.css`.

- [ ] Write and run failing state tests before implementation: fresh visitor makes no write; only acknowledgement writes the versioned timestamp; 180-day expiry, future/invalid timestamps and unknown versions fail open to showing the notice; storage read/write/remove failure is tolerated; unrelated auth/AI keys remain unchanged.
- [ ] Implement `createStorageNoticeState(storage, now)` with a fixed public key and version, `isDismissed()` and `dismiss()`. Only the requested preference is touched; no account/session values are read. Expired preferences are ignored and removal attempted when next visited.
- [ ] Implement shared nonmodal banner, a permanent reopen link, and native modal dialog with labelled close, Escape, focus containment/return, scrollable content and visible focus. Link to `/privacy.html#browserspeicher` works without JavaScript. Do not use tracking vendor, network calls, blanket approval or AI mutations.
- [ ] Explain login, AI approval, notice preference, actual retention boundaries and absence of app analytics/advertising code accurately. Prevent initial banner focus theft, modal background interaction, and banner overlap with content. A failed preference write still closes the banner for the current page.
- [ ] Verify focused tests and `tsc -b`.

### Task 2: Separate landing from auth and preserve callbacks

Files: split `src/App.tsx` into router, `src/LandingPage.tsx`, `src/AppRuntime.tsx`; create `src/auth-callback-route.ts` and `.test.mjs`; update signup `emailRedirectTo` explicitly to `/app/`.

- [ ] Write failing synthetic URL tests for ordinary marketing parameters, implicit token fragment, code query, confirmation/recovery and error callbacks. Preserve raw search/hash bytes exactly; never print real tokens.
- [ ] Implement URL-only root callback routing to `/app/`; detect only auth-shaped parameters on `/` or `/index.html`. No arbitrary destination or network request. App routes do not loop.
- [ ] Move existing landing/UI helpers unchanged. Lazy-load AppRuntime so the public root's static module graph cannot import Supabase or AI storage initialization. Keep current loading screen and auth behavior.
- [ ] Verify existing account/AI tests plus callback tests. Inspect built static imports to ensure public rendering does not load auth.

### Task 3: HTML and disclosure integration

Files: `index.html`, `app/index.html`, `privacy.html`, `terms.html`, `impressum.html`, `avv.html`, `src/LandingPage.tsx`, `src/AppRuntime.tsx`, `package.json`, `scripts/verify-pages.mjs`.

- [ ] Add shared notice module to all six HTML entries and plain footer links to storage disclosure; enhance those anchors to open details when JavaScript works. Keep `/knie` unchanged.
- [ ] Update privacy section 2 and publication date, with the real key families, no fixed invented auth lifetime, acknowledgement validity versus physical retention, no automatic account deletion via browser clearing, no blanket statement that all persistence is indispensable. Preserve all existing incident warnings.
- [ ] Include new state/callback tests in `npm test`. Extend Pages verification for notice bundle on six pages, disclosure anchor and static import boundaries; retain existing asset/font/static-content checks.
- [ ] Run `npm test`, `npm run build`, `npm run check:pages`. Browser-check normal root, app login, all legal entrypoints, notice actions, Escape/focus return, narrow viewport and no overflow.

### Task 4: Review, publish, and guide remaining legal work

- [ ] Independently review spec compliance, then code quality; resolve actionable issues and rerun appropriate checks.
- [ ] Commit scoped work, fast-forward the primary main only after a clean-worktree check, push the authorized website update. Wait for the actual GitHub Pages workflow success.
- [ ] Verify delivered public HTML/bundles and visible notice. Save a screenshot of the actual public result. Do not claim full legal compliance.
- [ ] Start the remaining legal walkthrough with the incident and notification assessment; distinguish unsubmitted drafts from filed documents and do not transmit customer data, legal declarations or messages automatically.
