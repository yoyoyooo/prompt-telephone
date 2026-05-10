import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const MIME_TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { path: slug } = await context.params;
  const relativePath = slug.join("/");
  const absolutePath = path.join(process.cwd(), relativePath);
  const extension = path.extname(absolutePath).toLowerCase();

  try {
    const bytes = await readFile(absolutePath);

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
