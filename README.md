# Murder Mystery Game

Next.js app for the murder mystery game UI, backed by Convex and Better Auth.

The current app includes:

- A simple auth landing page at `/`
- Username or email login
- Username + email + password signup
- A protected placeholder dashboard at `/dashboard`
- Convex-backed auth and user storage via Better Auth

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Convex
- Better Auth
- Biome
- Bun for local package management

## Prerequisites

- Bun
- Node.js 20+
- A Convex account with access to the project deployment

## First-Time Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Create local app env vars

Copy [\.env.local.example](/Users/anthonyliang/Developer/murder-mystery-game/.env.local.example) to `.env.local`.

Your `.env.local` should contain:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
```

These are used by the Next app only.

### 3. Link the repo to Convex

Run:

```bash
npx convex dev
```

If this is your first time on the repo, Convex will prompt you to sign in and connect to the correct deployment. This step also generates the `convex/_generated/*` files used by the app.

### 4. Set backend auth env vars in Convex

Run these once against the linked deployment:

```bash
npx convex env set SITE_URL http://localhost:3000
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
```

Notes:

- `SITE_URL` should match the browser origin you use locally.
- `BETTER_AUTH_SECRET` is only needed in Convex backend env, not in `.env.local`.

### 5. Start local development

Use two terminals.

Terminal 1:

```bash
npx convex dev
```

Terminal 2:

```bash
bun dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Local Auth Flow

- New users sign up with `username`, `email`, and `password`
- Existing users can log in with either username or email plus password
- Successful auth redirects to `/dashboard`
- Unauthenticated users visiting `/dashboard` are redirected back to `/`

## Project Structure

- [src/app/page.tsx](/Users/anthonyliang/Developer/murder-mystery-game/src/app/page.tsx)
  Auth landing page with redirect logic for signed-in users
- [src/app/dashboard/page.tsx](/Users/anthonyliang/Developer/murder-mystery-game/src/app/dashboard/page.tsx)
  Protected dashboard placeholder
- [src/app/api/auth/[...all]/route.ts](/Users/anthonyliang/Developer/murder-mystery-game/src/app/api/auth/%5B...all%5D/route.ts)
  Next.js auth proxy route
- [src/lib/auth-client.ts](/Users/anthonyliang/Developer/murder-mystery-game/src/lib/auth-client.ts)
  Better Auth client used in the browser
- [src/lib/auth-server.ts](/Users/anthonyliang/Developer/murder-mystery-game/src/lib/auth-server.ts)
  Next.js server helpers for auth-aware Convex access
- [convex/auth.ts](/Users/anthonyliang/Developer/murder-mystery-game/convex/auth.ts)
  Better Auth server configuration for Convex
- [convex/http.ts](/Users/anthonyliang/Developer/murder-mystery-game/convex/http.ts)
  Convex HTTP route registration
- [convex/_generated/](/Users/anthonyliang/Developer/murder-mystery-game/convex/_generated)
  Generated Convex files. Do not edit manually.

## Scripts

```bash
bun dev
bun run build
bun run start
bun run lint
bun run format
```

`bun run lint` runs `biome check`.

## Troubleshooting

### `No CONVEX_DEPLOYMENT set`

The repo is not linked locally yet. Run:

```bash
npx convex dev
```

### Auth requests fail locally

Check these first:

- `.env.local` has the correct `NEXT_PUBLIC_CONVEX_URL`
- `.env.local` has the correct `NEXT_PUBLIC_CONVEX_SITE_URL`
- Convex env has `SITE_URL=http://localhost:3000`
- Convex env has `BETTER_AUTH_SECRET`
- `npx convex dev` is running

### Convex generated files look wrong

Regenerate them by running:

```bash
npx convex dev
```

## Current Notes

- Auth is intentionally simple in v1: no password reset, email verification, or social providers yet.
- The dashboard is a placeholder and currently uses the Better Auth user record as the source of truth.
- The repo contains unrelated proof-of-concept files under `documents/`; Biome may report warnings there even when the main app changes are fine.
