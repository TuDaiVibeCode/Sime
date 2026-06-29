# Tasks

## Active

## Waiting On

- [ ] **Restore local Redis/Docker** - Backend and frontend are running, but `/health` reports Redis unavailable because Docker Desktop API did not become ready on 2026-06-06. Job and live-frame dispatch fall back safely until Redis is back.

## Someday

- [ ] **Worker: RMVPE weights** - SwiftF0 now runs real inference (see Done). RMVPE is wired in `worker/pitch.py` but needs the `rmvpe` package + a downloaded `rmvpe.pt` (set `RMVPE_MODEL_PATH`); until then `rmvpe` requests fall back to pYIN.
- [ ] **Dataset and model pipeline** - Add dataset ingestion plan for VocalSet, Vocadito, SpeechSynth, and AVID when training assets are available.
- [ ] **Production hardening** - Add CI, deployment config, observability, backups, and rotation policy for secrets.

## Done

- [x] ~~**Backend lessons module restored + curriculum gaps closed** - The lectures restructure (subjects > lectures > lessons, migration `20260612000000_add_lesson_lectures`) had left the backend unbuildable: `src/data/lessons.ts` was missing while `repositories/lessons.ts` and `lessons.routes.ts` imported it. Reconstructed it from the compiled `dist/data/lessons.js` (types, static fallback curriculum mirroring `prisma/seed.ts`, vi localization, `findLesson`/`localizeSubjects`/`localizeLesson`). Backend builds, 6/6 tests pass, DB path verified (4 subjects / 8 lectures / 18 lessons, `findLessonFromDb` returns lecture context). Also added the 6 missing `lessonStudyLinks` entries in `frontend/lib/vocalStudy.ts` (onset-control, vowels-formants, passaggio-bridging, runs-riffs, vocal-health, avoid-strain) so all 18 lessons have "Go deeper" links; frontend typecheck clean. Confirmed `/help`, `/docs`, `/about`, `/api-docs` are linked from `SiteFooter` (not orphans).~~ (2026-06-12)

- [x] ~~**Worker SwiftF0 real inference** - `worker/pitch.py` now runs real SwiftF0 (ONNX, CPU) via the `swift-f0` package (added to `requirements.txt`, `SWIFTF0_CONFIDENCE` tunable) and wires RMVPE (torch + `rmvpe.pt` via `RMVPE_MODEL_PATH`). Both model instances are cached; any missing/erroring model degrades to pYIN via `_try`. Verified end to end: 220/440/587 Hz sines -> A3/A4/D5 with `modelUsed=swiftf0`. SwiftF0 is what the live Practice frames request, so live "Server pitch" is now real neural F0.~~ (2026-06-07)

- [x] ~~**Worker live results bridge (return path)** - Backend subscribes the `sime:live-analysis:results` Redis channel (`subscribeLiveAnalysisResults` in `lib/redis.ts`, dedicated long-lived subscriber) and routes each worker pitch result to its browser by `sessionId` over `/ws/live-analysis` (`live/liveAnalysis.ts` keeps a `sessionId -> ws` registry, drops it on close/error, never echoes `userId` back). `PracticePanel.tsx` now has a `ws.onmessage` that reads `live_result` and shows a secondary "Server pitch" readout (note / cents / actual model). Degrades safely when Redis is down. Needs `NEXT_PUBLIC_BACKEND_WS_URL` set + worker running to display. All 5 backend smoke tests pass.~~ (2026-06-07)

- [x] ~~**Python AI worker (initial)** - Added `worker/` (run `python -m worker`): Redis loop consuming `sime:analysis:jobs`, authenticated PATCH callback to `/api/workers/analysis-jobs/:id`, pitch via librosa pYIN (CPU default) with optional CREPE on GPU, range/transposition/coach_payload ported from `vocalAnalysis.ts` (verified to match), approximate metrics, and live-frame pitch published to `sime:live-analysis:results`. README with setup + example payloads.~~ (2026-06-06)

