# Sime

Sime is an AI vocal training platform built for structured, university-style voice coaching. It gives students a simple dashboard, lesson curriculum, live pitch feedback, range and voice-type mapping, AI coach guidance, and worker-backed acoustic analysis.

## What is included

- `landing/`: static marketing site.
- `frontend/`: Next.js App Router product app.
- `backend/`: Express + TypeScript API for auth, lessons, progress, voice profiles, jobs, and worker callbacks.
- `worker/`: Python Redis worker and FastAPI acoustic analysis API.
- `docker-compose.yml`: one-command local deployment with PostgreSQL + pgvector, Redis, backend, frontend, worker, and worker API.
- `.github/workflows/ci.yml`: GitHub Actions CI/CD for builds, tests, Docker validation, and GHCR image publishing.

## Quick start with Docker Compose

Prerequisites:

- Docker Desktop or Docker Engine with Docker Compose.
- Optional: OpenAI or Gemini API key for AI coach responses.

```bash
cp .env.example .env
# Edit JWT_SECRET and WORKER_SHARED_SECRET before real deployment.
# Add OPENAI_API_KEY or GEMINI_API_KEY if you want AI coaching.

docker compose up --build
```

Open:

- Frontend: http://localhost:3000
- Backend health: http://localhost:4000/health
- Worker API health: http://localhost:8000/health

The backend container runs Prisma migrations and seed data on startup. The database image is `pgvector/pgvector:pg16`, so the migration that creates the `vector` extension works without manual Postgres setup.

Useful commands:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f worker
docker compose down
docker compose down -v   # also removes local database and Redis volumes
```

## Manual development

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run typecheck
npm run build
```

Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate
npm run db:seed
npm run dev
npm run test
```

Worker:

```bash
cd worker
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
cd ..
python -m worker
```

## Environment files

Never commit real secrets. Use these examples as templates:

- Root overview: `.env.example`
- Backend: `backend/.env.example`
- Frontend: `frontend/.env.example`
- Worker: `worker/.env.example`

Important variables:

- `DATABASE_URL`: PostgreSQL connection for backend and Prisma.
- `REDIS_URL`: Redis connection for backend and worker.
- `JWT_SECRET`: required for auth cookies. Use a random 32+ character value.
- `WORKER_SHARED_SECRET`: required for worker callbacks. Must match backend and worker.
- `BACKEND_URL`: backend URL used by the frontend server.
- `NEXT_PUBLIC_BACKEND_WS_URL`: public WebSocket URL used by the browser.
- `OPENAI_API_KEY` or `GEMINI_API_KEY`: optional AI coaching provider keys.

## CI/CD

GitHub Actions workflow: `.github/workflows/ci.yml`.

It runs on pull requests, pushes to `main` / `master`, tags starting with `v`, and manual dispatch.

Jobs:

- Frontend: `npm ci`, `npm run typecheck`, `npm run build`.
- Backend: starts PostgreSQL + pgvector and Redis, runs Prisma migrations, seeds data, and runs smoke tests.
- Worker: installs Python dependencies and runs FastAPI smoke tests.
- Docker build: validates `docker compose config` and builds backend, frontend, and worker images.
- Publish images: on push events, publishes backend, frontend, and worker images to GitHub Container Registry.

Published image names follow:

```text
ghcr.io/<owner>/<repo>/backend:<git-sha>
ghcr.io/<owner>/<repo>/frontend:<git-sha>
ghcr.io/<owner>/<repo>/worker:<git-sha>
```

`latest` is also pushed on push events.

## Deployment notes

For a real server:

1. Copy `.env.example` to `.env` and replace all local secrets.
2. Set `FRONTEND_ORIGIN` to your public frontend origin.
3. Set `NEXT_PUBLIC_BACKEND_WS_URL` to your public backend WebSocket origin.
4. Put TLS in front of the frontend/backend with a reverse proxy.
5. Use managed PostgreSQL + Redis for production if possible.
6. Do not use the local default passwords from `docker-compose.yml` outside development.

## Security notes

- Keep secrets in environment variables only.
- Auth uses signed httpOnly cookies.
- Request validation is handled with schemas before route logic.
- SQL access should remain parameterized through Prisma or safe raw queries.
- Worker callbacks require `Authorization: Bearer <WORKER_SHARED_SECRET>`.
