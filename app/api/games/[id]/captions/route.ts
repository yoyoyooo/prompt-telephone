import { NextResponse } from "next/server";
import { z } from "zod";

import { submitCaption } from "@/lib/game-service";
import { ServiceError } from "@/lib/service-error";

const submitCaptionSchema = z.object({
  caption: z.string().min(1),
  submittedBy: z.string().min(1).optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const input = submitCaptionSchema.parse(body);
    const game = await submitCaption({
      gameId: id,
      ...input,
    });

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
