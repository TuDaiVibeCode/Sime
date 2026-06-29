# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Sime** - an AI vocal training platform (web). Personal AI vocal coaching that analyzes pitch, range, timing, and tone in real time, plus a structured curriculum, personalized to every voice (beginner to pro).

The repo is split into three independent parts, each in its own folder:

```
landing/    BUILT   - marketing site. Plain HTML/CSS/JS, no framework, no build step (intentional, for speed).
frontend/   BUILT   - the authenticated app (practice, lessons, progress, studio, voice). Next.js 16 App Router + Tailwind v4 + Inter, en/vi i18n. See frontend/README.md.
backend/    BUILT   - API + data. Express.js + Prisma 7 (driver adapter @prisma/adapter-pg) + PostgreSQL (pgvector) + Redis. See backend/README.md.
worker/     BUILT(initial) - Python AI worker. Consumes Redis analysis jobs, reports to the backend callback. pYIN default (CPU), CREPE optional (GPU); SwiftF0/RMVPE fall back to pYIN. See worker/README.md.
```

All parts contain real, building code. The Python AI worker now exists in `worker/` and consumes `analysis_jobs` from Redis, reporting results to the worker callback. It does range/transposition/coaching (ported from the backend) and pitch (pYIN by default, CREPE optional). Live worker pitch now returns to the browser: the worker publishes to `sime:live-analysis:results`, the backend subscribes and forwards by `sessionId` over `/ws/live-analysis`, and the Practice page shows a secondary "Server pitch" readout. SwiftF0 now runs real neural inference via the `swift-f0` package (ONNX, CPU) and is the model live frames use; CREPE optional on GPU. Still pending: RMVPE weights (it falls back to pYIN until `rmvpe.pt` is provided via `RMVPE_MODEL_PATH`). See TASKS.md and worker/README.md.

### Runtime data flow
```
Browser (Web Audio API mic capture)
  -> Next.js frontend (UI + server-only API proxies)
     -> Express backend   (auth, lessons, progress, jobs, Postgres, Redis)
     -> Python AI worker  (worker/: pitch via pYIN now / CREPE optional, range, transposition, coaching -> JSON)  [BUILT; live pitch returns to browser via Redis results channel -> WS; SwiftF0 real via swift-f0, CREPE optional, RMVPE falls back to pYIN until rmvpe.pt provided]
```

## Commands

All three parts build and run. Node 18+ required (tested on Node 24). PostgreSQL (5432) and Redis (6379) must be running for full backend function.

```bash
# Run the whole stack (build once, then start backend + frontend + landing):
./start-all.sh                 # bash; Ctrl-C stops all
start-all.bat                  # Windows; stop-all.bat to stop
SKIP_BUILD=1 ./start-all.sh    # fast restart, reuse existing build
# Override ports (defaults shown):
BACKEND_PORT=4000 FRONTEND_PORT=3000 LANDING_PORT=8080 ./start-all.sh

# Or per part:
cd backend  && npm install && npm run build && npm start   # Express API on :4000
cd frontend && npm install && npm run build && npm start   # Next.js on :3000
node scripts/serve-landing.mjs 8080                         # landing on :8080
cd landing  && python -m http.server 5173                   # quick landing preview

# Backend dev (watch) and tests:
cd backend && npm run dev    # tsx watch (can hit EPERM file-watch on this box; prefer build+start)
cd backend && npm test       # build + node --test
```

The static landing server (`scripts/serve-landing.mjs`) is zero-dependency Node (built-ins only, path-traversal guarded), used so the deploy scripts need no extra install.

**Deploy note:** `start-all.*` run the backend in development mode on purpose. The session cookie only gets the `Secure` flag when `NODE_ENV=production`, and Secure cookies are dropped over plain `http://localhost`, which breaks login. For a real HTTPS deploy set `NODE_ENV=production` and put TLS in front of the backend.

## landing/ architecture

