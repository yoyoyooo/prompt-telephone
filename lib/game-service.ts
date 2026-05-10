import {
  GameStatus,
  RoundKind,
  RoundStatus,
  type Game,
  type Round,
} from "@prisma/client";

import { db } from "@/lib/db";
import { enqueueGenerateImageJob } from "@/lib/job-service";
import { ServiceError } from "@/lib/service-error";

type CreateGameInput = {
  startingPrompt: string;
  roundCount: number;
};

type SubmitCaptionInput = {
  gameId: string;
  caption: string;
  submittedBy?: string;
};

type GameWithRounds = Game & {
  rounds: Round[];
};

type GameAction =
  | {
      type: "WAIT_FOR_IMAGE";
      roundIndex: number;
    }
  | {
      type: "SUBMIT_CAPTION";
      roundIndex: number;
    }
  | {
      type: "VIEW_REVEAL";
    };

export type GameView = {
  id: string;
  status: GameStatus;
  roundCount: number;
  currentRound: number;
  rounds: Array<{
    id: string;
    index: number;
    kind: RoundKind;
    status: RoundStatus;
    inputText: string;
    imageUrl: string | null;
  }>;
  nextAction: GameAction;
};

function getNextAction(game: GameWithRounds): GameAction {
  if (game.status === GameStatus.WAITING_FOR_IMAGE) {
    return {
      type: "WAIT_FOR_IMAGE",
      roundIndex: game.currentRound,
    };
  }

  if (game.status === GameStatus.WAITING_FOR_CAPTION) {
    return {
      type: "SUBMIT_CAPTION",
      roundIndex: game.currentRound + 1,
    };
  }

  return {
    type: "VIEW_REVEAL",
  };
}

export function toGameView(game: GameWithRounds): GameView {
  return {
    id: game.id,
    status: game.status,
    roundCount: game.roundCount,
    currentRound: game.currentRound,
    rounds: game.rounds
      .sort((left, right) => left.index - right.index)
      .map((round) => ({
        id: round.id,
        index: round.index,
        kind: round.kind,
        status: round.status,
        inputText: round.inputText,
        imageUrl: round.imagePath ? `/api/files/${round.imagePath}` : null,
      })),
    nextAction: getNextAction(game),
  };
}

export async function createGame(input: CreateGameInput) {
  const startingPrompt = input.startingPrompt.trim();

  if (startingPrompt.length === 0) {
    throw new ServiceError("Starting prompt cannot be empty.", 400);
  }

  if (!Number.isInteger(input.roundCount) || input.roundCount < 1) {
    throw new ServiceError("Round count must be a positive integer.", 400);
  }

  const game = await db.$transaction(async (tx) => {
    const createdGame = await tx.game.create({
      data: {
        status: GameStatus.WAITING_FOR_IMAGE,
        roundCount: input.roundCount,
        currentRound: 0,
      },
    });

    const firstRound = await tx.round.create({
      data: {
        gameId: createdGame.id,
        index: 0,
        kind: RoundKind.PROMPT,
        status: RoundStatus.PENDING_IMAGE,
        inputText: startingPrompt,
      },
    });

    await enqueueGenerateImageJob(
      {
        gameId: createdGame.id,
        roundId: firstRound.id,
        prompt: firstRound.inputText,
      },
      tx,
    );

    return tx.game.findUniqueOrThrow({
      where: {
        id: createdGame.id,
      },
      include: {
        rounds: {
          orderBy: {
            index: "asc",
          },
        },
      },
    });
  });

  return toGameView(game);
}

export async function getGameState(gameId: string) {
  const game = await db.game.findUnique({
    where: {
      id: gameId,
    },
    include: {
      rounds: {
        orderBy: {
          index: "asc",
        },
      },
    },
  });

  if (!game) {
    throw new ServiceError("Game not found.", 404);
  }

  return toGameView(game);
}

export async function submitCaption(input: SubmitCaptionInput) {
  const caption = input.caption.trim();

  if (caption.length === 0) {
    throw new ServiceError("Caption cannot be empty.", 400);
  }

  const game = await db.$transaction(async (tx) => {
    const existingGame = await tx.game.findUnique({
      where: {
        id: input.gameId,
      },
      include: {
        rounds: {
          orderBy: {
            index: "asc",
          },
        },
      },
    });

    if (!existingGame) {
      throw new ServiceError("Game not found.", 404);
    }

    if (existingGame.status !== GameStatus.WAITING_FOR_CAPTION) {
      throw new ServiceError("Game is not ready for a caption.", 409);
    }

    const nextRoundIndex = existingGame.currentRound + 1;

    if (nextRoundIndex >= existingGame.roundCount) {
      throw new ServiceError("Game already has all planned rounds.", 409);
    }

    await tx.round.create({
      data: {
        gameId: existingGame.id,
        index: nextRoundIndex,
        kind: RoundKind.CAPTION,
        status: RoundStatus.PENDING_IMAGE,
        inputText: caption,
        submittedBy: input.submittedBy,
      },
    });

    await tx.game.update({
      where: {
        id: existingGame.id,
      },
      data: {
        currentRound: nextRoundIndex,
        status: GameStatus.WAITING_FOR_IMAGE,
      },
    });

    const createdRound = await tx.round.findUniqueOrThrow({
      where: {
        gameId_index: {
          gameId: existingGame.id,
          index: nextRoundIndex,
        },
      },
    });

    await enqueueGenerateImageJob(
      {
        gameId: existingGame.id,
        roundId: createdRound.id,
        prompt: createdRound.inputText,
      },
      tx,
    );

    return tx.game.findUniqueOrThrow({
      where: {
        id: existingGame.id,
      },
      include: {
        rounds: {
          orderBy: {
            index: "asc",
          },
        },
      },
    });
  });

  return toGameView(game);
}
