
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GenerationSettings, ModelType, AspectRatio, ImageSize } from "../types";

// Fix: Use the AIStudio type as expected by the environment to avoid re-declaration conflicts
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio: AIStudio;
  }
}

export class GeminiService {
  // Fix: Always use process.env.API_KEY directly for initializing GoogleGenAI
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  static async checkProApiKey() {
    if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }
  }

  static async enhancePrompt(prompt: string, useSearch: boolean) {
    const ai = this.getAI();
    const config: any = {};
    
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a creative director. Enhance the following image generation prompt to be more descriptive, artistic, and detailed. 
        Focus on lighting, texture, composition, and mood. 
        Keep it to one paragraph. 
        Current prompt: "${prompt}"`,
        config
      });

      return {
        enhancedPrompt: response.text?.trim() || prompt,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
    } catch (error) {
      console.error("Failed to enhance prompt:", error);
      return { enhancedPrompt: prompt, groundingMetadata: [] };
    }
  }

  static async generateImage(settings: GenerationSettings) {
    if (settings.model === 'gemini-3-pro-image-preview') {
      await this.checkProApiKey();
    }

    const ai = this.getAI();
    const fullPrompt = `${settings.prompt}. ${settings.style !== 'none' ? settings.style : ''}`;

    const config: any = {
      imageConfig: {
        aspectRatio: settings.aspectRatio,
      }
    };

    if (settings.model === 'gemini-3-pro-image-preview') {
      config.imageConfig.imageSize = settings.size;
    }

    try {
      const response = await ai.models.generateContent({
        model: settings.model,
        contents: {
          parts: [{ text: fullPrompt }]
        },
        config
      });

      let base64Image = '';
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!base64Image) {
        throw new Error("No image data found in response");
      }

      return base64Image;
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        // Handle race condition/stale key
        await window.aistudio?.openSelectKey();
      }
      throw error;
    }
  }

  static async editImage(originalImageBase64: string, editPrompt: string) {
    const ai = this.getAI();
    // Use gemini-2.5-flash-image for editing
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: originalImageBase64.split(',')[1],
              mimeType: 'image/png'
            }
          },
          { text: editPrompt }
        ]
      }
    });

    let base64Image = '';
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!base64Image) {
      throw new Error("Editing failed: No image returned");
    }

    return base64Image;
  }
}
