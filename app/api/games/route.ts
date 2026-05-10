import { NextResponse } from "next/server";
import { z } from "zod";

import { createGame } from "@/lib/game-service";
import { ServiceError } from "@/lib/service-error";

const createGameSchema = z.object({
  startingPrompt: z.string().min(1),
  roundCount: z.number().int().min(1).max(12),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = createGameSchema.parse(body);
    const game = await createGame(input);

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    throw error;
  }
}
