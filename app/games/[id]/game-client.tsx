"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";

import type { GameView } from "@/lib/game-service";

type GameClientProps = {
  initialGame: GameView;
};

export function GameClient({ initialGame }: GameClientProps) {
  const [game, setGame] = useState(initialGame);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setGame(initialGame);
  }, [initialGame]);

  useEffect(() => {
    if (game.nextAction.type !== "WAIT_FOR_IMAGE") {
      return;
    }

    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/games/${game.id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const nextGame = (await response.json()) as GameView;
      setGame(nextGame);
    }, 2000);

    return () => window.clearInterval(interval);
  }, [game.id, game.nextAction.type]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch(`/api/games/${game.id}/captions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        caption,
      }),
    });

    const payload = (await response.json()) as GameView & { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Failed to submit caption.");
      return;
    }

    startTransition(() => {
      setGame(payload);
      setCaption("");
    });
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 24,
        padding: 32,
        boxShadow: "0 24px 80px rgba(36, 26, 16, 0.08)",
      }}
    >
      <p
        style={{
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--accent)",
          fontSize: 12,
        }}
      >
        Game State
      </p>
      <h1 style={{ margin: "12px 0" }}>Game {game.id}</h1>
      <p style={{ margin: 0, color: "var(--muted)" }}>
        Status: {game.status}. Current round: {game.currentRound + 1} / {game.roundCount}
      </p>

      <section style={{ marginTop: 32 }}>
        <h2>Rounds</h2>
        <div style={{ display: "grid", gap: 16 }}>
          {game.rounds.map((round) => (
            <article
              key={round.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 18,
                padding: 18,
                background: "rgba(255, 255, 255, 0.58)",
              }}
            >
              <p style={{ margin: 0, color: "var(--muted)" }}>
                Round {round.index + 1} · {round.kind} · {round.status}
              </p>
              <p style={{ marginBottom: 0 }}>{round.inputText}</p>
              {round.imageUrl ? (
                <div style={{ marginTop: 16 }}>
                  <Image
                    src={round.imageUrl}
                    alt={`Round ${round.index + 1} generated image`}
                    width={540}
                    height={405}
                    unoptimized
                    style={{
                      width: "100%",
                      height: "auto",
                      borderRadius: 16,
                      border: "1px solid var(--border)",
                      background: "#fff",
                    }}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Next action</h2>
        {game.nextAction.type === "WAIT_FOR_IMAGE" ? (
          <p style={{ color: "var(--muted)" }}>
            Waiting for the worker to finish round {game.nextAction.roundIndex + 1}. This
            page polls automatically.
          </p>
        ) : null}
        {game.nextAction.type === "SUBMIT_CAPTION" ? (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span>Caption for round {game.nextAction.roundIndex + 1}</span>
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                rows={4}
                placeholder="Describe only what you see in the image."
                style={{
                  width: "100%",
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  padding: 16,
                  background: "rgba(255, 255, 255, 0.68)",
                }}
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              style={{
                width: "fit-content",
                borderRadius: 999,
                border: "none",
                background: "var(--accent)",
                color: "white",
                padding: "12px 18px",
                cursor: "pointer",
              }}
            >
              {isPending ? "Submitting..." : "Submit caption"}
            </button>
          </form>
        ) : null}
        {game.nextAction.type === "VIEW_REVEAL" ? (
          <p style={{ color: "var(--muted)" }}>
            The full chain is complete. This page is already showing the reveal order.
          </p>
        ) : null}
        {error ? <p style={{ color: "#8a2712" }}>{error}</p> : null}
      </section>
    </div>
  );
}
