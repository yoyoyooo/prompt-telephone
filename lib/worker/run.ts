import { JobType } from "@prisma/client";

import { claimNextJob, completeImageJob, failJob } from "@/lib/job-service";
import { fakeProvider } from "@/lib/providers/fake";
import { openAiProvider } from "@/lib/providers/openai";
import { saveRoundImage } from "@/lib/storage";

const IDLE_POLL_MS = 1500;

function getImageProvider() {
  return process.env.IMAGE_PROVIDER === "openai" ? openAiProvider : fakeProvider;
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function processGenerateImageJob(job: Awaited<ReturnType<typeof claimNextJob>>) {
  if (!job) {
    return;
  }

  const payload = JSON.parse(job.payload) as { prompt: string };
  const provider = getImageProvider();
  const generatedImage = await provider.generateImage(payload.prompt);
  const savedImage = await saveRoundImage({
    gameId: job.gameId,
    roundIndex: job.round.index,
    bytes: generatedImage.bytes,
    mimeType: generatedImage.mimeType,
  });

  await completeImageJob({
    jobId: job.id,
    imagePath: savedImage.relativePath,
    result: JSON.stringify({
      imagePath: savedImage.relativePath,
      mimeType: generatedImage.mimeType,
    }),
  });
}

async function runWorkerLoop() {
  for (;;) {
    const job = await claimNextJob();

    if (!job) {
      await sleep(IDLE_POLL_MS);
      continue;
    }

    try {
      switch (job.type) {
        case JobType.GENERATE_IMAGE:
          await processGenerateImageJob(job);
          break;
        default:
          throw new Error(`Unsupported job type: ${job.type}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown worker error";
      await failJob({
        jobId: job.id,
        error: message,
      });
    }
  }
}

void runWorkerLoop();
