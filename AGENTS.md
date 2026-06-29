# Repository Guidelines

## Project Structure & Module Organization

Sime is an AI vocal training platform split into independent areas:

- `landing/`: static marketing site. Source is `index.html`, `css/styles.css`, and `js/main.js`.
- `frontend/`: Next.js App Router product app. Pages live in `app/`, shared UI in `components/`, shared helpers in `lib/`.
- `backend/`: Express + TypeScript API. Source lives in `src/`, with routes in `src/routes/`, middleware in `src/middleware/`, config in `src/config/`, and lesson data in `src/data/`.
- `PLANS.md`: architecture plan for realtime audio, AI workers, PostgreSQL/pgvector, and Gemini coaching.

There is no test directory yet. Add tests near covered code or under a future `tests/` folder per package.

## Build, Test, and Development Commands

- `cd landing && python -m http.server 5173`: preview the static landing page.
- `cd frontend && npm run dev`: run the Next.js app locally.
- `cd frontend && npm run build`: build the frontend.
- `cd frontend && npm run typecheck`: run TypeScript checks.
- `cd backend && npm run dev`: run the Express API with `tsx watch`.
- `cd backend && npm run build`: compile backend TypeScript to `dist/`.
- `cd backend && npm run typecheck`: run backend TypeScript checks.

Run commands from the relevant package directory.

## Coding Style & Naming Conventions

Use TypeScript for app and API code. Prefer small named exports, functional React components, and server components by default in Next.js. Use `'use client'` only for interactive leaves such as mic capture, canvas, or browser APIs.

For `landing/`, preserve the existing dark theme, Sora font, Phosphor icons, and single amber accent `#FFB84D`.

## Testing Guidelines

No test framework is configured yet. When adding tests, include both success and failure paths for API validation, auth, and audio-analysis contracts. Name tests by behavior, for example `rejects-invalid-lesson-id` or `requires-auth-for-progress`.

Always run package typechecks and builds before handoff.

## Commit & Pull Request Guidelines

This checkout has no Git history. Use clear Conventional Commit-style messages, for example `feat: add practice range test` or `fix: validate progress payload`.

Pull requests should include scope, rationale, screenshots for UI changes, commands run, and any security-sensitive behavior changed.

## Security & Configuration Tips

Never hardcode secrets. Validate all request bodies, params, and queries with schemas. Use parameterized SQL only. Avoid `innerHTML`, unsafe `dangerouslySetInnerHTML`, inline scripts, and user-input reflection. Keep auth tokens in httpOnly cookies and check authorization on protected routes.
