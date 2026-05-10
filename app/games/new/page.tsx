import { NewGameForm } from "@/app/games/new/new-game-form";

export default function NewGamePage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          padding: 32,
          boxShadow: "0 24px 80px rgba(36, 26, 16, 0.08)",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Create Game</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          Start the chain with a prompt. The first image generation job should land in
          the queue immediately after submission.
        </p>
        <NewGameForm />
      </div>
    </main>
  );
}
