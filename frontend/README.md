# Sime Frontend

Next.js App Router product app for Sime. The app provides lessons, browser pitch practice, account auth, progress tracking, studio job polling, and API reference pages.

## Structure

- `app/`: App Router pages and same-origin API route handlers.
- `components/`: Shared UI and interactive client components.
- `lib/api.ts`: Server-side backend client for Server Components.
- `lib/backendProxy.ts`: Route-handler proxy for browser calls that need backend cookies.
- `lib/site.ts`: Navigation and site metadata.

## Commands

- `npm run dev`: start the local Next.js dev server.
- `npm run build`: create the production build.
- `npm run start`: serve the production build.
- `npm run typecheck`: run TypeScript checks.
- `npm run lint`: compatibility alias for TypeScript checks.

## Backend Linkage

Server Components call the Express API through `BACKEND_URL`, defaulting to `http://localhost:4000`. Browser mutations use same-origin routes under `app/api/**`, which forward cookies to the backend:

- `/api/auth/*` -> `/api/auth/*`
- `/api/progress` -> `/api/progress`
- `/api/voice-profiles/latest` -> `/api/voice-profiles/latest`
- `/api/analysis/jobs*` -> `/api/analysis/jobs*`

The practice page uses `NEXT_PUBLIC_BACKEND_WS_URL` for `/ws/live-analysis`.

## Security Notes

Do not put secrets in `NEXT_PUBLIC_*` variables. Auth stays in signed httpOnly backend cookies. Avoid `innerHTML`, unsafe `dangerouslySetInnerHTML`, inline scripts, and direct user-input reflection. Validate dynamic route params before proxying backend paths.
