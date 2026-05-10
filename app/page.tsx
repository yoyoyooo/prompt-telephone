import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "72px 24px 96px",
      }}
    >
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
          Serving MVP
        </p>
        <h1 style={{ fontSize: 48, margin: "12px 0 16px" }}>Prompt Telephone</h1>
        <p style={{ margin: 0, maxWidth: 640, color: "var(--muted)", lineHeight: 1.6 }}>
          A party game that doubles as a serving-systems exercise. Create a prompt,
          enqueue image generation, hand the result to the next player, and watch the
          chain drift.
        </p>
        <div style={{ marginTop: 24 }}>
          <Link href="/games/new">Create a game</Link>
        </div>
      </div>
    </main>
  );
}