- [x] ~~**Frontend teaching layer (study + tools)** - Added the dashboard home, full lesson guides (drills, progression, pro tips), a "From first note to diva" roadmap, the `/study` handbook (12 articles distilled from vocal_docs.md), and interactive diagnostics: `/range-test` (range -> voice type, Kim/Tho, passaggio via public `/api/analysis/range`), `/transpose` (Smart Transpose via `/api/analysis/transpose`), `/pitch-test` (oscillator + sung match, scored), and `/warmup` (timed SOVT routine). Practice gained a cents tuning bar, a clipping warning, and a scrolling pitch trail. Pitch-only honesty kept throughout; deeper measures marked planned.~~ (2026-06-06)

- [x] ~~**Phase 11: Frontend voice profile and job dashboards** - Added `/studio` page, same-origin proxies for latest voice profile and analysis jobs (UUID-validated `[id]` route), and a `JobDashboard` client that queues a job, shows Redis dispatch, polls status, and renders worker results. Embedding search UI deferred: it needs a 1536-dim vector only the Python worker can produce, so it stays a worker/API concern for now.~~ (2026-06-05)
- [x] ~~**Phase 10: Frontend auth and progress integration** - Added same-origin auth/progress proxies, account page, session actions, and lesson progress saving.~~ (2026-06-05)
- [x] ~~**Phase 9: Live analysis transport** - Added authenticated `/ws/live-analysis`, Redis live frame dispatch, docs, and WebSocket smoke coverage.~~ (2026-06-05)
- [x] ~~**Phase 8: Vector similarity API** - Added user-scoped pgvector embedding storage/search routes, repository queries, OpenAPI docs, and smoke coverage.~~ (2026-06-05)
- [x] ~~**Phase 7: Worker result callback** - Added secured worker job updates, persisted result payloads, documented the route, and redacted sensitive request headers in logs.~~ (2026-06-05)
- [x] ~~**Install pgvector for PostgreSQL 18** - Built pgvector 0.8.2 with `nmake`, installed it into `E:\PostgreSQL\18`, and applied `003_pgvector.sql` to `sime_db`.~~ (2026-06-05)
- [x] ~~**Run Redis locally** - Started Redis 7 in Docker and verified backend Redis connectivity.~~ (2026-06-05)
- [x] ~~**Phase 6 follow-up: OpenAPI and deeper tests** - Added `openapi.yaml`, DB-backed auth/progress/profile/job smoke tests, and `npm run audit:security`.~~ (2026-06-05)
- [x] ~~**Phase 4 follow-up: Redis dispatch implementation** - Added Redis queue/channel dispatch for `analysis_jobs` with Postgres-first fallback when Redis is unavailable.~~ (2026-06-05)
- [x] ~~**Run local PostgreSQL setup** - Created and seeded `sime_db` with 3 tracks and 12 lessons.~~ (2026-06-05)
- [x] ~~**Phase 5: Gemini coaching service** - Added authenticated Gemini coaching endpoint from compact payloads with safety-first system prompt.~~ (2026-06-05)
- [x] ~~**Phase 4: Analysis job contracts** - Added authenticated `analysis_jobs` create/read endpoints as the DB-backed contract for future Redis/Python worker dispatch.~~ (2026-06-05)
- [x] ~~**Phase 3: Auth and protected user state** - Added DB-backed register/login/logout/me, scrypt password hashing, signed httpOnly cookies, and protected progress read/write routes.~~ (2026-06-05)
- [x] ~~**Phase 2: Postgres and pgvector foundation** - Added local setup script, migrations, seed data, database docs, and env connection placeholders for users, lessons, progress logs, voice profiles, analysis jobs, and embeddings.~~ (2026-06-05)
- [x] ~~**Phase 1: Backend contracts and safe mock analysis** - Added validated endpoints for range, transposition, model routing notes, and LLM-ready coaching payloads without persistence.~~ (2026-06-05)
