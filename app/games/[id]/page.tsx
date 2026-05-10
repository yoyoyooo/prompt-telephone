import { notFound } from "next/navigation";

import { GameClient } from "@/app/games/[id]/game-client";
import { getGameState } from "@/lib/game-service";
import { ServiceError } from "@/lib/service-error";

type GamePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;
  let game;

  try {
    game = await getGameState(id);
  } catch (error) {
    if (error instanceof ServiceError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
      <GameClient initialGame={game} />
    </main>
  );
}
