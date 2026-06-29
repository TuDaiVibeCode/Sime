# Sime

Sime is an AI vocal training platform for students who want structured voice coaching: curriculum lessons, live pitch practice, range mapping, voice profiles, AI guidance, and worker-backed acoustic analysis.

- Vietnamese README: [README.vi.md](README.vi.md)
- English README: [README.en.md](README.en.md)

## Fast Start With Docker

Prerequisites: Docker Desktop or Docker Engine with Docker Compose.

```bash
cp .env.example .env
# edit secrets before real deployment

docker compose up --build
```

Local URLs:

- Frontend: http://localhost:3000
- Backend health: http://localhost:4000/health
- Worker API health: http://localhost:8000/health
- PostgreSQL: localhost:5432
- Redis: localhost:6379

The Compose stack runs PostgreSQL with pgvector, Redis, the Express backend, the Next.js frontend, the Redis worker, and the FastAPI worker API. Backend migrations and seed data run automatically when the backend container starts.

## Documentation

Use the language-specific README files for setup, architecture, environment variables, CI/CD, and deployment notes.
