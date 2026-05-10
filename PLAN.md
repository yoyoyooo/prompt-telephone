# MVP Plan

## Product Shape

The first version is intentionally narrow:

- no auth
- no timers
- no multiplayer permissions model
- no live sockets
- no voting yet

The MVP only needs to prove the serving loop:

- prompt submission
- async image generation
- persisted game state
- caption submission
- reveal chain

## Architecture

### Web App

Responsibilities:

- create games
- render game state
- accept captions
- poll for updates
- reveal completed chains

### Database

Use SQLite for local-first development.

Tables/models:

- `Game`
- `Round`
- `Job`
- `Vote`

### Worker

One background worker process:

- claims pending jobs
- calls the provider
- saves generated images to local storage
- updates round and game state

### Provider Layer

Start with a fake provider, then swap in a real provider.

Provider contract:

- `generateImage(prompt) -> { mimeType, bytes }`

The app should not know or care whether the provider is fake, OpenAI, or something else.

## Repository Layout

```text
prompt-telephone/
  app/
  app/api/games/route.ts
  app/api/games/[id]/route.ts
  app/api/games/[id]/captions/route.ts
  app/games/[id]/page.tsx
  lib/
    db.ts
    game-service.ts
    job-service.ts
    storage.ts
    providers/
      types.ts
      fake.ts
      openai.ts
    worker/
      run.ts
  prisma/
    schema.prisma
  storage/
  README.md
  PLAN.md
```

## Prisma Models

### Enums

- `GameStatus`
  - `WAITING_FOR_IMAGE`
  - `WAITING_FOR_CAPTION`
  - `REVEALED`
  - `FAILED`

- `RoundStatus`
  - `PENDING_IMAGE`
  - `READY_FOR_CAPTION`
  - `COMPLETED`
  - `FAILED`

- `RoundKind`
  - `PROMPT`
  - `CAPTION`

- `JobType`
  - `GENERATE_IMAGE`

- `JobStatus`
  - `PENDING`
  - `RUNNING`
  - `SUCCEEDED`
  - `FAILED`

### Models

#### `Game`

- `id`
- `status`
- `roundCount`
- `currentRound`
- `createdAt`
- `updatedAt`

#### `Round`

- `id`
- `gameId`
- `index`
- `kind`
- `status`
- `inputText`
- `imagePath`
- `submittedBy`
- `createdAt`
- `updatedAt`

Constraint:

- unique on `gameId + index`

#### `Job`

- `id`
- `gameId`
- `roundId`
- `type`
- `status`
- `payload`
- `result`
- `error`
- `attempts`
- `createdAt`
- `startedAt`
- `finishedAt`

#### `Vote`

Can wait until after core gameplay.

## API Contracts

### `POST /api/games`

Request:

```json
{
  "startingPrompt": "A raccoon DJing on a rooftop at sunset",
  "roundCount": 5
}
```

Behavior:

- create game
- create first prompt round
- enqueue image-generation job

### `GET /api/games/:id`

Behavior:

- return a normalized game view
- include rounds and next action

### `POST /api/games/:id/captions`

Request:

```json
{
  "caption": "A masked raccoon performs as a DJ above a city skyline"
}
```

Behavior:

- validate game is waiting for a caption
- create next round
- enqueue next image-generation job

## Service Layer

### `lib/game-service.ts`

Implement:

- `createGame`
- `getGameState`
- `submitCaption`
- `toGameView`

### `lib/job-service.ts`

Implement:

- `enqueueGenerateImageJob`
- `claimNextJob`
- `completeImageJob`
- `failJob`
- `advanceGameAfterImage`

## Worker Flow

Loop:

1. Claim one pending job.
2. Mark it `RUNNING`.
3. Call the image provider.
4. Save bytes to `storage/games/<gameId>/round-<index>.<ext>`.
5. Mark the job `SUCCEEDED`.
6. Update the round and game state.

If the provider fails:

- increment attempts
- either requeue or mark failed

For the first version:

- one worker
- one job at a time
- no fancy concurrency

## State Transitions

### Game Creation

- `Game.status = WAITING_FOR_IMAGE`
- first `Round.kind = PROMPT`
- first `Round.status = PENDING_IMAGE`
- create image job

### Image Job Success

If not final round:

- `Round.imagePath = ...`
- `Round.status = READY_FOR_CAPTION`
- `Game.status = WAITING_FOR_CAPTION`

If final round:

- `Round.imagePath = ...`
- `Round.status = COMPLETED`
- `Game.status = REVEALED`

### Caption Submission

- create next `Round.kind = CAPTION`
- `Round.status = PENDING_IMAGE`
- `Game.currentRound += 1`
- `Game.status = WAITING_FOR_IMAGE`
- create image job

## Implementation Milestones

### Milestone 1

Scaffold app and database:

- Next.js app
- Prisma setup
- SQLite file
- schema migration

### Milestone 2

Core game and job services:

- `createGame`
- `getGameState`
- `enqueueGenerateImageJob`

### Milestone 3

Fake provider and worker:

- placeholder image generation
- storage helper
- worker loop

### Milestone 4

Playable first round:

- create game page
- game status page
- polling
- display generated image

### Milestone 5

Caption chaining:

- submit caption
- enqueue next round
- repeat until final reveal

### Milestone 6

Real provider:

- OpenAI image generation provider
- env-based provider selection
- basic retry and error handling

## Manual Verification Checklist

- creating a game inserts one game, one round, one job
- worker claims the pending job
- worker saves an image file under `storage/`
- game transitions to `WAITING_FOR_CAPTION`
- caption submission creates a second round and second job
- final round transitions the game to `REVEALED`

## After MVP

Only after the core loop is stable:

- voting
- session-based player identity
- timers
- reveal polish
- provider fallback
- better job retry logic
- Redis-backed queue if needed
