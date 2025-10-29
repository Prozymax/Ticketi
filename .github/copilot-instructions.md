## Quick orientation for AI coding agents

This repo (Ticketi) is a full-stack Next.js + Express application. Keep instructions concise and act on concrete, discoverable patterns only.

- Architecture: client/ (Next.js 15 app-router, React 19) and server/ (Express, Sequelize, MySQL). Frontend is in `client/app` (app router pages like `client/app/events/[detail]/page.tsx`). Backend entry: `server/server.js` (calls `server/config/app.config.js`).

- Run & debug: use root scripts. To run both dev servers concurrently: `npm run dev` (root) — this runs `client` and `server` scripts. To run parts individually:

  - Client dev: `cd client && npm run dev` (Next dev with --turbopack)
  - Server dev: `cd server && npm run dev` (nodemon server.js)
  - Build client: `npm run build` from repo root (runs client build)

- Install: `npm run install:client` and `npm run install:server` exist; `install:all` appears to reference `yarn` (likely a mistake). Prefer running the two install scripts explicitly.

- Important files and patterns to reference when making changes:

  - Auth and cookies: `COOKIE_AUTH_IMPLEMENTATION.md` and `COOKIE_AUTH_SETUP.md` (root) describe secure HTTP-only encrypted cookies. Backend utilities: `server/utils/crypto.js`, `server/utils/cookieService.js`. Auth middleware: `server/middleware/auth.middleware.js` (checks cookies then Authorization header).
  - CORS and server config: `server/config/cors.config.js` and `server/config/app.config.js` (startup, middleware, static assets). Note: `app.config.js` sets default port to `process.env.PORT || 3000` and `environment.config.js` defines a server port default of 3240 — confirm which PORT is used in your environment.
  - Environment: `server/config/environment.config.js` validates required env vars. Typical required keys: ENCRYPTION_SECRET, DEV_DB, DEV_USER, DEV_PASSWORD, DEV_HOST. Also references JWT_SECRET, ENCRYPTION_KEY, mail and payment keys.
  - DB and models: `server/models/*` (Sequelize). DB init occurs in `server/config/db.config.js` and is invoked during app.init.
  - Routes and controllers: `server/routes/*` and `server/controllers/*` — standard express router → controller pattern.
  - Background: `server/services/event.scheduler.js` initialized at startup (cron jobs / scheduler).

- Client conventions:

  - Uses Next.js app router under `client/app`. Components live under `client/app/components` and `client/app/utils`.
  - API requests in client should include cookies: the codebase expects `credentials: 'include'` (see `client/app/lib/api.ts`). When changing fetch/Axios defaults, preserve cookie inclusion for auth flows.

- Concrete examples of where to change things:

  - To inspect auth flow: follow `client/app/utils/cookieAuth.ts` → `client/app/lib/api.ts` → `server/middleware/auth.middleware.js` → `server/utils/cookieService.js`.
  - To add an API route: add route under `server/routes/*`, implement controller under `server/controllers/*`, and add model changes in `server/models/*` with a migration-like manual sync (see `server/config/db.config.js`).

- Developer gotchas & guidance for edits:

  - Environment validation: server startup will throw if required env vars are missing; prefer running with a `.env` that supplies the keys required by `server/config/environment.config.js`.
  - Cookie auth debugging: app.config enables extra request logs in development for `/auth` and `/login` (it logs Cookies / Origin / User-Agent). Set NODE_ENV=development when debugging auth.
  - CORS must allow credentials: server CORS config is intentionally centralised in `server/config/cors.config.js`. If you change CORS, verify cookies+credentials continue to work from the Next client origin.
  - Logging and monitoring: server uses `morgan` and `server/utils/logger` plus `winston` in dependencies. Follow existing logger usage for consistent output.

- When creating tests or running builds, prefer using the existing script names. Do not change the Next major flags (the project uses `--turbopack`).

- If any of the environment assumptions are incorrect, or you'd like me to include extra examples (e.g., a sample `.env` with placeholders or common API endpoint examples), tell me which area to expand and I'll update the document.

Key quick references:

- Start both: `npm run dev` (root)
- Client dev: `cd client && npm run dev`
- Server dev: `cd server && npm run dev`
- Build client: `npm run build` (root)
- Env file: see `server/config/environment.config.js` for required keys
- Auth flow: `client/app/lib/api.ts` -> `client/app/utils/cookieAuth.ts` -> `server/middleware/auth.middleware.js` -> `server/utils/cookieService.js`
