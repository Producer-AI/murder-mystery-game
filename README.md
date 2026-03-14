# Murder Mystery Game

Next.js app for a live murder mystery party game, backed by Convex and Better Auth.

The current app includes:

- Host auth at `/` with username or email login and username + email + password signup
- A protected host dashboard at `/dashboard`
- Game creation with title, description, optional join password, invite link, and QR code
- Round-based game control for hosts
- Guest join flow at `/games/[joinCode]` with username-only entry plus optional password
- Live Convex updates for lobby, active round, and round completion states
- Admin-only leaderboard and scoring
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

- Hosts sign up with `username`, `email`, and `password`
- Existing hosts can log in with either username or email plus password
- Successful auth redirects to `/dashboard`
- Unauthenticated users visiting `/dashboard` or `/dashboard/games/[gameId]` are redirected back to `/`
- Guests do not create accounts and never use the auth screen

## Game Flow

### Host flow

1. Sign in and create a game from `/dashboard`
2. Set the game title, description, and optional join password
3. Create one or more draft rounds
4. Add one or more questions to each draft round
5. Share the join link, join code, or QR code with players
6. Start one round at a time
7. End the round to close submissions and score every question in that round immediately
8. View the private leaderboard from the admin screen at all times
9. End the game when you are done

### Player flow

1. Open `/games/[joinCode]`
2. Enter a username and optional password
3. Wait in the lobby until the host starts a round
4. When a round is live, answer any question in that round in any order
5. Each question can be submitted once; the answer locks immediately
6. Players do not see whether an answer was correct
7. Players never see the leaderboard, even after the game ends

## Scoring Rules

- Each question has a point value, one primary answer, and optional accepted variants
- Matching is exact after normalization of case and spacing
- Hosts score an entire round by ending it
- Unanswered questions are worth `0` points
- The leaderboard is host-only and updates after scored rounds

## Project Structure

- [src/app/page.tsx](/Users/anthonyliang/Developer/murder-mystery-game/src/app/page.tsx)
  Host auth landing page with redirect logic for signed-in users
- [src/app/dashboard/page.tsx](/Users/anthonyliang/Developer/murder-mystery-game/src/app/dashboard/page.tsx)
  Protected host dashboard
- [src/app/dashboard/games/[gameId]/page.tsx](/Users/anthonyliang/Developer/murder-mystery-game/src/app/dashboard/games/[gameId]/page.tsx)
  Protected admin control room for a single game
- [src/app/games/[joinCode]/page.tsx](/Users/anthonyliang/Developer/murder-mystery-game/src/app/games/[joinCode]/page.tsx)
  Public guest join and play route
- [src/app/api/auth/[...all]/route.ts](/Users/anthonyliang/Developer/murder-mystery-game/src/app/api/auth/%5B...all%5D/route.ts)
  Next.js auth proxy route
- [src/lib/auth-client.ts](/Users/anthonyliang/Developer/murder-mystery-game/src/lib/auth-client.ts)
  Better Auth client used in the browser
- [src/lib/auth-server.ts](/Users/anthonyliang/Developer/murder-mystery-game/src/lib/auth-server.ts)
  Next.js server helpers for auth-aware Convex access
- [src/lib/guest-session.ts](/Users/anthonyliang/Developer/murder-mystery-game/src/lib/guest-session.ts)
  Local guest token persistence for same-device rejoin
- [src/components/dashboard/admin-game-page.tsx](/Users/anthonyliang/Developer/murder-mystery-game/src/components/dashboard/admin-game-page.tsx)
  Host UI for rounds, questions, invite tools, and private standings
- [src/components/game/public-game-page.tsx](/Users/anthonyliang/Developer/murder-mystery-game/src/components/game/public-game-page.tsx)
  Guest UI for join, lobby, active rounds, and completion states
- [convex/auth.ts](/Users/anthonyliang/Developer/murder-mystery-game/convex/auth.ts)
  Better Auth server configuration for Convex
- [convex/games.ts](/Users/anthonyliang/Developer/murder-mystery-game/convex/games.ts)
  Game, round, player, submission, and scoring queries/mutations
- [convex/schema.ts](/Users/anthonyliang/Developer/murder-mystery-game/convex/schema.ts)
  Convex schema for games, rounds, questions, players, and submissions
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

Or, if the project is already linked and you only need updated bindings:

```bash
npx convex codegen
```

## Current Notes

- Auth is intentionally simple in v1: no password reset, email verification, or social providers yet.
- Hosts are the only admins in v1.
- Guests join with a username only; no guest accounts are created.
- Only one round can be live at a time.
- Draft rounds and their questions are editable until the round starts.
- The repo contains unrelated proof-of-concept files under `documents/`; Biome may report warnings there even when the main app changes are fine.
- Recent schema changes added `rounds` and replaced the old single-live-question flow. If you are working against stale local data from older iterations, refresh the local deployment state before testing.
