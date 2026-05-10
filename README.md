# Prompt Telephone

Prompt Telephone is a serving-focused party game:

1. A player writes a starting prompt.
2. The system generates an image.
3. The next player sees only the image and writes a caption.
4. The system generates a new image from that caption.
5. The loop repeats for a fixed number of rounds.
6. The game reveals the full chain at the end.

The product goal is a fun reveal. The engineering goal is to practice:

- async job execution
- queue and worker boundaries
- provider abstraction
- request/state lifecycle design
- failure handling and retries
- local-first development on a laptop

## Planned Stack

- Next.js
- TypeScript
- SQLite
- Prisma
- Local filesystem image storage
- Background worker process
- Provider abstraction with a fake provider first, hosted provider later

## Running Locally

1. Install dependencies: `npm install`
2. Copy envs: `cp .env.example .env`
3. Generate Prisma client: `npm run prisma:generate`
4. Apply local migration: `npm run prisma:migrate -- --name init`
5. Start the app: `npm run dev`
6. Start the worker: `npm run worker`

To use OpenAI image generation instead of the fake SVG provider, set:

- `IMAGE_PROVIDER="openai"`
- `OPENAI_API_KEY="..."`

Optional:

- `OPENAI_IMAGE_MODEL="gpt-image-2"`
- `OPENAI_IMAGE_SIZE="1024x1024"`

## MVP Sequence

1. Create a game with a starting prompt.
2. Enqueue an image-generation job.
3. Worker claims the job and writes an image result.
4. Game page polls until the image is ready.
5. Player submits the next caption.
6. Repeat until reveal.

Implementation detail lives in [PLAN.md](./PLAN.md).
