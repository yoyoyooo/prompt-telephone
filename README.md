# Prompt Telephone

Prompt Telephone is a multiplayer AI telephone game.

One player writes a prompt, the system turns it into an image, the next player sees only that image and writes a caption, and the loop repeats for a fixed number of rounds. By the end, the original idea has usually drifted into something weirder, and the final reveal shows the full chain:

`prompt -> image -> caption -> image -> ... -> final image`

The point of the game is the reveal. The image drift is the fun part.

## Why this is interesting

Prompt Telephone works well as a game because every round hides information:

- the first player only sees the prompt they wrote
- the next player only sees the generated image
- later players only see the most recent image
- nobody sees the full chain until the reveal

That makes the ending the payoff. Sometimes the chain stays close to the original idea. Usually it mutates.

## Current status

Working now:

- create a game with a starting prompt
- enqueue image generation as a background job
- process jobs in a separate worker
- store generated images locally
- submit the next caption
- repeat the prompt -> image -> caption loop
- switch between a fake local provider and an OpenAI provider

Not built yet:

- voting
- auth / player identity
- multiplayer permissions
- timers
- live updates with websockets or SSE
- stronger retry policies and provider fallback

## Tech stack

- Next.js
- TypeScript
- Prisma
- SQLite
- local filesystem storage
- separate worker process
- pluggable image provider interface

## Running locally

### 1. Install dependencies

```bash
npm install
```

### 2. Copy the environment template

```bash
cp .env.example .env
```

### 3. Generate the Prisma client

```bash
npm run prisma:generate
```

### 4. Apply the local migration

```bash
npm run prisma:migrate -- --name init
```

### 5. Start the web app

```bash
npm run dev
```

### 6. Start the worker in a second terminal

```bash
npm run worker
```

Then open:

```text
http://localhost:3000
```

## Provider options

### Fake provider

Default:

```env
IMAGE_PROVIDER="fake"
```

This generates a local SVG placeholder image and is the easiest way to test the game flow without paying for model calls.

### OpenAI provider

Set:

```env
IMAGE_PROVIDER="openai"
OPENAI_API_KEY="your_api_key"
OPENAI_IMAGE_MODEL="gpt-image-2"
OPENAI_IMAGE_SIZE="1024x1024"
```

Notes:

- API billing is separate from ChatGPT subscriptions.
- If billing limits are reached, jobs will fail and the game will transition to `FAILED`.
- Supported image sizes are currently:
  - `auto`
  - `1024x1024`
  - `1024x1536`
  - `1536x1024`

## How the app is built

The app has four main pieces:

1. Web app
   Handles page rendering, create-game requests, caption submission, and polling for updated game state.

2. Database
   Stores `Game`, `Round`, `Job`, and later `Vote` records.

3. Worker
   Polls pending jobs, calls the configured image provider, stores output files, and updates state transitions.

4. Provider layer
   Hides whether image generation comes from a fake local provider or a hosted API provider.

At a high level, the project flows like this:

`request -> DB state -> queued job -> worker -> provider -> stored result -> updated UI state`

## Why this repo also exists

This repo is also a serving-architecture practice project.

It is intentionally built around:

- async job execution
- web app / worker separation
- provider abstraction
- persisted job and game state
- polling-based status updates
- failure handling when model providers fail

So while the top-level product is a game, the implementation is meant to be a clean example of an app that orchestrates model calls through its own backend layer instead of calling a provider directly from the browser.

## Project scripts

```bash
npm run dev
npm run build
npm run start
npm run worker
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Repository layout

```text
app/
  api/
  games/
lib/
  providers/
  worker/
prisma/
storage/
```

Key files:

- `app/api/games/route.ts`
- `app/api/games/[id]/route.ts`
- `app/api/games/[id]/captions/route.ts`
- `lib/game-service.ts`
- `lib/job-service.ts`
- `lib/worker/run.ts`
- `lib/providers/fake.ts`
- `lib/providers/openai.ts`
- `prisma/schema.prisma`

## Limitations

- the queue is currently DB-backed and single-worker oriented
- image storage is local filesystem only
- there is no auth or abuse protection
- there is no provider fallback yet
- reveal UX is still basic

## Roadmap

Short-term:

- better reveal presentation
- voting
- better failure messaging in the UI
- basic player identity/session handling

Medium-term:

- better worker retry logic
- Redis-backed queue
- provider health checks
- optional automated caption mode for solo play

## Notes

The detailed implementation plan is in [PLAN.md](./PLAN.md).
