import OpenAI from "openai";

import type { ImageProvider } from "@/lib/providers/types";
import { ServiceError } from "@/lib/service-error";

const DEFAULT_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
const DEFAULT_SIZE = process.env.OPENAI_IMAGE_SIZE ?? "1024x1024";
const VALID_IMAGE_SIZES = ["auto", "1024x1024", "1024x1536", "1536x1024"] as const;

type OpenAIImageSize = (typeof VALID_IMAGE_SIZES)[number];

let cachedClient: OpenAI | null = null;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ServiceError(
      "OPENAI_API_KEY is required when IMAGE_PROVIDER is set to openai.",
      500,
    );
  }

  cachedClient ??= new OpenAI({ apiKey });
  return cachedClient;
}

function getImageSize(): OpenAIImageSize {
  if (VALID_IMAGE_SIZES.includes(DEFAULT_SIZE as OpenAIImageSize)) {
    return DEFAULT_SIZE as OpenAIImageSize;
  }

  throw new ServiceError(
    `OPENAI_IMAGE_SIZE must be one of: ${VALID_IMAGE_SIZES.join(", ")}.`,
    500,
  );
}

export const openAiProvider: ImageProvider = {
  async generateImage(prompt) {
    const client = getClient();
    const response = await client.images.generate({
      model: DEFAULT_MODEL,
      prompt,
      size: getImageSize(),
    });

    const imageBase64 = response.data?.[0]?.b64_json;

    if (!imageBase64) {
      throw new Error("OpenAI image response did not include image data.");
    }

    return {
      mimeType: "image/png",
      bytes: Buffer.from(imageBase64, "base64"),
    };
  },
};