- `index.html` - all markup, one page, semantic sections (hero, how, features bento, range, lessons, voices, pricing, cta, footer).
- `css/styles.css` - design system in CSS custom properties at `:root`, then components, then responsive, then a `prefers-reduced-motion` collapse block at the end.
- `js/main.js` - one IIFE, no dependencies. Owns: mobile nav, IntersectionObserver scroll reveals, accordion, email-form validation, the cycling pitch readout, and all `<canvas>` visualizations (hero waveform, feature equalizer, vocal-range maps).

The hero "live session" panel and the range maps are **real `<canvas>` animations**, not images and not fake-screenshot divs. Pitch/note values shown are illustrative demo data, not from a real mic.

## Non-obvious conventions (follow these when editing landing/, and carry the spirit into frontend/)

These are deliberate and easy to break:

- **Single accent, locked.** Everything uses `--accent: #FFB84D` (spotlight amber). Do not introduce a second accent color anywhere.
- **Theme is dark-only and locked.** No section inverts to light. (Light mode is an open follow-up, not yet built.)
- **Radius system:** buttons/chips = pill (`--r-pill`), cards = `--r-card` (18px), inputs = `--r-input` (12px). Keep it consistent.
- **Font:** the `landing/` marketing site is Sora only. The `frontend/` app uses **Inter** (loaded via `next/font`, exposed as `--font-inter`; user decision 2026-06). Do not reintroduce Sora into `frontend/`. No serif in either.
- **Icons:** Phosphor (`@phosphor-icons/web`, `<i class="ph ph-*">`). Never hand-roll SVG icon paths; never mix icon families.
- **ZERO em-dashes (`—`) and en-dashes (`–`)** in any user-visible text. Use a hyphen or restructure. This is enforced; a single one is a regression.
- **Motion:** IntersectionObserver and `requestAnimationFrame` only. No `window.addEventListener('scroll')`. Everything must collapse under `prefers-reduced-motion` (CSS block + the `reduceMotion` guard in main.js). Canvas loops pause when offscreen.
- This page was built under the `design-taste-frontend` skill's anti-slop rules (no AI-purple, no three-equal feature cards, real names in testimonials, hero fits viewport). Keep that bar.

## Security (project-wide mandate, every part, every diff)

Audit for XSS and refuse insecure patterns. Concretely:

- **DOM writes use `textContent`, never `innerHTML`/`insertAdjacentHTML`/`document.write` with dynamic or user data.** main.js already follows this; the signup form never echoes the user's email back into the DOM.
- No inline `<script>` / inline event handlers (keep it CSP-friendly).
- External links get `rel="noopener noreferrer"`.
- Backend (when built): parameterized queries only (no string-built SQL), validate every request input, authz on every route, secrets in env only.
- Run `security-reviewer` / `secure-code-guardian` on changes.

## Environment gotcha (Windows + miniconda)

mempalace is set up here (`mempalace.yaml`, MCP server connected). **The mempalace CLI `status` and `mine` commands segfault** (exit 139) on this machine: `chromadb` 1.5.8's Rust core throws an access violation in `Collection.count()` (Python 3.13 / miniconda / Windows). `mempalace init` works (no count call). To use mining, chromadb needs changing (try `chromadb==1.5.9`, or drop to the pre-Rust `0.5.x` and re-init). This does not affect the app code.

Also: when running mempalace (or other Unicode-printing CLIs) in this shell, prefix `PYTHONUTF8=1 PYTHONIOENCODING=utf-8` or they crash on box-drawing characters (cp1258 console codepage).

**Git Bash + backgrounded npm:** launching `npm start`/`npm run` as a background job (`&`) from Git Bash on this machine fails with MSYS fork errors (`Could not determine Node.js install directory`, `cygheap read copy failed`, `Resource temporarily unavailable`) - the process spawns then dies. Foreground npm is fine. `start-all.sh` works around this by launching the **node binary directly** (`node dist/server.js`, `node node_modules/next/dist/bin/next start`) for its background services. On Windows prefer `start-all.bat` (native cmd, no MSYS layer). This is the same class of issue as the earlier `next dev`/`tsx watch` EPERM spawn failures, so the deploy scripts use production `build`+`start`, not watch mode.
