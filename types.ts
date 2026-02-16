
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type ImageSize = '1K' | '2K' | '4K';
export type ModelType = 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  aspectRatio: AspectRatio;
  model: ModelType;
  timestamp: number;
  groundingUrls?: Array<{ title: string; uri: string }>;
}

export interface GenerationSettings {
  prompt: string;
  style: string;
  aspectRatio: AspectRatio;
  size: ImageSize;
  model: ModelType;
  useSearch: boolean;
}

export interface EditRequest {
  imageUri: string;
  editPrompt: string;
}
