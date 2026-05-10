import {
  GameStatus,
  JobStatus,
  JobType,
  RoundStatus,
  type Prisma,
} from "@prisma/client";

import { db } from "@/lib/db";

type DbClient = Prisma.TransactionClient | typeof db;

type EnqueueGenerateImageJobInput = {
  gameId: string;
  roundId: string;
  prompt: string;
};

export async function enqueueGenerateImageJob(
  input: EnqueueGenerateImageJobInput,
  client: DbClient = db,
) {
  return client.job.create({
    data: {
      gameId: input.gameId,
      roundId: input.roundId,
      type: JobType.GENERATE_IMAGE,
      status: JobStatus.PENDING,
      payload: JSON.stringify({
        prompt: input.prompt,
      }),
    },
  });
}

export async function claimNextJob() {
  const nextPendingJob = await db.job.findFirst({
    where: {
      status: JobStatus.PENDING,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!nextPendingJob) {
    return null;
  }

  await db.job.update({
    where: {
      id: nextPendingJob.id,
    },
    data: {
      status: JobStatus.RUNNING,
      startedAt: new Date(),
      attempts: {
        increment: 1,
      },
    },
  });

  return db.job.findUniqueOrThrow({
    where: {
      id: nextPendingJob.id,
    },
    include: {
      round: true,
    },
  });
}

type CompleteImageJobInput = {
  jobId: string;
  imagePath: string;
  result?: string;
};

export async function completeImageJob(input: CompleteImageJobInput) {
  return db.$transaction(async (tx) => {
    const job = await tx.job.findUniqueOrThrow({
      where: {
        id: input.jobId,
      },
      include: {
        round: true,
        game: true,
      },
    });

    const isFinalRound = job.round.index >= job.game.roundCount - 1;
    const nextRoundStatus = isFinalRound ? RoundStatus.COMPLETED : RoundStatus.READY_FOR_CAPTION;
    const nextGameStatus = isFinalRound
      ? GameStatus.REVEALED
      : GameStatus.WAITING_FOR_CAPTION;

    await tx.job.update({
      where: {
        id: job.id,
      },
      data: {
        status: JobStatus.SUCCEEDED,
        result: input.result ?? input.imagePath,
        error: null,
        finishedAt: new Date(),
      },
    });

    await tx.round.update({
      where: {
        id: job.roundId,
      },
      data: {
        imagePath: input.imagePath,
        status: nextRoundStatus,
      },
    });

    await tx.game.update({
      where: {
        id: job.gameId,
      },
      data: {
        status: nextGameStatus,
      },
    });

    return job;
  });
}

type FailJobInput = {
  jobId: string;
  error: string;
};

export async function failJob(input: FailJobInput) {
  return db.$transaction(async (tx) => {
    const job = await tx.job.findUniqueOrThrow({
      where: {
        id: input.jobId,
      },
    });

    await tx.job.update({
      where: {
        id: job.id,
      },
      data: {
        status: JobStatus.FAILED,
        error: input.error,
        finishedAt: new Date(),
      },
    });

    await tx.round.update({
      where: {
        id: job.roundId,
      },
      data: {
        status: RoundStatus.FAILED,
      },
    });

    await tx.game.update({
      where: {
        id: job.gameId,
      },
      data: {
        status: GameStatus.FAILED,
      },
    });

    return job;
  });
}
