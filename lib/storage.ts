import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "games");

type SaveRoundImageInput = {
  gameId: string;
  roundIndex: number;
  bytes: Buffer;
  mimeType: string;
};

function getExtension(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/svg+xml":
      return "svg";
    default:
      throw new Error(`Unsupported image mime type: ${mimeType}`);
  }
}

export async function saveRoundImage(input: SaveRoundImageInput) {
  const extension = getExtension(input.mimeType);
  const gameDirectory = path.join(STORAGE_ROOT, input.gameId);

  await mkdir(gameDirectory, { recursive: true });

  const fileName = `round-${input.roundIndex}.${extension}`;
  const absolutePath = path.join(gameDirectory, fileName);
  const relativePath = path.join("storage", "games", input.gameId, fileName);

  await writeFile(absolutePath, input.bytes);

  return {
    absolutePath,
    relativePath,
  };
}
