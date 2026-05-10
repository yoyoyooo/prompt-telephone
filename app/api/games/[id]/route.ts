import { NextResponse } from "next/server";

import { getGameState } from "@/lib/game-service";
import { ServiceError } from "@/lib/service-error";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const game = await getGameState(id);

    return NextResponse.json(game);
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    throw error;
  }
}
