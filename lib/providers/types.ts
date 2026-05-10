export type GeneratedImageResult = {
  mimeType: string;
  bytes: Buffer;
};

export interface ImageProvider {
  generateImage(prompt: string): Promise<GeneratedImageResult>;
}
