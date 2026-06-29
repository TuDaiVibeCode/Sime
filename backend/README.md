# Sime - Backend

API + data layer for the Sime app. The heavy audio/ML work lives in a separate
**Python AI service**; this Express layer owns auth, business logic, and persistence.

## Intended stack
- **Express.js** (Node) - REST API for the Next.js frontend
- **PostgreSQL** for users, lessons, progress, subscriptions
- **Python AI service** (FastAPI) for audio analysis: pitch (CREPE), vocal range, tone, timing
- Auth: session or JWT, hashed passwords (argon2/bcrypt), httpOnly + SameSite cookies

## Shape
```
frontend (Next.js)
  -> backend (Express)        auth, lessons, progress, DB
  -> python-ai (FastAPI)      pitch / range / tone / timing analysis
```

> Billing is intentionally out of scope: all features are free for everyone right now. No payment, no plans, no `/billing` routes until that changes.

## Security rules (project-wide, enforced on every diff)
- Parameterized queries only - no string-built SQL (SQLi)
- Validate every request body/param/query (zod or equivalent) before use
- Output encoding; never reflect raw input
- Rate limiting + auth on every route; least-privilege DB user
- Secrets in env, never in code or commits
- CORS locked to known origins; helmet for security headers
- `security-reviewer` + `secure-code-guardian` pass before merge

## Next steps
1. `npm init` + Express + TypeScript + zod + helmet
2. Define `/auth`, `/lessons`, `/progress` routers (no billing - all free)
3. Stand up Python FastAPI service for `/analyze` and contract the JSON shape

## Current API contract slice

The backend now includes a safe Phase 1 analysis contract:

- `POST /api/analysis/range` - validates stable note samples and returns safe vocal range, voice type, color, passaggio hint, and roadmap stage.
- `POST /api/analysis/transpose` - calculates a bounded smart key shift with a maximum of 4 semitones.
- `POST /api/analysis/coach-payload` - converts analysis metrics into the compact LLM-ready JSON shape from `PLANS.md`.
- `POST /api/analysis/coach` - authenticated AI coaching call. OpenAI Responses API is used first when `OPENAI_API_KEY` is configured; Gemini remains a fallback when `GEMINI_API_KEY` is configured.
- `POST /api/analysis/jobs` - authenticated analysis job contract for future Redis/Python worker dispatch.
- `GET /api/analysis/jobs/:id` - authenticated job status lookup.
- `PATCH /api/workers/analysis-jobs/:id` - bearer-token worker callback for running/succeeded/failed job updates.
- `POST /api/voice-profiles/:id/embeddings` - stores a 1536-dimension pgvector embedding for an owned voice profile.
- `POST /api/voice-profiles/embeddings/search` - searches the current user's embeddings by cosine similarity.
- `WS /ws/live-analysis` - authenticated live audio-frame bridge to Redis for SwiftF0/RMVPE workers.
- `GET /api/analysis/models` - documents the intended SwiftF0/RMVPE/CREPE routing roles.

The deterministic analysis endpoints do not persist data. Auth, progress, and
analysis job endpoints use PostgreSQL once `DATABASE_URL` is configured.

OpenAPI documentation lives at `openapi.yaml`.

LLM coaching defaults to `OPENAI_MODEL=gpt-4.1-mini` through the OpenAI Responses API. Put your real key in `OPENAI_API_KEY` inside `backend/.env`; keep the file uncommitted. You can switch to `gpt-4o-mini` or another low-cost model by changing `OPENAI_MODEL`.

## Database

Database files live in `db/`.

```powershell
cd E:\Sime\backend
$env:PGPASSWORD = "<your-postgres-password>"
.\db\setup-local.ps1 -User app_backend -Database sime_db -Schema public
Remove-Item Env:PGPASSWORD
```

The core schema stores embeddings as a 1536-dimension `real[]` so local setup
works even before pgvector is installed. After installing pgvector for this
PostgreSQL instance, apply `db/migrations/003_pgvector.sql` to add the vector
column and HNSW index.

## Worker callback security

Set a 32+ character `WORKER_SHARED_SECRET` in `backend/.env`. Python workers
must send it as `Authorization: Bearer <token>` when reporting job status. Do
not reuse browser session cookies for worker calls.

## Live analysis WebSocket

Authenticated browser clients connect to `/ws/live-analysis` with the normal
`sime_session` cookie. Each message must be JSON:

```json
{
  "type": "audio_frame",
  "sequence": 1,
  "sampleRate": 16000,
  "frameSize": 2048,
  "model": "swiftf0",
  "audioBase64": "..."
}
```

The backend validates frame size and publishes to
`sime:live-analysis:frames:new`; Python workers own DSP inference.
