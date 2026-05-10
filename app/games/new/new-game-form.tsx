"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function NewGameForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [startingPrompt, setStartingPrompt] = useState("");
  const [roundCount, setRoundCount] = useState(5);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch("/api/games", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startingPrompt,
        roundCount,
      }),
    });

    const payload = (await response.json()) as { error?: string; id?: string };

    if (!response.ok || !payload.id) {
      setError(payload.error ?? "Failed to create game.");
      return;
    }

    startTransition(() => {
      router.push(`/games/${payload.id}`);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: 20,
        marginTop: 24,
      }}
    >
      <label style={{ display: "grid", gap: 8 }}>
        <span>Starting prompt</span>
        <textarea
          value={startingPrompt}
          onChange={(event) => setStartingPrompt(event.target.value)}
          rows={5}
          placeholder="A raccoon DJing on a rooftop at sunset"
          style={{
            width: "100%",
            borderRadius: 16,
            border: "1px solid var(--border)",
            padding: 16,
            background: "rgba(255, 255, 255, 0.68)",
          }}
        />
      </label>

      <label style={{ display: "grid", gap: 8, maxWidth: 220 }}>
        <span>Rounds</span>
        <input
          type="number"
          min={1}
          max={12}
          value={roundCount}
          onChange={(event) => setRoundCount(Number(event.target.value))}
          style={{
            borderRadius: 14,
            border: "1px solid var(--border)",
            padding: "12px 14px",
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
        {isPending ? "Creating..." : "Create game"}
      </button>

      {error ? (
        <p style={{ margin: 0, color: "#8a2712" }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
